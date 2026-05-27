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
    
    const id = 1019;
    
    console.log("\n--- LAYOUTS ---");
    const layouts = await pool.request().input('id', sql.Int, id).query("SELECT * FROM LAYOUTS WHERE layout_id = @id");
    console.log(JSON.stringify(layouts.recordset, null, 2));
    
    console.log("\n--- LAYOUT_VERSIONS for layout_id ---");
    const versions = await pool.request().input('id', sql.Int, id).query("SELECT * FROM LAYOUT_VERSIONS WHERE layout_id = @id");
    console.log(JSON.stringify(versions.recordset, null, 2));

    console.log("\n--- LAYOUT_VERSIONS by layout_version_id = 1019 ---");
    const versionsById = await pool.request().input('id', sql.Int, id).query("SELECT * FROM LAYOUT_VERSIONS WHERE layout_version_id = @id");
    console.log(JSON.stringify(versionsById.recordset, null, 2));
    
    if (versionsById.recordset.length > 0) {
      const v = versionsById.recordset[0];
      const areas = await pool.request().input('lid', sql.Int, v.layout_id).query("SELECT * FROM AREAS WHERE layout_id = @lid");
      console.log(`\n--- AREAS for layout_id ${v.layout_id} ---`);
      console.log(JSON.stringify(areas.recordset, null, 2));
      
      const lines = await pool.request().input('vid', sql.Int, id).query("SELECT * FROM PRODUCTION_LINES WHERE layout_version_id = @vid");
      console.log(`\n--- PRODUCTION LINES for version_id ${id} ---`);
      console.log(JSON.stringify(lines.recordset, null, 2));
      
      const workstations = await pool.request().input('vid', sql.Int, id).query(`
        SELECT w.* FROM WORKSTATIONS w
        JOIN PRODUCTION_LINES pl ON pl.line_id = w.line_id
        WHERE pl.layout_version_id = @vid
      `);
      console.log(`\n--- WORKSTATIONS for version_id ${id} ---`);
      console.log(JSON.stringify(workstations.recordset, null, 2));
    }

    await sql.close();
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
