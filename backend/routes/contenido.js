const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authMiddleware, optionalAuthMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  getContenido,
  getPendientes,
  getMisContenido,
  createContenido,
  aprobarContenido,
  rechazarContenido,
  updateContenido,
  deleteContenido,
} = require('../controllers/contenidoController');

// Multer config para uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '-');
    cb(null, Date.now() + '-' + safeName);
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

// GET todas las noticias/proyectos/eventos (público)
router.get('/', optionalAuthMiddleware, getContenido);

// GET mis contenidos (autenticado)
router.get('/mis-contenidos/:autorId', authMiddleware, getMisContenido);

// GET pendientes de aprobación (solo director de rama)
router.get('/pendientes', authMiddleware, roleMiddleware(['director_rama']), getPendientes);

// CREATE contenido (autenticado)
router.post('/', authMiddleware, upload.single('imagen'), createContenido);

// UPDATE contenido (solo autor)
router.patch('/:id', authMiddleware, updateContenido);

// DELETE contenido (solo autor)
router.delete('/:id', authMiddleware, deleteContenido);

// APPROVE contenido (solo director de rama)
router.post('/:id/aprobar', authMiddleware, roleMiddleware(['director_rama']), aprobarContenido);

// REJECT contenido (solo director de rama)
router.post('/:id/rechazar', authMiddleware, roleMiddleware(['director_rama']), rechazarContenido);

module.exports = router;
