const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// GET all site settings (public)
router.get('/', (req, res) => {
  db.all('SELECT clave, valor FROM site_settings', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Transform array to object { clave: valor }
    const settings = {};
    if (rows) {
      rows.forEach(row => {
        settings[row.clave] = row.valor;
      });
    }
    res.json(settings);
  });
});

// GET single setting (public)
router.get('/:clave', (req, res) => {
  db.get('SELECT valor FROM site_settings WHERE clave = ?', [req.params.clave], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Setting not found' });
    res.json({ clave: req.params.clave, valor: row.valor });
  });
});

// PUT update settings (only director_rama)
router.put('/', authMiddleware, roleMiddleware(['director_rama']), (req, res) => {
  const settings = req.body; // Expects object: { clave1: 'valor1', clave2: 'valor2' }
  
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings object' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const stmt = db.prepare(`
      INSERT INTO site_settings (clave, valor, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(clave) DO UPDATE SET valor = ?, updated_at = CURRENT_TIMESTAMP
    `);

    let hasError = false;
    for (const [clave, valor] of Object.entries(settings)) {
      stmt.run([clave, valor, valor], (err) => {
        if (err) hasError = true;
      });
    }

    stmt.finalize();

    if (hasError) {
      db.run('ROLLBACK');
      return res.status(500).json({ error: 'Error updating settings' });
    } else {
      db.run('COMMIT');
      return res.json({ message: 'Settings updated successfully' });
    }
  });
});

module.exports = router;
