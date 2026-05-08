const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: './uploads/revistas/',
  filename: (req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '-');
    cb(null, Date.now() + '-' + safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for PDFs
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'portada' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Cover must be an image'));
    }
    if (file.fieldname === 'pdf' && file.mimetype !== 'application/pdf') {
      return cb(new Error('File must be a PDF'));
    }
    cb(null, true);
  },
});

// GET all published revistas (public)
router.get('/', (req, res) => {
  db.all(
    'SELECT * FROM revistas WHERE estado = ? ORDER BY edicion DESC',
    ['aprobado'],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// POST create new revista (auth required)
router.post(
  '/',
  authMiddleware,
  upload.fields([
    { name: 'portada', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  (req, res) => {
    const { titulo, descripcion, edicion, fecha } = req.body;
    const autorId = req.user.id;
    const estado = req.user.rol === 'director_rama' ? 'aprobado' : 'borrador';

    if (!titulo || !edicion || !fecha) {
      return res.status(400).json({ error: 'titulo, edicion, fecha required' });
    }

    const portada_path = req.files?.portada?.[0]
      ? `/uploads/revistas/${req.files.portada[0].filename}`
      : null;
    const pdf_path = req.files?.pdf?.[0]
      ? `/uploads/revistas/${req.files.pdf[0].filename}`
      : null;

    db.run(
      `INSERT INTO revistas (titulo, descripcion, edicion, fecha, portada_path, pdf_path, autor_id, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descripcion, Number(edicion), fecha, portada_path, pdf_path, autorId, estado],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Revista created', id: this.lastID });
      }
    );
  }
);

// DELETE revista (only director_rama)
router.delete('/:id', authMiddleware, roleMiddleware(['director_rama']), (req, res) => {
  db.run('DELETE FROM revistas WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Revista not found' });
    res.json({ message: 'Revista deleted' });
  });
});

module.exports = router;
