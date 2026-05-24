const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
      if (pragmaErr) {
        console.error('Error enabling foreign keys:', pragmaErr);
      }
      initializeDatabase();
    });
  }
});

function addColumnSafe(table, column, definition) {
  db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (err) => {
    if (err && !/duplicate column name/i.test(err.message)) {
      console.error(`Error adding ${table}.${column}:`, err.message);
    }
  });
}

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

    // Tabla contenido (noticias, proyectos, eventos, concursos)
    db.run(`
      CREATE TABLE IF NOT EXISTS contenido (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL CHECK(tipo IN ('noticia', 'proyecto', 'evento', 'concurso')),
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

    addColumnSafe('contenido', 'slug', 'TEXT');
    addColumnSafe('contenido', 'cuerpo', 'TEXT');
    addColumnSafe('contenido', 'extracto', 'TEXT');
    addColumnSafe('contenido', 'autor_nombre', 'TEXT');
    addColumnSafe('contenido', 'vistas', 'INTEGER DEFAULT 0');
    addColumnSafe('contenido', 'publicado_at', 'DATETIME');
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_contenido_slug ON contenido(slug) WHERE slug IS NOT NULL');

    // ── Campos para noticias inmersivas (v2) ──
    addColumnSafe('contenido', 'es_destacada',   "INTEGER DEFAULT 0");
    addColumnSafe('contenido', 'breaking_label', "TEXT");
    addColumnSafe('contenido', 'lead_paragraph', "TEXT");
    addColumnSafe('contenido', 'tiempo_lectura', "INTEGER DEFAULT 0");

    // ── Campos para artículos académicos (v2) ──
    addColumnSafe('contenido', 'abstract',        "TEXT");
    addColumnSafe('contenido', 'doi',             "TEXT");
    addColumnSafe('contenido', 'peer_reviewed',   "INTEGER DEFAULT 0");
    addColumnSafe('contenido', 'referencias',     "TEXT DEFAULT '[]'");
    addColumnSafe('contenido', 'publicacion_vol', "TEXT");
    addColumnSafe('contenido', 'etiquetas',       "TEXT DEFAULT '[]'");


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

    // Tabla de configuración global (redes, email, mantenimiento)
    db.run(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clave TEXT UNIQUE NOT NULL,
        valor TEXT,
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

    // Tabla detalle editorial de capítulos
    db.run(`
      CREATE TABLE IF NOT EXISTS capitulo_detalle (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        siglas TEXT,
        descripcion_corta TEXT,
        descripcion_larga TEXT,
        logo_path TEXT,
        imagen_portada_path TEXT,
        color TEXT,
        email_contacto TEXT,
        link_externo TEXT,
        redes_json TEXT,
        director_id INTEGER,
        mision TEXT,
        vision TEXT,
        fecha_fundacion DATE,
        activo INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(director_id) REFERENCES usuarios(id)
      )
    `);

    // Tabla archivos editoriales de contenido
    db.run(`
      CREATE TABLE IF NOT EXISTS contenido_archivos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contenido_id INTEGER NOT NULL,
        tipo TEXT NOT NULL CHECK(tipo IN ('imagen', 'documento')),
        archivo_path TEXT NOT NULL,
        nombre_original TEXT,
        mime_type TEXT,
        tamaño_bytes INTEGER,
        orden INTEGER DEFAULT 0,
        caption TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(contenido_id) REFERENCES contenido(id) ON DELETE CASCADE
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

    // Seed default admin user if empty (uses crypto.scrypt — no native modules)
    db.get('SELECT COUNT(*) as count FROM usuarios', (err, row) => {
      if (!err && row && row.count === 0) {
        const crypto = require('crypto');
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.scrypt('admin123', salt, 64, { N: 16384, r: 8, p: 1 }, (scryptErr, key) => {
          if (scryptErr) { console.error('scrypt error:', scryptErr); return; }
          const hash = '$scrypt$16384$8$1$' + salt + '$' + key.toString('hex');
          db.run(
            'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
            ['Admin', 'admin@ieee-unmsm.org', hash, 'director_rama'],
            (insertErr) => {
              if (!insertErr) console.log('Default admin user seeded (admin@ieee-unmsm.org / admin123)');
            }
          );
        });
      }
    });

    // Seed default site settings if empty
    db.get('SELECT COUNT(*) as count FROM site_settings', (err, row) => {
      if (!err && row && row.count === 0) {
        const defaults = [
          ['footer_facebook', 'https://facebook.com/ieee.unmsm'],
          ['footer_instagram', 'https://instagram.com/ieee_unmsm'],
          ['footer_linkedin', 'https://linkedin.com/company/ieee-unmsm'],
          ['footer_whatsapp', 'https://wa.me/51999999999'],
          ['footer_email', 'ieee@unmsm.edu.pe'],
          ['footer_address', 'Universidad Nacional Mayor de San Marcos\\nLima, Perú']
        ];
        const stmt = db.prepare('INSERT INTO site_settings (clave, valor) VALUES (?, ?)');
        defaults.forEach(d => stmt.run(d));
        stmt.finalize();
        console.log('Default site_settings seeded');
      }
    });

    // Seed default capitulos if empty
    db.get('SELECT COUNT(*) as count FROM capitulo_detalle', (err, row) => {
      if (!err && row && row.count === 0) {
        try {
          const path = require('path');
          const fs = require('fs');
          const dataPath = path.join(__dirname, '../../data/capitulos.json');
          if (fs.existsSync(dataPath)) {
            const capitulos = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            const stmt = db.prepare('INSERT INTO capitulo_detalle (slug, nombre, siglas, descripcion_corta, color) VALUES (?, ?, ?, ?, ?)');
            capitulos.forEach(c => {
              stmt.run(c.id, c.nombre, c.siglas, c.descripcion, c.color);
            });
            stmt.finalize();
            console.log('Default capitulos seeded from capitulos.json');
          }
        } catch (e) {
          console.error('Error seeding capitulos from json:', e);
        }
      }
    });

    // Actualizaciones de esquema en caliente
    addColumnSafe('contenido', 'etiquetas', "TEXT DEFAULT '[]'");
    addColumnSafe('revistas', 'etiquetas', "TEXT DEFAULT '[]'");
    addColumnSafe('galeria_fotos', 'etiquetas', "TEXT DEFAULT '[]'");
  });
}

module.exports = db;
