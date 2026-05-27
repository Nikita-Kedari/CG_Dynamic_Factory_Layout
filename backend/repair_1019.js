const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const Papa = require('papaparse');
require('dotenv').config();

const useWindowsAuth = process.env.DB_WINDOWS_AUTH === 'true';
const server   = process.env.DB_SERVER   || 'localhost';
const database = process.env.DB_DATABASE || 'FactoryLayoutDB';
const port     = parseInt(process.env.DB_PORT || '1433');

let config;
if (useWindowsAuth) {
  config = {
    server,
    port,
    database,
    options: {
      trustServerCertificate: true,
      encrypt: false,
      enableArithAbort: true,
      integratedSecurity: true,
    },
    authentication: {
      type: 'ntlm',
      options: {
        domain:   process.env.DB_DOMAIN   || '',
        userName: process.env.DB_USER     || '',
        password: process.env.DB_PASSWORD || '',
      },
    },
  };
} else {
  config = {
    server,
    port,
    database,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      trustServerCertificate: true,
      encrypt: false,
      enableArithAbort: true,
    },
  };
}

async function main() {
  try {
    const pool = await sql.connect(config);
    console.log("Connected to SQL Server.");

    const layoutId = 1019;
    const versionId = 1019;

    // Load CSV
    const csvPath = path.join(__dirname, '../csv_files/factory_layout_base(T3_v2).csv');
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const { data: rows, errors } = Papa.parse(csvText, { header: true, skipEmptyLines: true });

    if (errors.length) {
      console.error("CSV Parse Errors:", errors);
      await sql.close();
      return;
    }

    console.log(`Parsed ${rows.length} rows from CSV.`);

    // 1. Delete existing for layout 1019 to prevent duplicates
    console.log("Cleaning up layout 1019 details...");
    // delete parameters
    await pool.request().input('vid', sql.Int, versionId).query(`
      DELETE FROM WORKSTATION_Parameters WHERE layout_version_id = @vid
    `);
    // delete flows
    await pool.request().input('vid', sql.Int, versionId).query(`
      DELETE FROM WORKSTATION_FLOW WHERE from_ws_id IN (
        SELECT w.ws_id FROM WORKSTATIONS w
        JOIN PRODUCTION_LINES pl ON pl.line_id = w.line_id
        WHERE pl.layout_version_id = @vid
      ) OR to_ws_id IN (
        SELECT w.ws_id FROM WORKSTATIONS w
        JOIN PRODUCTION_LINES pl ON pl.line_id = w.line_id
        WHERE pl.layout_version_id = @vid
      )
    `);
    // delete workstations
    await pool.request().input('vid', sql.Int, versionId).query(`
      DELETE FROM WORKSTATIONS WHERE line_id IN (
        SELECT line_id FROM PRODUCTION_LINES WHERE layout_version_id = @vid
      )
    `);
    // delete production lines
    await pool.request().input('vid', sql.Int, versionId).query(`
      DELETE FROM PRODUCTION_LINES WHERE layout_version_id = @vid
    `);
    // delete areas
    await pool.request().input('vid', sql.Int, versionId).query(`
      DELETE FROM AREAS WHERE layout_version_id = @vid
    `);

    console.log("Cleanup complete. Inserting new data...");

    // ── 2. Deduplicate and insert Areas ───────────────────────────
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
      console.log(`Inserted Area: ${row.area_name} (${code}) -> ID: ${ins.recordset[0].area_id}`);
    }

    // ── 3. Deduplicate and insert Production Lines ─────────────────
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
      console.log(`Inserted Line: ${row.line_name} (${code}) -> ID: ${ins.recordset[0].line_id}`);
    }

    // ── 4. Deduplicate and insert Workstations ────────────────────
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
      console.log(`Inserted Workstation: ${row.ws_name} (${code}) -> ID: ${wsId}`);

      // --- AUTO-INITIALIZE PARAMETERS FOR THIS LAYOUT VERSION ---
      await pool.request()
        .input('vid', sql.Int, versionId)
        .input('wsid', sql.VarChar, code.toLowerCase())
        .query(`
          INSERT INTO WORKSTATION_Parameters (layout_version_id, ws_id, status, oee, orders)
          VALUES (@vid, @wsid, 'Running', '0', 'N/A')
        `);
    }

    // ── 5. Flows ──────────────────────────────────────────────────
    let flowsCount = 0;
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
      flowsCount++;
    }
    console.log(`Inserted ${flowsCount} workstation flows.`);

    console.log("\n✅ Repair successfully complete! Refresh the editor to view the layout!");
    await sql.close();
  } catch (err) {
    console.error("Error during repair:", err);
  }
}

main();
