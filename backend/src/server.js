// src/server.js  — Express entry point
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── Middleware ───────────────────────────────
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '50mb' }));

// ── Routes ───────────────────────────────────
app.use('/api/auth',             require('./routes/auth'));
app.use('/api/factories',        require('./routes/factories'));
app.use('/api/layouts',          require('./routes/layouts'));
app.use('/api/machines',         require('./routes/machines'));
app.use('/api/parameters',       require('./routes/parameters'));
app.use('/api/admin',            require('./routes/upload'));

// ── Health check ─────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const { getPool } = require('./db');
    await getPool();
    res.json({ status: 'ok', db: 'connected', ts: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── Start ─────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🏭  Factory Layout API running → http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
