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
const revistasRoutes = require('./routes/revistas');
const contactoRoutes = require('./routes/contacto');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, message: 'Demasiadas solicitudes.' });
app.use('/api', generalLimiter);

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Permitir peticiones sin origin (Postman, curl, mismo servidor)
    if (!origin) return callback(null, true);
    // En producción: verificar lista explícita del .env
    if (allowedOrigins.length > 0) {
      return allowedOrigins.includes(origin)
        ? callback(null, true)
        : callback(new Error('Not allowed by CORS'));
    }
    // En desarrollo (sin CORS_ORIGIN en .env): permitir cualquier localhost
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    return isLocalhost
      ? callback(null, true)
      : callback(new Error('Not allowed by CORS'));
  },
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

// === Servir archivos subidos ===
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === API routes (deben ir ANTES de express.static para tener prioridad) ===
app.use('/api/auth', authRoutes);
app.use('/api/contenido', contenidoRoutes);
app.use('/api/capitulos', capitulosRoutes);
app.use('/api/galeria', galeriaRoutes);
app.use('/api/site-images', siteImagesRoutes);
app.use('/api/revistas', revistasRoutes);
app.use('/api/contacto', contactoRoutes);

// === Panel admin estático ===
const ROOT = path.resolve(__dirname, '..');
app.use('/admin', express.static(path.join(ROOT, 'admin'), {
  extensions: ['html'],
}));

// === Assets estáticos (CSS, JS, imágenes, data) ===
app.use('/css',    express.static(path.join(ROOT, 'css')));
app.use('/js',     express.static(path.join(ROOT, 'js')));
app.use('/images', express.static(path.join(ROOT, 'images')));
app.use('/data',   express.static(path.join(ROOT, 'data')));

// === Páginas HTML públicas (rutas explícitas) ===
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
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    console.log(`📚 API endpoints:`);
    console.log(`   - POST   /api/auth/login`);
    console.log(`   - POST   /api/auth/register`);
    console.log(`   - GET    /api/contenido`);
    console.log(`   - GET    /api/capitulos`);
    console.log(`   - POST   /api/contenido`);
    console.log(`   - GET    /api/contenido/pendientes`);
    console.log(`   - POST   /api/contenido/:id/aprobar`);
    console.log(`   - GET    /api/galeria`);
    console.log(`   - POST   /api/galeria`);
  });
}

module.exports = app;
