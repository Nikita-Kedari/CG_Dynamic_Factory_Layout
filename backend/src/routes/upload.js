// src/routes/upload.js  — CSV upload → SQL Server insert
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const Papa     = require('papaparse');
const { getPool, sql } = require('../db');
const { requireAuth } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/admin/upload-csv
 *
 * Expected CSV columns (from realistic_factory_layout_C1.csv):
 * factory_code, factory_name, layout_name, canvas_width, canvas_length,
 * area_code, area_name, area_x, area_y, area_width, area_length, area_type,
 * line_code, line_name, line_type, takt_time_sec, capacity_per_shift,
 * ws_code, ws_name, seq, ws_x, ws_y, ws_width, ws_length, max_operators, power_kw,
 * from_ws, to_ws, distance, transport_type, transfer_time_sec
 */
router.post('/upload-csv', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const csvText = req.file.buffer.toString('utf-8');
  const { data: rows, errors } = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  if (errors.length) return res.status(400).json({ error: 'CSV parse error', details: errors });

  const pool = await getPool();

  try {
    // ── 1. Upsert Factory ──────────────────────────────────────────
    const firstRow = rows[0] || {};
    const factoryCode = (firstRow.factory_code || '').trim() || 'FC-IMPORT';
    const factoryName = (firstRow.factory_name || '').trim() || factoryCode;
    
    let factoryId;
    const factRes = await pool.request()
      .input('code', sql.VarChar, factoryCode)
      .query('SELECT factory_id FROM FACTORIES WHERE factory_code = @code');
    if (factRes.recordset.length) {
      factoryId = factRes.recordset[0].factory_id;
    } else {
      const ins = await pool.request()
        .input('code', sql.VarChar, factoryCode)
        .input('name', sql.VarChar, factoryName)
        .query(`
          INSERT INTO FACTORIES (factory_code, factory_name, created_by)
          OUTPUT INSERTED.factory_id
          VALUES (@code, @name, 'csv-import')
        `);
      factoryId = ins.recordset[0].factory_id;
    }

    // ── 2. Create Layout ───────────────────────────────────────────
    const layoutIns = await pool.request()
      .input('fid',  sql.Int,    factoryId)
      .input('name', sql.VarChar, firstRow.layout_name || 'CSV Import')
      .input('cw',   sql.Float,  parseFloat(firstRow.canvas_width)  || 1200)
      .input('cl',   sql.Float,  parseFloat(firstRow.canvas_length) || 800)
      .query(`
        INSERT INTO LAYOUTS (factory_id, layout_name, canvas_width, canvas_length, is_active)
        OUTPUT INSERTED.layout_id
        VALUES (@fid, @name, @cw, @cl, 1)
      `);
    const layoutId = layoutIns.recordset[0].layout_id;

    // ── 3. Create draft Layout Version ────────────────────────────
    const originalName = req.file ? req.file.originalname : 'draft-import.csv';
    let defaultVersionName = 'draft-import';
    if (originalName) {
      const extIdx = originalName.lastIndexOf('.');
      defaultVersionName = extIdx !== -1 ? originalName.substring(0, extIdx) : originalName;
    }

    const versionIns = await pool.request()
      .input('lid',  sql.Int,    layoutId)
      .input('vname', sql.VarChar, defaultVersionName)
      .input('file', sql.VarChar, originalName)
      .input('userId', sql.Int,  req.user.userId)
      .input('username', sql.VarChar, req.user.username)
      .input('csvText', sql.NVarChar, csvText)
      .query(`
        INSERT INTO LAYOUT_VERSIONS (layout_id, version_name, source_csv_filename, imported_by, is_current_version, status, user_id, original_csv)
        OUTPUT INSERTED.layout_version_id
        VALUES (@lid, @vname, @file, @username, 1, 'draft', @userId, @csvText)
      `);
    const versionId = versionIns.recordset[0].layout_version_id;
    await pool.request()
      .input('vid', sql.Int, versionId)
      .input('lid', sql.Int, layoutId)
      .query('UPDATE LAYOUTS SET layout_version_id = @vid WHERE layout_id = @lid');

    // ── 4. Deduplicate and insert Areas ───────────────────────────
    const areaMap = {};
    for (const row of rows) {
      const rawCode = row.area_code || row.area_name;
      const code = rawCode ? rawCode.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
      if (!code || areaMap[code]) continue;
      const ins = await pool.request()
        .input('lid',    sql.Int,    layoutId)
        .input('code',   sql.VarChar, code)
        .input('name',   sql.VarChar, row.area_name || code)
        .input('x',      sql.Float,  parseFloat(row.area_x)      || 0)
        .input('y',      sql.Float,  parseFloat(row.area_y)      || 0)
        .input('w',      sql.Float,  parseFloat(row.area_width)  || 200)
        .input('l',      sql.Float,  parseFloat(row.area_length) || 200)
        .input('type',   sql.VarChar, row.area_type || 'Production')
        .input('vid',    sql.Int,    versionId)
        .query(`
          INSERT INTO AREAS (layout_id, external_area_code, area_name, pos_x, pos_y, width, length, area_type, layout_version_id)
          OUTPUT INSERTED.area_id
          VALUES (@lid, @code, @name, @x, @y, @w, @l, @type, @vid)
        `);
      areaMap[code] = ins.recordset[0].area_id;
    }

    // ── 5. Deduplicate and insert Production Lines ─────────────────
    const lineMap = {};
    for (const row of rows) {
      const rawCode = row.line_code || row.line_name;
      const code = rawCode ? rawCode.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
      if (!code || lineMap[code]) continue;
      
      const rawAreaCode = row.area_code || row.area_name;
      const areaCode = rawAreaCode ? rawAreaCode.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
      const areaId = areaMap[areaCode];
      if (!areaId) continue;
      
      const ins = await pool.request()
        .input('aid',   sql.Int,    areaId)
        .input('code',  sql.VarChar, code)
        .input('name',  sql.VarChar, row.line_name || code)
        .input('type',  sql.VarChar, row.line_type || 'Straight')
        .input('takt',  sql.Int,    parseInt(row.takt_time_sec)      || 60)
        .input('cap',   sql.Int,    parseInt(row.capacity_per_shift)  || 100)
        .input('lid',   sql.Int,    layoutId)
        .input('vid',   sql.Int,    versionId)
        .query(`
          INSERT INTO PRODUCTION_LINES (area_id, external_line_code, line_name, line_type, takt_time_sec, capacity_per_shift, layout_id, layout_version_id)
          OUTPUT INSERTED.line_id
          VALUES (@aid, @code, @name, @type, @takt, @cap, @lid, @vid)
        `);
      lineMap[code] = ins.recordset[0].line_id;
    }

    // ── 6. Deduplicate and insert Workstations ────────────────────
    const wsMap = {};
    for (const row of rows) {
      const code = row.ws_code;
      if (!code || wsMap[code]) continue;
      
      const rawLineCode = row.line_code || row.line_name;
      const lineCode = rawLineCode ? rawLineCode.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
      const lineId = lineMap[lineCode];
      if (!lineId) continue;
      const ins = await pool.request()
        .input('lid',    sql.Int,    lineId)
        .input('code',   sql.VarChar, code)
        .input('name',   sql.VarChar, row.ws_name || code)
        .input('seq',    sql.Int,    parseInt(row.seq) || 1)
        .input('x',      sql.Float,  parseFloat(row.ws_x)      || 0)
        .input('y',      sql.Float,  parseFloat(row.ws_y)      || 0)
        .input('w',      sql.Float,  parseFloat(row.ws_width)  || 80)
        .input('l',      sql.Float,  parseFloat(row.ws_length) || 80)
        .input('ops',    sql.Int,    parseInt(row.max_operators) || 1)
        .input('pwr',    sql.Float,  parseFloat(row.power_kw)   || 0)
        .input('detail', sql.NVarChar, row.detail || '')
        .query(`
          INSERT INTO WORKSTATIONS (line_id, ws_code, ws_name, sequence_number, pos_x, pos_y, width, length, max_operators, power_requirement_kw, detail)
          OUTPUT INSERTED.ws_id
          VALUES (@lid, @code, @name, @seq, @x, @y, @w, @l, @ops, @pwr, @detail)
        `);
      const wsId = ins.recordset[0].ws_id;
      wsMap[code] = wsId;

      // --- AUTO-INITIALIZE PARAMETERS FOR THIS LAYOUT VERSION ---
      // We use the ws_code as the identifier for parameters (e.g. 'W1')
      await pool.request()
        .input('vid', sql.Int, versionId)
        .input('wsid', sql.VarChar, code.toLowerCase())
        .query(`
          INSERT INTO WORKSTATION_Parameters (layout_version_id, ws_id, status, oee, orders)
          VALUES (@vid, @wsid, 'Running', '0', 'N/A')
        `);
    }

    // ── 7. Flows ──────────────────────────────────────────────────
    for (const row of rows) {
      if (!row.from_ws || !row.to_ws) continue;
      const from = wsMap[row.from_ws];
      const to   = wsMap[row.to_ws];
      if (!from || !to) continue;
      await pool.request()
        .input('from', sql.Int,    from)
        .input('to',   sql.Int,    to)
        .input('dist', sql.Float,  parseFloat(row.distance)          || 0)
        .input('type', sql.VarChar, row.transport_type               || 'Manual')
        .input('time', sql.Int,    parseInt(row.transfer_time_sec)   || 0)
        .query(`
          INSERT INTO WORKSTATION_FLOW (from_ws_id, to_ws_id, distance, transport_type, avg_transfer_time_sec)
          VALUES (@from, @to, @dist, @type, @time)
        `);
    }

    res.json({ success: true, layout_version_id: versionId, layout_id: layoutId, factory_id: factoryId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
