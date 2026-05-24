const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', 'uploads', 'galeria');
fs.mkdirSync(uploadDir, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: uploadDir,
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
  const { capitulo, evento, etiquetas } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const etiquetasStr = typeof etiquetas === 'string' ? etiquetas : '[]';

  const inserts = req.files.map((file) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO galeria_fotos (capitulo, path, evento, etiquetas) VALUES (?, ?, ?, ?)',
        [capitulo, `/uploads/galeria/${file.filename}`, evento, etiquetasStr],
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

// DELETE foto (solo admin)
router.delete('/:id', authMiddleware, (req, res) => {
  // Director de rama o dueño del capitulo
  db.get('SELECT * FROM galeria_fotos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Foto not found' });
    
    if (req.user.rol !== 'director_rama' && req.user.capitulo !== row.capitulo) {
       return res.status(403).json({ error: 'No permissions' });
    }
    
    db.run('DELETE FROM galeria_fotos WHERE id = ?', [req.params.id], function(delErr) {
      if (delErr) return res.status(500).json({ error: delErr.message });
      
      const filePath = path.join(__dirname, '..', row.path.replace(/^\/uploads\//, 'uploads/'));
      fs.unlink(filePath, () => {});
      res.json({ message: 'Foto eliminada' });
    });
  });
});

module.exports = router;
