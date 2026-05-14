// src/routes/factories.js
const express = require('express');
const router  = express.Router();
const { getPool, sql } = require('../db');

// GET /api/factories
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT f.*, l.layout_id, l.layout_name, l.canvas_width, l.canvas_length
      FROM FACTORIES f
      LEFT JOIN LAYOUTS l ON l.factory_id = f.factory_id AND l.is_active = 1
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/factories/:id
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM FACTORIES WHERE factory_id = @id');
    if (!result.recordset.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
