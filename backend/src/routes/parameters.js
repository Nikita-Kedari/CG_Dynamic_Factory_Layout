const express = require('express');
const router  = express.Router();
const { getPool, sql } = require('../db');
const fs = require('fs');
const path = require('path');

/**
 * Helper to sync DB schema to XML (Smart Sync)
 */
async function syncParametersToXML() {
  const configDir = path.join(__dirname, '../../public/config');
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  const xmlPath = path.join(configDir, 'parameters.xml');

  // 1. Read existing config if it exists
  const existingParams = new Map();
  if (fs.existsSync(xmlPath)) {
    const content = fs.readFileSync(xmlPath, 'utf8');
    // Simple regex to extract parameter blocks
    const paramRegex = /<parameter\s+visible="([^"]+)">\s*<id>([^<]+)<\/id>\s*<label>([^<]+)<\/label>\s*<type>([^<]+)<\/type>/g;
    let match;
    while ((match = paramRegex.exec(content)) !== null) {
      existingParams.set(match[2].toLowerCase(), {
        visible: match[1],
        id: match[2],
        label: match[3],
        type: match[4]
      });
    }
  }

  // 2. Fetch current columns from DB
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'WORKSTATION_Parameters'
  `);

  const dbColumns = result.recordset
    .filter(c => !['ws_parameter_id', 'ws_id', 'WS_Parameter_ID', 'WS_ID'].includes(c.COLUMN_NAME))
    .map(c => ({
      id: c.COLUMN_NAME.toLowerCase(),
      label: c.COLUMN_NAME,
      type: c.DATA_TYPE
    }));

  // 3. Merge: 
  // - If in DB but not in XML -> Add (visible="true")
  // - If in both -> Update type/label but keep visibility
  // - If in XML but not in DB -> Keep (will show as null)
  dbColumns.forEach(col => {
    if (existingParams.has(col.id)) {
      const existing = existingParams.get(col.id);
      existing.label = col.label;
      existing.type = col.type;
    } else {
      existingParams.set(col.id, {
        ...col,
        visible: "true"
      });
    }
  });

  // 4. Generate XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<parameters>\n';
  existingParams.forEach(p => {
    xml += `  <parameter visible="${p.visible}">\n`;
    xml += `    <id>${p.id}</id>\n`;
    xml += `    <label>${p.label}</label>\n`;
    xml += `    <type>${p.type}</type>\n`;
    xml += '  </parameter>\n';
  });
  xml += '</parameters>';

  fs.writeFileSync(xmlPath, xml);
  return Array.from(existingParams.values());
}

/**
 * GET /api/parameters/sync
 * Manually trigger sync and return full config
 */
router.get('/sync', async (req, res) => {
  try {
    const parameters = await syncParametersToXML();
    if (!parameters) return res.status(404).json({ error: 'Table not found' });
    res.json({ success: true, count: parameters.length, parameters });
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
