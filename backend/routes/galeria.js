const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// Multer config
const storage = multer.diskStorage({
  destination: './uploads/galeria/',
  filename: (req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '-');
    cb(null, Date.now() + '-' + safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 20,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// GET galería fotos (público)
router.get('/', (req, res) => {
  const { capitulo } = req.query;
  let query = 'SELECT * FROM galeria_fotos WHERE 1=1';
  const params = [];

  if (capitulo) {
    query += ' AND capitulo = ?';
    params.push(capitulo);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// UPLOAD fotos (autenticado)
router.post('/', authMiddleware, upload.array('fotos', 20), (req, res) => {
  const { capitulo, evento } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const inserts = req.files.map((file) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO galeria_fotos (capitulo, path, evento) VALUES (?, ?, ?)',
        [capitulo, `/uploads/galeria/${file.filename}`, evento],
        (err) => (err ? reject(err) : resolve())
      );
    });
  });

  Promise.all(inserts)
    .then(() => {
      res.status(201).json({
        message: `${req.files.length} fotos uploaded successfully`,
        uploaded: req.files.length,
      });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

module.exports = router;
