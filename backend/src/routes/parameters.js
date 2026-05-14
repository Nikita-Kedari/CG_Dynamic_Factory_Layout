const express = require('express');
const router  = express.Router();
const { getPool, sql } = require('../db');
const fs = require('fs');
const path = require('path');

/**
 * Helper to sync DB schema to XML
 */
async function syncParametersToXML() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'WORKSTATION_Parameters'
  `);

  if (result.recordset.length === 0) return null;

  const columns = result.recordset
    .filter(c => !['ws_parameter_id', 'ws_id', 'WS_Parameter_ID', 'WS_ID'].includes(c.COLUMN_NAME));

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<parameters>\n';
  columns.forEach(col => {
    xml += '  <parameter>\n';
    xml += `    <id>${col.COLUMN_NAME.toLowerCase()}</id>\n`;
    xml += `    <label>${col.COLUMN_NAME}</label>\n`;
    xml += `    <type>${col.DATA_TYPE}</type>\n`;
    xml += '  </parameter>\n';
  });
  xml += '</parameters>';

  const configDir = path.join(__dirname, '../../public/config');
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  const xmlPath = path.join(configDir, 'parameters.xml');
  fs.writeFileSync(xmlPath, xml);
  return columns;
}

/**
 * GET /api/parameters/sync
 * Manually trigger sync
 */
router.get('/sync', async (req, res) => {
  try {
    const columns = await syncParametersToXML();
    if (!columns) return res.status(404).json({ error: 'Table not found' });
    res.json({ success: true, count: columns.length, parameters: columns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/parameters
 * Serves the XML. Now automatically syncs first!
 */
router.get('/', async (req, res) => {
  try {
    // Auto-sync every time someone asks for the list
    await syncParametersToXML();
    
    const xmlPath = path.join(__dirname, '../../public/config/parameters.xml');
    if (fs.existsSync(xmlPath)) {
      res.set('Content-Type', 'text/xml');
      return res.sendFile(xmlPath);
    }
    res.status(404).json({ error: 'parameters.xml not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/parameters/data
 */
router.get('/data', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM WORKSTATION_Parameters');
    const data = {};
    result.recordset.forEach(row => {
      const wsKey = row.WS_ID || row.ws_id;
      if (wsKey) {
        // Convert all keys to lowercase for the frontend
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          normalizedRow[key.toLowerCase()] = row[key];
        });
        data[wsKey.toString().toLowerCase()] = normalizedRow;
      }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
