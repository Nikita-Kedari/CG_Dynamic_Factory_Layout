const fs = require('fs');
const path = require('path');
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

const BACKFILL_MAP = [
  { id: 1019, file: 'factory_layout_base(T3_v2).csv' },
  { id: 1021, file: 'clean_automotive_layout (final).csv' },
  { id: 1022, file: 'factory_layout_base(T2).csv' },
  { id: 1023, file: 'clean_automotive_layout (v1).csv' },
  { id: 1024, file: 'clean_automotive_layout.csv' },
  { id: 1020, file: 'factory_layout_base(T1) (1).csv' },
  { id: 1017, file: 'clean_automotive_layout.csv' }
];

async function main() {
  try {
    const pool = await sql.connect(config);
    console.log("Connected to SQL Server.");

    for (const item of BACKFILL_MAP) {
      const csvPath = path.join(__dirname, '../csv_files', item.file);
      if (fs.existsSync(csvPath)) {
        const csvText = fs.readFileSync(csvPath, 'utf8');
        await pool.request()
          .input('vid', sql.Int, item.id)
          .input('csv', sql.NVarChar, csvText)
          .query('UPDATE LAYOUT_VERSIONS SET original_csv = @csv WHERE layout_version_id = @vid');
        console.log(`Successfully backfilled original_csv for version ${item.id} from ${item.file}`);
      } else {
        console.warn(`File not found: ${item.file}`);
      }
    }

    await sql.close();
    console.log("Backfill operation complete.");
  } catch (err) {
    console.error("Error during backfill:", err);
  }
}

main();
