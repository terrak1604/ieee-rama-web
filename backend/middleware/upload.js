const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeFilename(originalname) {
  const parsed = path.parse(originalname);
  const name = parsed.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80) || 'archivo';
  const ext = parsed.ext.toLowerCase();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${name}${ext}`;
}

function uploadFor(subdir, options = {}) {
  const destination = path.join(UPLOAD_ROOT, subdir);
  ensureDir(destination);
  const maxFileSize = options.maxFileSize || 10 * 1024 * 1024;
  const imagesOnly = Boolean(options.imagesOnly);

  return multer({
    storage: multer.diskStorage({
      destination,
      filename: (req, file, cb) => cb(null, safeFilename(file.originalname)),
    }),
    limits: { fileSize: maxFileSize },
    fileFilter: (req, file, cb) => {
      const isImage = file.mimetype.startsWith('image/');
      const isDocument = ['application/pdf'].includes(file.mimetype);

      if (imagesOnly && !isImage) {
        return cb(new Error('Solo se permiten imagenes'));
      }

      if (!isImage && !isDocument) {
        return cb(new Error('Solo se permiten imagenes y PDF'));
      }

      cb(null, true);
    },
  });
}

ensureDir(path.join(UPLOAD_ROOT, 'capitulos', 'logos'));
ensureDir(path.join(UPLOAD_ROOT, 'capitulos', 'portadas'));

const chapterUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const subdir = file.fieldname === 'portada' ? 'portadas' : 'logos';
      cb(null, path.join(UPLOAD_ROOT, 'capitulos', subdir));
    },
    filename: (req, file, cb) => cb(null, safeFilename(file.originalname)),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten imagenes'));
    }
    cb(null, true);
  },
}).fields([
  { name: 'archivo', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'portada', maxCount: 1 },
]);

ensureDir(path.join(UPLOAD_ROOT, 'contenido', 'imagenes'));
ensureDir(path.join(UPLOAD_ROOT, 'contenido', 'documentos'));

const contentUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const subdir = file.mimetype.startsWith('image/')
        ? path.join(UPLOAD_ROOT, 'contenido', 'imagenes')
        : path.join(UPLOAD_ROOT, 'contenido', 'documentos');
      cb(null, subdir);
    },
    filename: (req, file, cb) => cb(null, safeFilename(file.originalname)),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isDocument = ['application/pdf'].includes(file.mimetype);

    if (!isImage && !isDocument) {
      return cb(new Error('Solo se permiten imagenes y PDF'));
    }

    cb(null, true);
  },
}).array('archivos', 10);

function validateContentFiles(req, res, next) {
  const invalid = (req.files || []).find((file) => {
    if (file.mimetype.startsWith('image/')) return file.size > 5 * 1024 * 1024;
    return file.size > 10 * 1024 * 1024;
  });

  if (invalid) {
    return res.status(400).json({ error: 'Imagenes max 5MB y documentos max 10MB' });
  }

  next();
}

function uploadPath(file) {
  return `/uploads/${path.relative(UPLOAD_ROOT, file.path).replace(/\\/g, '/')}`;
}

module.exports = {
  uploadFor,
  chapterUpload,
  contentUpload,
  validateContentFiles,
  uploadPath,
};
