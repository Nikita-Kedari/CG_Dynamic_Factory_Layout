// src/routes/layouts.js  — Full layout management routes
const express = require('express');
const router  = express.Router();
const Papa    = require('papaparse');
const { getPool, sql } = require('../db');
const { requireAuth } = require('../middleware/auth');

// ──────────────────────────────────────────────
// GET /api/layouts/pending-count
// Returns count of versions with status='pending' (for admin badge)
// ──────────────────────────────────────────────
router.get('/pending-count', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      "SELECT COUNT(*) AS cnt FROM LAYOUT_VERSIONS WHERE status = 'pending'"
    );
    res.json({ count: result.recordset[0].cnt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/layouts
// Returns all layout versions (flat list) with status for dashboard tables
// ──────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const role = req.user.role;
    const userId = req.user.userId;

    let queryStr = `
      SELECT
        lv.layout_version_id  AS id,
        lv.version_name       AS version,
        l.layout_name         AS name,
        lv.status,
        lv.admin_comments,
        lv.reviewed_by,
        lv.reviewed_at,
        lv.imported_at        AS createdAt,
        lv.is_current_version AS isActive,
        l.layout_id,
        l.canvas_width,
        l.canvas_length,
        f.factory_name,
        f.factory_code
      FROM LAYOUT_VERSIONS lv
      JOIN LAYOUTS   l ON l.layout_id  = lv.layout_id
      JOIN FACTORIES f ON f.factory_id = l.factory_id
    `;

    const request = pool.request();

    if (role === 'developer') {
      queryStr += ` WHERE lv.user_id = @userId `;
      request.input('userId', sql.Int, userId);
    }

    queryStr += ` ORDER BY lv.layout_version_id DESC`;

    const result = await request.query(queryStr);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/layouts/active
// Returns the full nested hierarchy of the latest current version
// ──────────────────────────────────────────────
router.get('/active', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();

    const versionRes = await pool.request().query(`
      SELECT TOP 1
        lv.layout_version_id, lv.version_name, lv.imported_at, lv.status,
        l.layout_id, l.layout_name, l.canvas_width, l.canvas_length, l.unit_scale,
        f.factory_id, f.factory_name, f.factory_code, f.location
      FROM LAYOUT_VERSIONS lv
      JOIN LAYOUTS         l  ON l.layout_id   = lv.layout_id
      JOIN FACTORIES       f  ON f.factory_id  = l.factory_id
      WHERE lv.is_current_version = 1
      ORDER BY lv.layout_version_id DESC
    `);
    if (!versionRes.recordset.length)
      return res.status(404).json({ error: 'No active layout version found' });

    const version = versionRes.recordset[0];
    return buildAndSendLayout(pool, version, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/layouts/active
// Make a layout version live / active
// Body: { id }
// ──────────────────────────────────────────────
router.post('/active', requireAuth, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Layout version ID required' });

  try {
    const pool = await getPool();

    // 1. Get layout_id for this version
    const lvRes = await pool.request()
      .input('vid', sql.Int, parseInt(id))
      .query('SELECT layout_id FROM LAYOUT_VERSIONS WHERE layout_version_id = @vid');

    if (!lvRes.recordset.length) return res.status(404).json({ error: 'Version not found' });
    const layoutId = lvRes.recordset[0].layout_id;

    // 2. Set all other versions of this layout to inactive
    await pool.request()
      .input('lid', sql.Int, layoutId)
      .query('UPDATE LAYOUT_VERSIONS SET is_current_version = 0 WHERE layout_id = @lid');

    // 3. Set this version to active
    await pool.request()
      .input('vid', sql.Int, parseInt(id))
      .query('UPDATE LAYOUT_VERSIONS SET is_current_version = 1 WHERE layout_version_id = @vid');

    res.json({ success: true, message: 'Layout version is now live' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/layouts/:id/view
// Public read-only nested layout by version ID (no auth required)
// ──────────────────────────────────────────────
router.get('/:id/view', async (req, res) => {
  try {
    const pool = await getPool();
    const versionRes = await pool.request()
      .input('vid', sql.Int, parseInt(req.params.id))
      .query(`
        SELECT
          lv.layout_version_id, lv.version_name, lv.imported_at, lv.status,
          lv.admin_comments, lv.reviewed_by, lv.reviewed_at,
          l.layout_id, l.layout_name, l.canvas_width, l.canvas_length, l.unit_scale,
          f.factory_id, f.factory_name, f.factory_code, f.location
        FROM LAYOUT_VERSIONS lv
        JOIN LAYOUTS   l ON l.layout_id  = lv.layout_id
        JOIN FACTORIES f ON f.factory_id = l.factory_id
        WHERE lv.layout_version_id = @vid
      `);
    if (!versionRes.recordset.length)
      return res.status(404).json({ error: 'Layout version not found' });

    const version = versionRes.recordset[0];
    return buildAndSendLayout(pool, version, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/layouts/:versionId/csv
// Export the synchronized CSV from the latest saved state of a layout version
// ──────────────────────────────────────────────
router.get('/:versionId/csv', requireAuth, async (req, res) => {
  const versionId = parseInt(req.params.versionId);
  try {
    const pool = await getPool();

    // 1. Get the layout version metadata and original CSV
    const lvRes = await pool.request()
      .input('vid', sql.Int, versionId)
      .query('SELECT * FROM LAYOUT_VERSIONS WHERE layout_version_id = @vid');

    if (!lvRes.recordset.length) return res.status(404).json({ error: 'Layout version not found' });
    const version = lvRes.recordset[0];
    const originalCsvText = version.original_csv;

    // 2. Fetch the latest saved state from the database
    // Fetch areas, production lines, and workstations
    const wsRes = await pool.request()
      .input('vid', sql.Int, versionId)
      .query(`
        SELECT 
          w.*, 
          pl.line_type, pl.external_line_code, pl.line_name, pl.takt_time_sec, pl.capacity_per_shift,
          a.external_area_code, a.area_name, a.pos_x AS area_x, a.pos_y AS area_y, a.width AS area_width, a.length AS area_length, a.area_type
        FROM WORKSTATIONS w
        JOIN PRODUCTION_LINES pl ON pl.line_id = w.line_id
        JOIN AREAS a ON a.area_id = pl.area_id
        WHERE pl.layout_version_id = @vid
      `);

    const workstations = wsRes.recordset;

    // Fetch flows
    const flowsRes = await pool.request()
      .input('vid', sql.Int, versionId)
      .query(`
        SELECT wf.*, w1.ws_code AS from_code, w2.ws_code AS to_code
        FROM WORKSTATION_FLOW wf
        JOIN WORKSTATIONS w1 ON w1.ws_id = wf.from_ws_id
        JOIN WORKSTATIONS w2 ON w2.ws_id = wf.to_ws_id
        JOIN PRODUCTION_LINES pl ON pl.line_id = w1.line_id
        WHERE pl.layout_version_id = @vid
      `);

    const databaseFlows = flowsRes.recordset;

    // 3. If there is no original CSV saved, fallback to generating a clean CSV from scratch
    if (!originalCsvText) {
      const fallbackHeaders = [
        'area_name', 'area_x', 'area_y', 'area_width', 'area_length', 'area_type',
        'line_name', 'line_type', 'takt_time_sec', 'capacity_per_shift',
        'ws_code', 'ws_name', 'ws_x', 'ws_y', 'ws_width', 'ws_length', 'max_operators', 'power_kw',
        'from_ws', 'to_ws', 'distance', 'transport_type', 'transfer_time_sec', 'detail'
      ];
      
      const newRows = [];
      const flowMap = {};
      databaseFlows.forEach(f => {
        if (!flowMap[f.from_code]) flowMap[f.from_code] = f;
      });

      workstations.forEach(w => {
        const flow = flowMap[w.ws_code] || {};
        newRows.push({
          area_name: w.area_name,
          area_x: Math.round(w.area_x),
          area_y: Math.round(w.area_y),
          area_width: Math.round(w.area_width),
          area_length: Math.round(w.area_length),
          area_type: w.area_type,
          line_name: w.line_name,
          line_type: w.line_type,
          takt_time_sec: w.takt_time_sec,
          capacity_per_shift: w.capacity_per_shift,
          ws_code: w.ws_code,
          ws_name: w.ws_name,
          ws_x: Math.round(w.pos_x),
          ws_y: Math.round(w.pos_y),
          ws_width: Math.round(w.width),
          ws_length: Math.round(w.length),
          max_operators: w.max_operators,
          power_kw: w.power_requirement_kw,
          from_ws: flow.from_code || '',
          to_ws: flow.to_code || '',
          distance: flow.distance || '',
          transport_type: flow.transport_type || '',
          transfer_time_sec: flow.avg_transfer_time_sec || '',
          detail: w.detail || ''
        });
      });

      const csvString = Papa.unparse({ fields: fallbackHeaders, data: newRows });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(version.version_name)}.csv`);
      return res.send(csvString);
    }

    // 4. Parse original CSV to do a round-trip synchronization
    const { data: originalRows, meta } = Papa.parse(originalCsvText, { header: true, skipEmptyLines: true });
    const headers = meta.fields;

    // Create workstation lookups
    const wsLookup = {};
    workstations.forEach(w => {
      if (w.ws_code) wsLookup[w.ws_code.toLowerCase()] = w;
      if (w.ws_name) wsLookup[w.ws_name.toLowerCase()] = w;
    });

    const usedWcIds = new Set();
    const updatedRows = [];

    // Map each original CSV row to updated database values
    for (const row of originalRows) {
      const wsCode = (row.ws_code || '').trim().toLowerCase();
      const wsName = (row.ws_name || '').trim().toLowerCase();
      const ws = wsLookup[wsCode] || wsLookup[wsName];

      if (ws) {
        usedWcIds.add(ws.ws_id);
        const updatedRow = { ...row };

        // Map database updates into the row, matching key casing from headers
        headers.forEach(h => {
          const lowerH = h.toLowerCase();

          // Area level
          if (lowerH === 'area_name') updatedRow[h] = ws.area_name;
          if (lowerH === 'area_x') updatedRow[h] = Math.round(ws.area_x);
          if (lowerH === 'area_y') updatedRow[h] = Math.round(ws.area_y);
          if (lowerH === 'area_width') updatedRow[h] = Math.round(ws.area_width);
          if (lowerH === 'area_length') updatedRow[h] = Math.round(ws.area_length);
          if (lowerH === 'area_type') updatedRow[h] = ws.area_type;

          // Line level
          if (lowerH === 'line_name') updatedRow[h] = ws.line_name;
          if (lowerH === 'line_type') updatedRow[h] = ws.line_type;
          if (lowerH === 'takt_time_sec') updatedRow[h] = ws.takt_time_sec;
          if (lowerH === 'capacity_per_shift') updatedRow[h] = ws.capacity_per_shift;

          // Workstation level
          if (lowerH === 'ws_code') updatedRow[h] = ws.ws_code;
          if (lowerH === 'ws_name') updatedRow[h] = ws.ws_name;
          if (lowerH === 'ws_x') updatedRow[h] = Math.round(ws.pos_x);
          if (lowerH === 'ws_y') updatedRow[h] = Math.round(ws.pos_y);
          if (lowerH === 'ws_width') updatedRow[h] = Math.round(ws.width);
          if (lowerH === 'ws_length') updatedRow[h] = Math.round(ws.length);
          if (lowerH === 'max_operators') updatedRow[h] = ws.max_operators;
          if (lowerH === 'power_kw') updatedRow[h] = ws.power_requirement_kw;
          if (lowerH === 'detail') updatedRow[h] = ws.detail || '';
        });

        // Flow level (optional, if flows exist in original CSV, find corresponding database flow)
        const hasFlows = headers.some(h => ['from_ws', 'to_ws'].includes(h.toLowerCase()));
        if (hasFlows) {
          const flow = databaseFlows.find(f => f.from_code.toLowerCase() === wsCode || f.from_code.toLowerCase() === wsName);
          if (flow) {
            headers.forEach(h => {
              const lowerH = h.toLowerCase();
              if (lowerH === 'from_ws') updatedRow[h] = flow.from_code;
              if (lowerH === 'to_ws') updatedRow[h] = flow.to_code;
              if (lowerH === 'distance') updatedRow[h] = flow.distance || '';
              if (lowerH === 'transport_type') updatedRow[h] = flow.transport_type || '';
              if (lowerH === 'transfer_time_sec') updatedRow[h] = flow.avg_transfer_time_sec || '';
            });
          } else {
            headers.forEach(h => {
              const lowerH = h.toLowerCase();
              if (['from_ws', 'to_ws', 'distance', 'transport_type', 'transfer_time_sec'].includes(lowerH)) {
                updatedRow[h] = '';
              }
            });
          }
        }

        updatedRows.push(updatedRow);
      } else {
        // Workstation was not found in active database workstations (deleted)
        if (!row.ws_code && !row.ws_name) {
          updatedRows.push(row);
        }
      }
    }

    // Append newly manually-added workstations
    const addedWorkstations = workstations.filter(w => !usedWcIds.has(w.ws_id));
    if (addedWorkstations.length > 0) {
      const flowMap = {};
      databaseFlows.forEach(f => {
        if (!flowMap[f.from_code]) flowMap[f.from_code] = f;
      });

      addedWorkstations.forEach(w => {
        const newRow = {};
        headers.forEach(h => {
          const lowerH = h.toLowerCase();
          
          newRow[h] = '';

          // Area level
          if (lowerH === 'area_name') newRow[h] = w.area_name;
          if (lowerH === 'area_x') newRow[h] = Math.round(w.area_x);
          if (lowerH === 'area_y') newRow[h] = Math.round(w.area_y);
          if (lowerH === 'area_width') newRow[h] = Math.round(w.area_width);
          if (lowerH === 'area_length') newRow[h] = Math.round(w.area_length);
          if (lowerH === 'area_type') newRow[h] = w.area_type;

          // Line level
          if (lowerH === 'line_name') newRow[h] = w.line_name;
          if (lowerH === 'line_type') newRow[h] = w.line_type;
          if (lowerH === 'takt_time_sec') newRow[h] = w.takt_time_sec;
          if (lowerH === 'capacity_per_shift') newRow[h] = w.capacity_per_shift;

          // Workstation level
          if (lowerH === 'ws_code') newRow[h] = w.ws_code;
          if (lowerH === 'ws_name') newRow[h] = w.ws_name;
          if (lowerH === 'ws_x') newRow[h] = Math.round(w.pos_x);
          if (lowerH === 'ws_y') newRow[h] = Math.round(w.pos_y);
          if (lowerH === 'ws_width') newRow[h] = Math.round(w.width);
          if (lowerH === 'ws_length') newRow[h] = Math.round(w.length);
          if (lowerH === 'max_operators') newRow[h] = w.max_operators;
          if (lowerH === 'power_kw') newRow[h] = w.power_requirement_kw;
          if (lowerH === 'detail') newRow[h] = w.detail || '';

          // Flow level
          const flow = flowMap[w.ws_code] || {};
          if (lowerH === 'from_ws') newRow[h] = flow.from_code || '';
          if (lowerH === 'to_ws') newRow[h] = flow.to_code || '';
          if (lowerH === 'distance') newRow[h] = flow.distance || '';
          if (lowerH === 'transport_type') newRow[h] = flow.transport_type || '';
          if (lowerH === 'transfer_time_sec') newRow[h] = flow.avg_transfer_time_sec || '';
        });
        updatedRows.push(newRow);
      });
    }

    const csvString = Papa.unparse({ fields: headers, data: updatedRows });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(version.version_name)}.csv`);
    res.send(csvString);

  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/layouts/:id  (single version meta)
// ──────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM LAYOUTS WHERE layout_id = @id');
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/layouts/:id/pass-to-admin
// Developer submits a version for admin review
// ──────────────────────────────────────────────
router.post('/:id/pass-to-admin', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('vid', sql.Int, parseInt(req.params.id))
      .query("UPDATE LAYOUT_VERSIONS SET status = 'pending' WHERE layout_version_id = @vid");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/layouts/:id/approve
// Admin approves a version
// Body: { reviewed_by }
// ──────────────────────────────────────────────
router.post('/:id/approve', requireAuth, async (req, res) => {
  const { reviewed_by = 'admin' } = req.body;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  try {
    const pool = await getPool();
    await pool.request()
      .input('vid', sql.Int, parseInt(req.params.id))
      .input('by',  sql.NVarChar, reviewed_by)
      .query(`
        UPDATE LAYOUT_VERSIONS
        SET status = 'approved', reviewed_by = @by, reviewed_at = GETDATE()
        WHERE layout_version_id = @vid
      `);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/layouts/:id/reject
// Admin rejects/disapproves a version
// Body: { reviewed_by, admin_comments }
// ──────────────────────────────────────────────
router.post('/:id/reject', requireAuth, async (req, res) => {
  const { reviewed_by = 'admin', admin_comments = '' } = req.body;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  try {
    const pool = await getPool();
    await pool.request()
      .input('vid',      sql.Int,      parseInt(req.params.id))
      .input('by',       sql.NVarChar, reviewed_by)
      .input('comments', sql.NVarChar, admin_comments)
      .query(`
        UPDATE LAYOUT_VERSIONS
        SET status = 'rejected', reviewed_by = @by, reviewed_at = GETDATE(), admin_comments = @comments
        WHERE layout_version_id = @vid
      `);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/layouts/:id/comment
// Admin adds/updates comments on a version (without changing status)
// Body: { admin_comments, reviewed_by }
// ──────────────────────────────────────────────
router.post('/:id/comment', requireAuth, async (req, res) => {
  const { admin_comments = '', reviewed_by = 'admin', status } = req.body;
  try {
    const pool = await getPool();
    let query = `
      UPDATE LAYOUT_VERSIONS
      SET admin_comments = @comments, reviewed_by = @by, reviewed_at = GETDATE()
    `;
    
    const request = pool.request()
      .input('vid',      sql.Int,      parseInt(req.params.id))
      .input('comments', sql.NVarChar, admin_comments)
      .input('by',       sql.NVarChar, reviewed_by);

    if (status) {
      query += `, status = @status `;
      request.input('status', sql.NVarChar, status);
    }

    query += ` WHERE layout_version_id = @vid`;
    
    await request.query(query);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// PATCH /api/layouts/:draftId/sync
// Batch-update workstation positions from the canvas
// Body: { workstations: [{ ws_id, pos_x, pos_y, width, length }] }
// ──────────────────────────────────────────────
router.patch('/:draftId/sync', requireAuth, async (req, res) => {
  const { workstations = [] } = req.body;
  try {
    const pool = await getPool();
    for (const ws of workstations) {
      await pool.request()
        .input('x',   sql.Float, ws.pos_x)
        .input('y',   sql.Float, ws.pos_y)
        .input('w',   sql.Float, ws.width)
        .input('l',   sql.Float, ws.length)
        .input('id',  sql.Int,   ws.ws_id)
        .query('UPDATE WORKSTATIONS SET pos_x=@x, pos_y=@y, width=@w, length=@l WHERE ws_id=@id');
    }
    res.json({ success: true, updated: workstations.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// PATCH /api/layouts/:versionId/sync-areas
// Batch-update area positions/sizes from the canvas
// Body: { areas: [{ area_id, pos_x, pos_y, width, length }] }
// ──────────────────────────────────────────────
router.patch('/:versionId/sync-areas', requireAuth, async (req, res) => {
  const { areas = [] } = req.body;
  try {
    const pool = await getPool();
    for (const area of areas) {
      await pool.request()
        .input('x',  sql.Float, area.pos_x)
        .input('y',  sql.Float, area.pos_y)
        .input('w',  sql.Float, area.width)
        .input('l',  sql.Float, area.length)
        .input('id', sql.Int,   area.area_id)
        .query('UPDATE AREAS SET pos_x=@x, pos_y=@y, width=@w, length=@l WHERE area_id=@id');
    }
    res.json({ success: true, updated: areas.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// PUT /api/layouts/:versionId
// Save full layout state from the visual editor
// Body: { factory: { ... } }
// ──────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  const { factory } = req.body;
  const versionId = parseInt(req.params.id);

  if (!factory) return res.status(400).json({ error: 'Factory data required' });

  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Get version and layout info
      const vRes = await transaction.request()
        .input('vid', sql.Int, versionId)
        .query('SELECT layout_id FROM LAYOUT_VERSIONS WHERE layout_version_id = @vid');
      
      if (!vRes.recordset.length) throw new Error('Layout version not found');
      const layoutId = vRes.recordset[0].layout_id;

      // 2. Update Canvas/Layout dimensions and Layout Version name
      await transaction.request()
        .input('lid', sql.Int, layoutId)
        .input('vid', sql.Int, versionId)
        .input('vname', sql.NVarChar, factory.name || 'CSV Import')
        .input('w',   sql.Float, factory.width || 1200)
        .input('l',   sql.Float, factory.height || 800)
        .query(`
          UPDATE LAYOUTS SET canvas_width = @w, canvas_length = @l WHERE layout_id = @lid;
          UPDATE LAYOUT_VERSIONS SET version_name = @vname WHERE layout_version_id = @vid;
        `);

      // 3. Update Areas
      for (const area of factory.areas) {
        await transaction.request()
          .input('aid', sql.Int, parseInt(area.id))
          .input('x',   sql.Float, area.x)
          .input('y',   sql.Float, area.y)
          .input('w',   sql.Float, area.width)
          .input('l',   sql.Float, area.height)
          .query('UPDATE AREAS SET pos_x = @x, pos_y = @y, width = @w, length = @l WHERE area_id = @aid');

        // 4. Update Lines and Workstations
        for (const line of area.lines) {
          await transaction.request()
            .input('lid',  sql.Int,      parseInt(line.id))
            .input('type', sql.VarChar,  line.lineType || 'Straight')
            .query('UPDATE PRODUCTION_LINES SET line_type = @type WHERE line_id = @lid');

          for (const wc of line.workCenters) {
            await transaction.request()
              .input('wid', sql.Int,      parseInt(wc.id))
              .input('x',   sql.Float,    wc.x)
              .input('y',   sql.Float,    wc.y)
              .input('w',   sql.Float,    wc.width)
              .input('l',   sql.Float,    wc.height)
              .input('det', sql.NVarChar, wc.detail || '')
              .query('UPDATE WORKSTATIONS SET pos_x = @x, pos_y = @y, width = @w, length = @l, detail = @det WHERE ws_id = @wid');
          }
        }
      }

      // 5. Update Flows (Optional: would require clearing and re-inserting)
      // For now, we update positions and line types which covers most visual edits.

      await transaction.commit();
      res.json({ success: true, message: 'Layout persisted to database' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/layouts/:draftId/commit
// Save a named version (developer "Save Version")
// Body: { version_name, change_notes }
// ──────────────────────────────────────────────
router.post('/:draftId/commit', requireAuth, async (req, res) => {
  const { version_name, change_notes } = req.body;
  const draftId = parseInt(req.params.draftId);
  try {
    const pool = await getPool();

    // Get layout_id for this version
    const lvRes = await pool.request()
      .input('vid', sql.Int, draftId)
      .query('SELECT layout_id FROM LAYOUT_VERSIONS WHERE layout_version_id = @vid');
    if (!lvRes.recordset.length) return res.status(404).json({ error: 'Draft not found' });
    const layoutId = lvRes.recordset[0].layout_id;

    // Clear all current versions for this layout
    await pool.request()
      .input('lid', sql.Int, layoutId)
      .query('UPDATE LAYOUT_VERSIONS SET is_current_version = 0 WHERE layout_id = @lid');

    // Update this version as current with new name
    await pool.request()
      .input('vid',   sql.Int,      draftId)
      .input('vname', sql.NVarChar, version_name || 'v-updated')
      .input('notes', sql.NVarChar, change_notes || '')
      .query(`
        UPDATE LAYOUT_VERSIONS
        SET is_current_version = 1,
            version_name       = @vname,
            change_notes       = @notes,
            status             = 'draft',
            published_at       = GETDATE()
        WHERE layout_version_id = @vid
      `);

    res.json({ success: true, layout_version_id: draftId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── helpers ──────────────────────────────────────────────────
async function buildAndSendLayout(pool, version, res) {
  const vid = version.layout_version_id;
  const lid = version.layout_id;

  // Fetch Areas
  const areasRes = await pool.request()
    .input('lid', sql.Int, lid)
    .query('SELECT * FROM AREAS WHERE layout_id = @lid ORDER BY sort_order, area_id');

  // Fetch Production Lines
  const linesRes = await pool.request()
    .input('vid', sql.Int, vid)
    .query('SELECT * FROM PRODUCTION_LINES WHERE layout_version_id = @vid ORDER BY line_id');

  // Fetch Workstations (with detail column)
  const wsRes = await pool.request()
    .input('vid', sql.Int, vid)
    .query(`
      SELECT w.* FROM WORKSTATIONS w
      JOIN PRODUCTION_LINES pl ON pl.line_id = w.line_id
      WHERE pl.layout_version_id = @vid
      ORDER BY w.sequence_number
    `);

  // Fetch Flows
  const flowsRes = await pool.request()
    .input('vid', sql.Int, vid)
    .query(`
      SELECT wf.* FROM WORKSTATION_FLOW wf
      JOIN WORKSTATIONS w ON w.ws_id = wf.from_ws_id
      JOIN PRODUCTION_LINES pl ON pl.line_id = w.line_id
      WHERE pl.layout_version_id = @vid
    `);

  // Build nested hierarchy
  const flowsByFromWs = groupBy(flowsRes.recordset, 'from_ws_id');
  const wsByLine      = groupBy(wsRes.recordset, 'line_id');
  const linesByArea   = groupBy(linesRes.recordset, 'area_id');

  const areas = areasRes.recordset.map(area => ({
    ...area,
    lines: (linesByArea[area.area_id] || []).map(line => ({
      ...line,
      workstations: (wsByLine[line.line_id] || []).map(ws => ({
        ...ws,
        flows: flowsByFromWs[ws.ws_id] || [],
      })),
    })),
  }));

  res.json({
    factory: {
      factory_id:   version.factory_id,
      factory_name: version.factory_name,
      factory_code: version.factory_code,
      location:     version.location,
    },
    canvas: {
      width:      version.canvas_width,
      length:     version.canvas_length,
      unit_scale: version.unit_scale,
    },
    version: {
      layout_version_id: version.layout_version_id,
      version_name:      version.version_name,
      imported_at:       version.imported_at,
      layout_id:         version.layout_id,
      layout_name:       version.layout_name,
      status:            version.status,
      admin_comments:    version.admin_comments,
      reviewed_by:       version.reviewed_by,
      reviewed_at:       version.reviewed_at,
    },
    areas,
  });
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    acc[k] = acc[k] || [];
    acc[k].push(item);
    return acc;
  }, {});
}

module.exports = router;
