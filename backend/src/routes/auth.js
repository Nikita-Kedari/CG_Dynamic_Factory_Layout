// src/routes/auth.js — Database-backed JWT authentication
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getPool, sql } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_factory_layout_token_key_2026!';

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { success, token, user }
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT * FROM USERS WHERE username = @username');

    if (!result.recordset.length) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.recordset[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.user_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.user_id.toString(),
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/register
 * Body: { username, password, role }
 * Returns: { success, token, user }
 */
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'All fields (username, password, role) are required' });
  }

  const allowedRoles = ['admin', 'developer', 'viewer'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role selection' });
  }

  try {
    const pool = await getPool();
    
    // Check if user already exists
    const checkUser = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT 1 FROM USERS WHERE username = @username');

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const insertResult = await pool.request()
      .input('username', sql.VarChar, username)
      .input('password_hash', sql.VarChar, passwordHash)
      .input('role', sql.VarChar, role)
      .query(`
        INSERT INTO USERS (username, password_hash, role)
        VALUES (@username, @password_hash, @role);
        SELECT SCOPE_IDENTITY() AS new_user_id;
      `);

    const newUserId = insertResult.recordset[0].new_user_id;

    // Generate JWT
    const token = jwt.sign(
      { userId: newUserId, username, role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUserId.toString(),
        username,
        role
      }
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Stateless client clearance.
 */
router.post('/logout', (_req, res) => {
  res.json({ success: true });
});

module.exports = router;
