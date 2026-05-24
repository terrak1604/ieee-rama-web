const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuthMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  getContenido,
  getContenidoBySlug,
  getContenidoAdminById,
  getPendientes,
  getMisContenido,
  createContenido,
  aprobarContenido,
  rechazarContenido,
  updateContenido,
  deleteContenido,
  generarOpenGraph,
} = require('../controllers/contenidoController');
const {
  uploadContenidoArchivos,
  deleteContenidoArchivo,
} = require('../controllers/archivoController');
const { uploadFor, contentUpload, validateContentFiles } = require('../middleware/upload');

const upload = uploadFor('', {
  maxFileSize: 5 * 1024 * 1024,
  imagesOnly: true,
});

// GET todas las noticias/proyectos/eventos (público)
router.get('/', optionalAuthMiddleware, getContenido);

// GET mis contenidos (autenticado)
router.get('/mis-contenidos/:autorId', authMiddleware, getMisContenido);

// GET pendientes de aprobación (solo director de rama)
router.get('/pendientes', authMiddleware, roleMiddleware(['director_rama']), getPendientes);

// GET detalle administrativo por id (antes de /:slug)
router.get('/admin/:id', authMiddleware, getContenidoAdminById);

// GET Open Graph proxy para redes sociales
router.get('/share/:slug', generarOpenGraph);

// GET detalle publico por slug
router.get('/:slug', getContenidoBySlug);

// CREATE contenido (autenticado)
router.post('/', authMiddleware, upload.single('imagen'), createContenido);

// UPDATE contenido (solo autor)
router.patch('/:id', authMiddleware, upload.single('imagen'), updateContenido);

// Upload adjuntos editoriales
router.post('/:id/archivos', authMiddleware, contentUpload, validateContentFiles, uploadContenidoArchivos);
router.delete('/:id/archivos/:archivoId', authMiddleware, deleteContenidoArchivo);

// DELETE contenido (solo autor)
router.delete('/:id', authMiddleware, deleteContenido);

// APPROVE contenido (solo director de rama)
router.post('/:id/aprobar', authMiddleware, roleMiddleware(['director_rama']), aprobarContenido);

// REJECT contenido (solo director de rama)
router.post('/:id/rechazar', authMiddleware, roleMiddleware(['director_rama']), rechazarContenido);

module.exports = router;
