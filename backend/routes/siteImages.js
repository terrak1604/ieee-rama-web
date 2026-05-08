const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '-');
    cb(null, 'site-' + Date.now() + '-' + safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// GET all site images (public)
router.get('/', (req, res) => {
  db.all('SELECT * FROM site_images', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// GET single site image by key (public)
router.get('/:clave', (req, res) => {
  db.get('SELECT * FROM site_images WHERE clave = ?', [req.params.clave], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Image key not found' });
    res.json(row);
  });
});

// PUT update site image (only director_rama)
router.put('/:clave', authMiddleware, roleMiddleware(['director_rama']), upload.single('imagen'), (req, res) => {
  const { clave } = req.params;
  const alt_text = req.body.alt_text || null;

  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  const imagePath = `/uploads/${req.file.filename}`;

  db.run(
    `INSERT INTO site_images (clave, path, alt_text, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(clave) DO UPDATE SET path = ?, alt_text = ?, updated_at = CURRENT_TIMESTAMP`,
    [clave, imagePath, alt_text, imagePath, alt_text],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: `Image '${clave}' updated`, path: imagePath });
    }
  );
});

module.exports = router;
