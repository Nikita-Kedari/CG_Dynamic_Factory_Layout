// src/routes/layouts.js  — Full layout management routes
const express = require('express');
const router  = express.Router();
const { getPool, sql } = require('../db');

// ──────────────────────────────────────────────
// GET /api/layouts/pending-count
// Returns count of versions with status='pending' (for admin badge)
// ──────────────────────────────────────────────
router.get('/pending-count', async (req, res) => {
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
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
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
      ORDER BY lv.layout_version_id DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/layouts/active
// Returns the full nested hierarchy of the latest current version
// ──────────────────────────────────────────────
router.get('/active', async (req, res) => {
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
// GET /api/layouts/:id  (single version meta)
// ──────────────────────────────────────────────
router.get('/:id', async (req, res) => {
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
router.post('/:id/pass-to-admin', async (req, res) => {
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
router.post('/:id/approve', async (req, res) => {
  const { reviewed_by = 'admin' } = req.body;
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
router.post('/:id/reject', async (req, res) => {
  const { reviewed_by = 'admin', admin_comments = '' } = req.body;
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
router.post('/:id/comment', async (req, res) => {
  const { admin_comments = '', reviewed_by = 'admin' } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('vid',      sql.Int,      parseInt(req.params.id))
      .input('comments', sql.NVarChar, admin_comments)
      .input('by',       sql.NVarChar, reviewed_by)
      .query(`
        UPDATE LAYOUT_VERSIONS
        SET admin_comments = @comments, reviewed_by = @by, reviewed_at = GETDATE()
        WHERE layout_version_id = @vid
      `);
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
router.patch('/:draftId/sync', async (req, res) => {
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
router.patch('/:versionId/sync-areas', async (req, res) => {
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
// POST /api/layouts/:draftId/commit
// Save a named version (developer "Save Version")
// Body: { version_name, change_notes }
// ──────────────────────────────────────────────
router.post('/:draftId/commit', async (req, res) => {
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
