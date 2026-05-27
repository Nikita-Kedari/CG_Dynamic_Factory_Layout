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

    console.log("\n--- COUNT OF WORKSTATION_FLOWS IN DATABASE ---");
    const countRes = await pool.request().query("SELECT COUNT(*) AS cnt FROM WORKSTATION_FLOW");
    console.log(`Total Flows in DB: ${countRes.recordset[0].cnt}`);

    console.log("\n--- RECENT WORKSTATION_FLOWS ---");
    const flows = await pool.request().query(`
      SELECT TOP 10 wf.*, w1.ws_code AS from_code, w2.ws_code AS to_code 
      FROM WORKSTATION_FLOW wf
      JOIN WORKSTATIONS w1 ON w1.ws_id = wf.from_ws_id
      JOIN WORKSTATIONS w2 ON w2.ws_id = wf.to_ws_id
    `);
    console.log(JSON.stringify(flows.recordset, null, 2));

    await sql.close();
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
