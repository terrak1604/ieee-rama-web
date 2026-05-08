const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { chapterUpload } = require('../middleware/upload');
const {
  listCapitulos,
  getCapitulo,
  updateCapitulo,
  uploadCapituloArchivo,
} = require('../controllers/capituloController');

router.get('/', listCapitulos);
router.get('/:slug', getCapitulo);
router.patch('/:slug', authMiddleware, updateCapitulo);
router.post('/:slug/archivos', authMiddleware, chapterUpload, uploadCapituloArchivo);

module.exports = router;
