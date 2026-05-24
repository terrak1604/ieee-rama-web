const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// Asegurar que la tabla existe al cargar el módulo
db.run(`
  CREATE TABLE IF NOT EXISTS faq (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    orden INTEGER DEFAULT 0,
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`, (err) => {
  if (err) console.error('Error creando tabla faq:', err);
  // Si la tabla acaba de crearse, insertar preguntas por defecto
  db.get('SELECT COUNT(*) as cnt FROM faq', (err2, row) => {
    if (!err2 && row && row.cnt === 0) {
      const defaults = [
        ['\u00bfC\u00f3mo me uno a la Rama Estudiantil IEEE UNMSM?', 'Primero debes ser miembro activo de IEEE (membres\u00eda estudiantil con tarifa anual reducida). Luego, cont\u00e1ctanos por este formulario o nuestras redes y te orientaremos para afiliarte a la Rama y al/los cap\u00edtulos de tu inter\u00e9s.', 1],
        ['\u00bfTengo que ser de Ingenier\u00eda para participar?', 'No exclusivamente. Aunque la mayor\u00eda somos de ingenier\u00eda el\u00e9ctrica, electr\u00f3nica, sistemas o mecatr\u00f3nica, cap\u00edtulos como WIE, EMBS, SIGHT y TEMS reciben estudiantes de carreras afines (medicina, biolog\u00eda, ciencias sociales aplicadas, gesti\u00f3n, etc.).', 2],
        ['\u00bfCu\u00e1nto cuesta la membres\u00eda IEEE estudiantil?', 'La tarifa exacta var\u00eda cada a\u00f1o, pero la membres\u00eda estudiantil tiene un costo significativamente reducido respecto a la profesional. Consulta el monto vigente en ieee.org/membership/students o escr\u00edbenos para m\u00e1s detalles.', 3],
        ['\u00bfPuedo pertenecer a m\u00e1s de un cap\u00edtulo a la vez?', '\u00a1S\u00ed! De hecho, lo recomendamos. Puedes ser miembro activo de varios cap\u00edtulos simult\u00e1neamente. Cada uno tiene su propia membres\u00eda adicional con costo reducido o gratuito seg\u00fan el caso.', 4],
        ['\u00bfC\u00f3mo propongo un evento o taller con la Rama?', 'Escr\u00edbenos a trav\u00e9s de este formulario seleccionando "Organizaci\u00f3n de evento" en el asunto, o directamente a nuestro correo. Necesitaremos: tema, fecha tentativa, cap\u00edtulo organizador (si aplica) y propuesta breve. Respondemos en m\u00e1ximo 48h h\u00e1biles.', 5],
        ['\u00bfLas actividades dan certificado v\u00e1lido?', 'S\u00ed. Talleres, charlas, concursos y eventos oficiales emiten certificado IEEE UNMSM con c\u00f3digo verificable, v\u00e1lido para tu CV acad\u00e9mico y profesional.', 6],
      ];
      const stmt = db.prepare('INSERT INTO faq (pregunta, respuesta, orden) VALUES (?, ?, ?)');
      defaults.forEach(d => stmt.run(d));
      stmt.finalize();
    }
  });
});

// GET /api/faq — público
router.get('/', (req, res) => {
  db.all(
    'SELECT id, pregunta, respuesta, orden FROM faq WHERE activo = 1 ORDER BY orden ASC, id ASC',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error obteniendo FAQ' });
      res.json(rows || []);
    }
  );
});

// GET /api/faq/admin — todas, incluye inactivas (requiere auth)
router.get('/admin', authMiddleware, (req, res) => {
  db.all(
    'SELECT * FROM faq ORDER BY orden ASC, id ASC',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error obteniendo FAQ' });
      res.json(rows || []);
    }
  );
});

// POST /api/faq — crear nueva pregunta (requiere auth)
router.post('/', authMiddleware, (req, res) => {
  const { pregunta, respuesta, orden = 0 } = req.body;
  if (!pregunta || !respuesta) {
    return res.status(400).json({ error: 'Pregunta y respuesta son requeridas' });
  }
  db.run(
    'INSERT INTO faq (pregunta, respuesta, orden) VALUES (?, ?, ?)',
    [pregunta.trim(), respuesta.trim(), parseInt(orden) || 0],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error creando FAQ' });
      res.json({ id: this.lastID, pregunta, respuesta, orden });
    }
  );
});

// PUT /api/faq/:id — editar (requiere auth)
router.put('/:id', authMiddleware, (req, res) => {
  const { pregunta, respuesta, orden, activo } = req.body;
  const { id } = req.params;
  const updates = [];
  const values = [];

  if (pregunta !== undefined) { updates.push('pregunta = ?'); values.push(pregunta.trim()); }
  if (respuesta !== undefined) { updates.push('respuesta = ?'); values.push(respuesta.trim()); }
  if (orden !== undefined) { updates.push('orden = ?'); values.push(parseInt(orden) || 0); }
  if (activo !== undefined) { updates.push('activo = ?'); values.push(activo ? 1 : 0); }
  updates.push("updated_at = datetime('now')");
  values.push(id);

  db.run(
    `UPDATE faq SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function (err) {
      if (err) return res.status(500).json({ error: 'Error actualizando FAQ' });
      if (this.changes === 0) return res.status(404).json({ error: 'Pregunta no encontrada' });
      res.json({ ok: true });
    }
  );
});

// DELETE /api/faq/:id (requiere auth)
router.delete('/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM faq WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Error eliminando FAQ' });
    if (this.changes === 0) return res.status(404).json({ error: 'Pregunta no encontrada' });
    res.json({ ok: true });
  });
});

module.exports = router;
