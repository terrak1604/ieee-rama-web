require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./config/db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const contenidoRoutes = require('./routes/contenido');
const capitulosRoutes = require('./routes/capitulos');
const galeriaRoutes = require('./routes/galeria');
const siteImagesRoutes = require('./routes/siteImages');
const siteSettingsRoutes = require('./routes/siteSettings');
const revistasRoutes = require('./routes/revistas');
const contactoRoutes = require('./routes/contacto');
const rssRoutes = require('./routes/rss');
const faqRoutes = require('./routes/faq');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));

const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, message: 'Demasiadas solicitudes.' });
app.use('/api', generalLimiter);

// Middleware CORS — usar callback(null, false) en lugar de throw para no crashear Express 5
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Permitir peticiones sin origin (Postman, curl, mismo servidor)
    if (!origin) return callback(null, true);
    // En produccion: verificar lista explicita del .env
    if (allowedOrigins.length > 0) {
      return callback(null, allowedOrigins.includes(origin));
    }
    // En desarrollo: permitir cualquier localhost o 127.0.0.1
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    return callback(null, isLocalhost);
  },
  credentials: true,
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// === Bloqueo de paths sensibles (debe ir ANTES de express.static) ===
app.use((req, res, next) => {
  const blocked = ['/.env', '/database.sqlite', '/.git', '/backend/'];
  if (blocked.some(p => req.path === p || req.path.startsWith(p + '/') || req.path.startsWith(p))) {
    return res.status(404).send('Not found');
  }
  next();
});

// === Modo Mantenimiento ===
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/admin') || req.path.startsWith('/uploads')) {
    return next();
  }
  try {
    db.get("SELECT valor FROM site_settings WHERE clave = 'maintenance'", (err, row) => {
      if (!err && row && row.valor === 'true') {
        return res.status(503).sendFile(path.join(__dirname, '..', 'maintenance.html'));
      }
      next();
    });
  } catch (e) {
    next();
  }
});

// === Servir archivos subidos ===
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === API routes ===
app.use('/api/auth', authRoutes);
app.use('/api/contenido', contenidoRoutes);
app.use('/api/capitulos', capitulosRoutes);
app.use('/api/galeria', galeriaRoutes);
app.use('/api/site-images', siteImagesRoutes);
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/revistas', revistasRoutes);
app.use('/api/contacto', contactoRoutes);
app.use('/api/rss', rssRoutes);
app.use('/api/faq', faqRoutes);

// === Panel admin estatico ===
const ROOT = path.resolve(__dirname, '..');
app.use('/admin', express.static(path.join(ROOT, 'admin'), {
  extensions: ['html'],
}));

// === Assets estaticos ===
app.use('/css',    express.static(path.join(ROOT, 'css')));
app.use('/js',     express.static(path.join(ROOT, 'js')));
app.use('/images', express.static(path.join(ROOT, 'images')));
app.use('/data',   express.static(path.join(ROOT, 'data')));

// === Frontend publico ===
app.use(express.static(ROOT, {
  index: 'index.html',
  extensions: ['html'],
  dotfiles: 'deny',
}));

// === Paginas HTML publicas ===
const pages = [
  ['/',                  'index.html'],
  ['/capitulos',         'capitulos.html'],
  ['/noticias',          'noticias.html'],
  ['/proyectos',         'proyectos.html'],
  ['/concursos',         'concursos.html'],
  ['/galeria',           'galeria.html'],
  ['/contacto',          'contacto.html'],
  ['/calendario',        'calendario.html'],
  ['/revista',           'revista.html'],
  ['/resultados',        'resultados.html'],
  ['/capitulo-detalle',  'capitulo-detalle.html'],
  ['/contenido-detalle', 'contenido-detalle.html'],
];
pages.forEach(([route, file]) => {
  app.get(route, (req, res) => res.sendFile(path.join(ROOT, file)));
  app.get(`/${file}`, (req, res) => res.sendFile(path.join(ROOT, file)));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running', timestamp: new Date().toISOString() });
});

// Error handling — captura errores sin crashear el servidor
app.use((err, req, res, next) => {
  if (err && (err.name === 'MulterError' || /Solo se permiten|Only image files|file/i.test(err.message || ''))) {
    return res.status(400).json({ error: err.message || 'Archivo invalido' });
  }
  console.error('[server error]', err.message || err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('');
    console.log('IEEE Portal backend running on http://localhost:' + PORT);
    console.log('Admin panel: http://localhost:' + PORT + '/admin/login.html');
    console.log('');
  });
}

module.exports = app;
