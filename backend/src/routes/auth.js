// src/routes/auth.js  — Simple role-based auth with 2 hardcoded users
const express = require('express');
const router  = express.Router();

const USERS = [
  { username: 'dev_user',   password: 'dev123',   role: 'developer', name: 'Developer User' },
  { username: 'admin_user', password: 'admin123', role: 'admin',     name: 'Admin User'     },
];

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { success, role, name }
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'username and password required' });

  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user)
    return res.status(401).json({ error: 'Invalid credentials' });

  res.json({ success: true, role: user.role, name: user.name, username: user.username });
});

/**
 * POST /api/auth/logout
 * Stateless — client clears localStorage. This endpoint is a no-op acknowledgement.
 */
router.post('/logout', (_req, res) => {
  res.json({ success: true });
});

module.exports = router;
