// src/db.js  — SQL Server connection pool (mssql / tedious)
const sql = require('mssql');
require('dotenv').config();

const useWindowsAuth = process.env.DB_WINDOWS_AUTH === 'true';
const server   = process.env.DB_SERVER   || 'localhost';
const database = process.env.DB_DATABASE || 'FactoryLayoutDB';
const port     = parseInt(process.env.DB_PORT || '1433');

// ── Build config based on auth mode ─────────────────────────────────────────
let config;

if (useWindowsAuth) {
  // Windows Integrated Auth via tedious
  // Requires TCP/IP enabled in SQL Server Configuration Manager
  config = {
    server,
    port,
    database,
    domain:   process.env.DB_DOMAIN || '',   // leave blank for local
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
  // SQL Server Login (username + password)
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

let pool = null;

/**
 * Returns a singleton connected pool.
 * Lazy — first call triggers the TCP connection to SQL Server.
 */
async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(config);
      console.log(`✅  Connected to SQL Server → ${server}:${port}/${database}`);

      // Auto-create & seed USERS table if missing
      try {
        await pool.request().query(`
          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'USERS')
          BEGIN
            CREATE TABLE USERS (
              user_id          INT IDENTITY(1,1) PRIMARY KEY,
              username         VARCHAR(100) NOT NULL UNIQUE,
              password_hash    VARCHAR(255) NOT NULL,
              role             VARCHAR(50)  NOT NULL,
              created_at       DATETIME     DEFAULT GETDATE()
            );

            -- Seed default users: 2 developers and 1 admin (Password is 'password123')
            INSERT INTO USERS (username, password_hash, role)
            VALUES 
              ('admin', '$2a$10$tM.K9wEms36Ww9M3QJ5t5.1z583fFvQ5wE9J7tVvJqg5jH/r6NqyS', 'admin'),
              ('dev1', '$2a$10$tM.K9wEms36Ww9M3QJ5t5.1z583fFvQ5wE9J7tVvJqg5jH/r6NqyS', 'developer'),
              ('dev2', '$2a$10$tM.K9wEms36Ww9M3QJ5t5.1z583fFvQ5wE9J7tVvJqg5jH/r6NqyS', 'developer');
          END
        `);
        console.log('✅  USERS table check and auto-seed complete.');
      } catch (tableErr) {
        console.error('⚠️  Failed to check or auto-seed USERS table:', tableErr.message);
      }
    } catch (err) {
      pool = null;
      console.error('❌  SQL Server connection failed:', err.message);
      console.error('');
      console.error('   ── TROUBLESHOOTING ─────────────────────────────────');
      console.error('   1. Open "SQL Server Configuration Manager"');
      console.error('      (search Start menu for "SQL Server 2022 Configuration Manager")');
      console.error('   2. Expand "SQL Server Network Configuration"');
      console.error('      → "Protocols for MSSQLSERVER"');
      console.error('   3. Right-click "TCP/IP" → Enable');
      console.error('   4. Restart the SQL Server service');
      console.error('   5. Then run: npm run dev  again');
      console.error('   ─────────────────────────────────────────────────────');
      throw err;
    }
  }
  return pool;
}

module.exports = { getPool, sql };
