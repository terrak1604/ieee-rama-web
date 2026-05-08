const db = require('../config/db');
const { sanitizeHtml, uniqueSlug, normalizeChapterForUser } = require('../utils/editorial');

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

// GET detalle publico por slug
const getContenidoBySlug = (req, res) => {
  const query = `
    SELECT c.*, u.nombre as autor_usuario
    FROM contenido c
    JOIN usuarios u ON c.autor_id = u.id
    WHERE c.slug = ? AND c.estado = 'aprobado'
  `;

  db.get(query, [req.params.slug], (err, contenido) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!contenido) return res.status(404).json({ error: 'Contenido not found' });

    db.run('UPDATE contenido SET vistas = COALESCE(vistas, 0) + 1 WHERE id = ?', [contenido.id]);

    db.all(
      'SELECT * FROM contenido_archivos WHERE contenido_id = ? ORDER BY orden ASC, id ASC',
      [contenido.id],
      (filesErr, archivos) => {
        if (filesErr) return res.status(500).json({ error: filesErr.message });
        res.json({
          ...contenido,
          vistas: Number(contenido.vistas || 0) + 1,
          archivos: archivos || [],
        });
      }
    );
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
const createContenido = async (req, res) => {
  const {
    tipo,
    titulo,
    descripcion,
    cuerpo,
    extracto,
    categoria,
    capitulo,
    fecha_evento,
    lugar,
    link,
  } = req.body;
  const autorId = req.user.id;
  const imagen_path = req.file ? `/uploads/${req.file.filename}` : null;
  const safeCapitulo = normalizeChapterForUser(req.user, capitulo);
  const safeHtml = sanitizeHtml(cuerpo || descripcion || '');

  // Director de rama publica directo; capítulos pasan por aprobación.
  const estado = req.user.rol === 'director_rama' ? 'aprobado' : 'pendiente_aprobacion';
  const publicadoAt = estado === 'aprobado' ? new Date().toISOString() : null;

  if (!tipo || !titulo || !descripcion) {
    return res.status(400).json({ error: 'tipo, titulo, descripcion required' });
  }

  let slug;
  try {
    slug = await uniqueSlug(db, 'contenido', titulo);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const query = `
    INSERT INTO contenido 
    (tipo, titulo, slug, descripcion, cuerpo, extracto, autor_id, autor_nombre, capitulo, estado,
     imagen_path, categoria, fecha_evento, lugar, link, publicado_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      tipo,
      titulo,
      slug,
      descripcion,
      safeHtml,
      extracto || descripcion,
      autorId,
      req.user.nombre,
      safeCapitulo,
      estado,
      imagen_path,
      categoria,
      fecha_evento,
      lugar,
      link,
      publicadoAt,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({
        message: 'Contenido created successfully',
        id: this.lastID,
        slug,
      });
    }
  );
};

// APPROVE contenido (solo director de rama)
const aprobarContenido = (req, res) => {
  const { id } = req.params;
  const { comentario } = req.body;
  const aprobadoPor = req.user.id;

  db.run(
    'UPDATE contenido SET estado = ?, publicado_at = COALESCE(publicado_at, CURRENT_TIMESTAMP) WHERE id = ?',
    ['aprobado', id],
    function (err) {
    if (err) return res.status(500).json({ error: err.message });

    db.run(
      'INSERT INTO aprobaciones (contenido_id, aprobado_por, accion, comentario) VALUES (?, ?, ?, ?)',
      [id, aprobadoPor, 'aprobado', comentario],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Contenido approved' });
      }
    );
    }
  );
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
const updateContenido = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, cuerpo, extracto, categoria, lugar, fecha_evento, capitulo } = req.body;
  const autorId = req.user.id;

  db.get('SELECT * FROM contenido WHERE id = ?', [id], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Contenido not found' });
    if (req.user.rol !== 'director_rama' && Number(row.autor_id) !== Number(autorId)) {
      return res.status(403).json({ error: 'Cannot edit this content' });
    }

    const safeCapitulo = normalizeChapterForUser(req.user, capitulo || row.capitulo);
    const safeHtml = typeof cuerpo === 'undefined' ? row.cuerpo : sanitizeHtml(cuerpo);
    let slug = row.slug;

    if (titulo && titulo !== row.titulo) {
      try {
        slug = await uniqueSlug(db, 'contenido', titulo, row.id);
      } catch (slugErr) {
        return res.status(500).json({ error: slugErr.message });
      }
    }

    db.run(
      `UPDATE contenido 
       SET titulo = COALESCE(?, titulo), slug = ?, descripcion = COALESCE(?, descripcion),
           cuerpo = ?, extracto = COALESCE(?, extracto), categoria = COALESCE(?, categoria),
           lugar = COALESCE(?, lugar), fecha_evento = COALESCE(?, fecha_evento),
           capitulo = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [titulo, slug, descripcion, safeHtml, extracto, categoria, lugar, fecha_evento, safeCapitulo, id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Contenido updated', slug });
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
  getContenidoBySlug,
  getPendientes,
  getMisContenido,
  createContenido,
  aprobarContenido,
  rechazarContenido,
  updateContenido,
  deleteContenido,
};
