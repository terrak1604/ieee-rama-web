require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./config/db');

const authRoutes = require('./routes/auth');
const contenidoRoutes = require('./routes/contenido');
const capitulosRoutes = require('./routes/capitulos');
const galeriaRoutes = require('./routes/galeria');
const siteImagesRoutes = require('./routes/siteImages');
const revistasRoutes = require('./routes/revistas');

const app = express();

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

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contenido', contenidoRoutes);
app.use('/api/capitulos', capitulosRoutes);
app.use('/api/galeria', galeriaRoutes);
app.use('/api/site-images', siteImagesRoutes);
app.use('/api/revistas', revistasRoutes);

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
