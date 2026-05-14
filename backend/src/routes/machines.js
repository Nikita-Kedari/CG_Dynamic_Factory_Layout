// src/routes/machines.js
const express = require('express');
const router  = express.Router();
const { getPool, sql } = require('../db');

// GET /api/machines/:machineId/status
router.get('/:machineId/status', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.machineId)
      .query(`
        SELECT TOP 5 *
        FROM MACHINE_RUNTIME_STATUS
        WHERE machine_id = @id
        ORDER BY recorded_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/machines/:machineId/status  — record a new runtime entry
router.post('/:machineId/status', async (req, res) => {
  const { status_type, status_reason, oee_percent, uptime_hours, fault_code, shift } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('machine_id',    sql.Int,       req.params.machineId)
      .input('status_type',   sql.NVarChar,  status_type)
      .input('status_reason', sql.NVarChar,  status_reason || null)
      .input('oee_percent',   sql.Float,     oee_percent   || null)
      .input('uptime_hours',  sql.Float,     uptime_hours  || null)
      .input('fault_code',    sql.NVarChar,  fault_code    || null)
      .input('shift',         sql.NVarChar,  shift         || null)
      .query(`
        INSERT INTO MACHINE_RUNTIME_STATUS
          (machine_id, status_type, status_reason, oee_percent, uptime_hours, fault_code, shift)
        VALUES
          (@machine_id, @status_type, @status_reason, @oee_percent, @uptime_hours, @fault_code, @shift)
      `);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/machines/:machineId/maintenance
router.get('/:machineId/maintenance', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.machineId)
      .query('SELECT * FROM MAINTENANCE_SCHEDULE WHERE machine_id = @id ORDER BY next_due_at');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
