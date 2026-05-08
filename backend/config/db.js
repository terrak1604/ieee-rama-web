const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database.sqlite';
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Tabla usuarios (directores de rama + directores de capítulos)
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT NOT NULL CHECK(rol IN ('director_rama', 'director_capitulo')),
        capitulo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla contenido (noticias, proyectos, eventos)
    db.run(`
      CREATE TABLE IF NOT EXISTS contenido (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL CHECK(tipo IN ('noticia', 'proyecto', 'evento')),
        titulo TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        autor_id INTEGER NOT NULL,
        capitulo TEXT,
        estado TEXT DEFAULT 'borrador' CHECK(estado IN ('borrador', 'pendiente_aprobacion', 'aprobado', 'rechazado')),
        imagen_path TEXT,
        link TEXT,
        categoria TEXT,
        fecha_evento DATETIME,
        lugar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(autor_id) REFERENCES usuarios(id)
      )
    `);

    // Tabla archivos (PDF, documentos, etc.)
    db.run(`
      CREATE TABLE IF NOT EXISTS archivos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contenido_id INTEGER NOT NULL,
        nombre_original TEXT NOT NULL,
        path TEXT NOT NULL,
        tipo TEXT,
        tamanio INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(contenido_id) REFERENCES contenido(id)
      )
    `);

    // Tabla galería fotos
    db.run(`
      CREATE TABLE IF NOT EXISTS galeria_fotos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        capitulo TEXT,
        path TEXT NOT NULL,
        evento TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla aprobaciones (historial)
    db.run(`
      CREATE TABLE IF NOT EXISTS aprobaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contenido_id INTEGER NOT NULL,
        aprobado_por INTEGER NOT NULL,
        comentario TEXT,
        accion TEXT CHECK(accion IN ('aprobado', 'rechazado')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(contenido_id) REFERENCES contenido(id),
        FOREIGN KEY(aprobado_por) REFERENCES usuarios(id)
      )
    `);

    // Tabla imágenes del sitio (hero, logo, banners editables desde admin)
    db.run(`
      CREATE TABLE IF NOT EXISTS site_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clave TEXT UNIQUE NOT NULL,
        path TEXT,
        alt_text TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla revistas (publicación mensual IEEE)
    db.run(`
      CREATE TABLE IF NOT EXISTS revistas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        edicion INTEGER NOT NULL,
        fecha DATE NOT NULL,
        portada_path TEXT,
        pdf_path TEXT,
        autor_id INTEGER,
        estado TEXT DEFAULT 'borrador' CHECK(estado IN ('borrador', 'aprobado')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(autor_id) REFERENCES usuarios(id)
      )
    `);

    console.log('Database schema initialized');

    // Seed default site images if empty
    db.get('SELECT COUNT(*) as count FROM site_images', (err, row) => {
      if (!err && row && row.count === 0) {
        const defaults = [
          ['hero', null, 'Imagen principal de portada'],
          ['logo', null, 'Logo IEEE UNMSM'],
        ];
        const stmt = db.prepare('INSERT INTO site_images (clave, path, alt_text) VALUES (?, ?, ?)');
        defaults.forEach(d => stmt.run(d));
        stmt.finalize();
        console.log('Default site_images seeded');
      }
    });
  });
}

module.exports = db;
