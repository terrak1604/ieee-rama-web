const db = require('../config/db');

// GET contenido (con filtros)
const getContenido = (req, res) => {
  const { tipo, estado, capitulo, modo } = req.query;
  let query = 'SELECT c.*, u.nombre as autor_nombre FROM contenido c JOIN usuarios u ON c.autor_id = u.id WHERE 1=1';
  const params = [];
  const isAuthenticated = Boolean(req.user);

  if (tipo) {
    query += ' AND c.tipo = ?';
    params.push(tipo);
  }

  if (estado && isAuthenticated) {
    query += ' AND c.estado = ?';
    params.push(estado);
  }

  if (capitulo) {
    query += ' AND c.capitulo = ?';
    params.push(capitulo);
  }

  // Los visitantes solo ven contenido aprobado, aunque intenten pasar otro estado.
  if (!isAuthenticated || modo === 'preview') {
    query += ' AND c.estado = ?';
    params.push('aprobado');
  }

  query += ' ORDER BY c.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
};

// GET contenido pendiente de aprobación (solo para rama)
const getPendientes = (req, res) => {
  const query = `
    SELECT c.*, u.nombre as autor_nombre 
    FROM contenido c 
    JOIN usuarios u ON c.autor_id = u.id 
    WHERE c.estado = 'pendiente_aprobacion'
    ORDER BY c.created_at ASC
  `;

  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
};

// GET contenido de un autor específico
const getMisContenido = (req, res) => {
  const { autorId } = req.params;

  if (Number(autorId) !== Number(req.user.id)) {
    return res.status(403).json({ error: 'Cannot view this content' });
  }

  const query = `
    SELECT * FROM contenido 
    WHERE autor_id = ? 
    ORDER BY created_at DESC
  `;

  db.all(query, [autorId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
};

// CREATE contenido
const createContenido = (req, res) => {
  const {
    tipo,
    titulo,
    descripcion,
    categoria,
    capitulo,
    fecha_evento,
    lugar,
    link,
  } = req.body;
  const autorId = req.user.id;
  const imagen_path = req.file ? `/uploads/${req.file.filename}` : null;

  // Director de rama publica directo; capítulos pasan por aprobación.
  const estado = req.user.rol === 'director_rama' ? 'aprobado' : 'pendiente_aprobacion';

  if (!tipo || !titulo || !descripcion) {
    return res.status(400).json({ error: 'tipo, titulo, descripcion required' });
  }

  const query = `
    INSERT INTO contenido 
    (tipo, titulo, descripcion, autor_id, capitulo, estado, imagen_path, categoria, fecha_evento, lugar, link)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [tipo, titulo, descripcion, autorId, capitulo, estado, imagen_path, categoria, fecha_evento, lugar, link],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({
        message: 'Contenido created successfully',
        id: this.lastID,
      });
    }
  );
};

// APPROVE contenido (solo director de rama)
const aprobarContenido = (req, res) => {
  const { id } = req.params;
  const { comentario } = req.body;
  const aprobadoPor = req.user.id;

  db.run('UPDATE contenido SET estado = ? WHERE id = ?', ['aprobado', id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    db.run(
      'INSERT INTO aprobaciones (contenido_id, aprobado_por, accion, comentario) VALUES (?, ?, ?, ?)',
      [id, aprobadoPor, 'aprobado', comentario],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Contenido approved' });
      }
    );
  });
};

// REJECT contenido
const rechazarContenido = (req, res) => {
  const { id } = req.params;
  const { comentario } = req.body;
  const rechazadoPor = req.user.id;

  db.run('UPDATE contenido SET estado = ? WHERE id = ?', ['rechazado', id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    db.run(
      'INSERT INTO aprobaciones (contenido_id, aprobado_por, accion, comentario) VALUES (?, ?, ?, ?)',
      [id, rechazadoPor, 'rechazado', comentario],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Contenido rejected' });
      }
    );
  });
};

// UPDATE contenido (solo autor)
const updateContenido = (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, categoria, lugar, fecha_evento } = req.body;
  const autorId = req.user.id;

  db.get('SELECT * FROM contenido WHERE id = ? AND autor_id = ?', [id, autorId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(403).json({ error: 'Cannot edit this content' });

    db.run(
      `UPDATE contenido 
       SET titulo = ?, descripcion = ?, categoria = ?, lugar = ?, fecha_evento = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [titulo, descripcion, categoria, lugar, fecha_evento, id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Contenido updated' });
      }
    );
  });
};

// DELETE contenido (solo autor o admin)
const deleteContenido = (req, res) => {
  const { id } = req.params;
  const autorId = req.user.id;

  db.get('SELECT * FROM contenido WHERE id = ? AND autor_id = ?', [id, autorId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(403).json({ error: 'Cannot delete this content' });

    db.run('DELETE FROM contenido WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Contenido deleted' });
    });
  });
};

module.exports = {
  getContenido,
  getPendientes,
  getMisContenido,
  createContenido,
  aprobarContenido,
  rechazarContenido,
  updateContenido,
  deleteContenido,
};
