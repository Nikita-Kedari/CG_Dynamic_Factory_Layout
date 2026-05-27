const sql = require('mssql');
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

    console.log("\n--- RECENT LAYOUTS & VERSIONS WITH METRICS ---");
    const layouts = await pool.request().query(`
      SELECT TOP 10 
        l.layout_id, 
        l.layout_name, 
        lv.layout_version_id, 
        lv.version_name, 
        lv.source_csv_filename,
        (SELECT COUNT(*) FROM AREAS a WHERE a.layout_id = l.layout_id) AS areas_count,
        (SELECT COUNT(*) FROM PRODUCTION_LINES pl WHERE pl.layout_version_id = lv.layout_version_id) AS lines_count,
        (SELECT COUNT(*) FROM WORKSTATIONS w JOIN PRODUCTION_LINES pl ON pl.line_id = w.line_id WHERE pl.layout_version_id = lv.layout_version_id) AS workstations_count,
        (SELECT COUNT(*) FROM WORKSTATION_FLOW wf JOIN WORKSTATIONS w ON w.ws_id = wf.from_ws_id JOIN PRODUCTION_LINES pl ON pl.line_id = w.line_id WHERE pl.layout_version_id = lv.layout_version_id) AS flows_count
      FROM LAYOUT_VERSIONS lv
      JOIN LAYOUTS l ON l.layout_id = lv.layout_id
      ORDER BY lv.layout_version_id DESC
    `);
    console.log(JSON.stringify(layouts.recordset, null, 2));

    await sql.close();
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
