const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const { sanitizeHtml, uniqueSlug, normalizeChapterForUser } = require('../utils/editorial');
const { enviarNotificacionPendiente, enviarNotificacionAprobado } = require('../utils/mailer');

// GET contenido (con filtros)
const getContenido = (req, res) => {
  const { tipo, estado, capitulo, modo, q } = req.query;
  let query = 'SELECT c.*, u.nombre as autor_nombre FROM contenido c JOIN usuarios u ON c.autor_id = u.id WHERE 1=1';
  const params = [];

  if (q) {
    query += ' AND (c.titulo LIKE ? OR c.descripcion LIKE ? OR c.extracto LIKE ?)';
    const searchParam = `%${q}%`;
    params.push(searchParam, searchParam, searchParam);
  }
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

function canManageContenido(user, contenido) {
  if (!user || !contenido) return false;
  if (user.rol === 'director_rama') return true;
  return Number(contenido.autor_id) === Number(user.id) || contenido.capitulo === user.capitulo;
}

// GET detalle administrativo por id, incluye borradores/pendientes y adjuntos
const getContenidoAdminById = (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT c.*, u.nombre as autor_usuario
     FROM contenido c
     JOIN usuarios u ON c.autor_id = u.id
     WHERE c.id = ?`,
    [id],
    (err, contenido) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!contenido) return res.status(404).json({ error: 'Contenido not found' });
      if (!canManageContenido(req.user, contenido)) {
        return res.status(403).json({ error: 'Cannot view this content' });
      }

      db.all(
        'SELECT * FROM contenido_archivos WHERE contenido_id = ? ORDER BY orden ASC, id ASC',
        [contenido.id],
        (filesErr, archivos) => {
          if (filesErr) return res.status(500).json({ error: filesErr.message });
          res.json({ ...contenido, archivos: archivos || [] });
        }
      );
    }
  );
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
    etiquetas,
    // Nuevos campos noticias
    es_destacada,
    breaking_label,
    lead_paragraph,
    // Nuevos campos académicos
    abstract,
    doi,
    peer_reviewed,
    referencias,
    publicacion_vol,
  } = req.body;
  const autorId = req.user.id;
  const imagen_path = req.file ? `/uploads/${req.file.filename}` : null;
  const safeCapitulo = normalizeChapterForUser(req.user, capitulo);
  const safeHtml = sanitizeHtml(cuerpo || descripcion || '');
  const etiquetasStr = typeof etiquetas === 'string' ? etiquetas : '[]';
  const referenciasStr = typeof referencias === 'string' ? referencias : '[]';

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
     imagen_path, categoria, fecha_evento, lugar, link, publicado_at, etiquetas,
     es_destacada, breaking_label, lead_paragraph,
     abstract, doi, peer_reviewed, referencias, publicacion_vol)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      etiquetasStr,
      es_destacada ? 1 : 0,
      breaking_label || null,
      lead_paragraph || null,
      abstract || null,
      doi || null,
      peer_reviewed ? 1 : 0,
      referenciasStr,
      publicacion_vol || null,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      if (estado === 'pendiente_aprobacion') {
        enviarNotificacionPendiente(titulo, safeCapitulo, extracto || descripcion);
      }

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
        
        // Obtener autor del contenido para enviarle correo
        db.get('SELECT c.titulo, u.email FROM contenido c JOIN usuarios u ON c.autor_id = u.id WHERE c.id = ?', [id], (err, row) => {
          if (!err && row && row.email) {
            enviarNotificacionAprobado(row.titulo, row.email);
          }
        });

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
  const {
    titulo, descripcion, cuerpo, extracto, categoria, lugar, fecha_evento, capitulo, etiquetas,
    // Nuevos campos noticias
    es_destacada, breaking_label, lead_paragraph,
    // Nuevos campos académicos
    abstract, doi, peer_reviewed, referencias, publicacion_vol,
  } = req.body;
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

    const newImagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const etiquetasStr   = typeof etiquetas   === 'string' ? etiquetas   : row.etiquetas;
    const referenciasStr = typeof referencias === 'string' ? referencias : row.referencias;

    db.run(
      `UPDATE contenido 
       SET titulo = COALESCE(?, titulo), slug = ?, descripcion = COALESCE(?, descripcion),
           cuerpo = ?, extracto = COALESCE(?, extracto), categoria = COALESCE(?, categoria),
           lugar = COALESCE(?, lugar), fecha_evento = COALESCE(?, fecha_evento),
           capitulo = ?, imagen_path = COALESCE(?, imagen_path), etiquetas = COALESCE(?, etiquetas),
           es_destacada = COALESCE(?, es_destacada), breaking_label = COALESCE(?, breaking_label),
           lead_paragraph = COALESCE(?, lead_paragraph),
           abstract = COALESCE(?, abstract), doi = COALESCE(?, doi),
           peer_reviewed = COALESCE(?, peer_reviewed), referencias = COALESCE(?, referencias),
           publicacion_vol = COALESCE(?, publicacion_vol),
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        titulo, slug, descripcion, safeHtml, extracto, categoria, lugar, fecha_evento,
        safeCapitulo, newImagePath, etiquetasStr,
        typeof es_destacada !== 'undefined' ? (es_destacada ? 1 : 0) : null,
        breaking_label || null,
        lead_paragraph || null,
        abstract || null,
        doi || null,
        typeof peer_reviewed !== 'undefined' ? (peer_reviewed ? 1 : 0) : null,
        referenciasStr,
        publicacion_vol || null,
        id,
      ],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Borrar imagen anterior si se subió una nueva
        if (newImagePath && row.imagen_path) {
          const oldFile = path.join(__dirname, '..', row.imagen_path.replace(/^\/uploads\//, 'uploads/'));
          fs.unlink(oldFile, (unlinkErr) => {
            if (unlinkErr && unlinkErr.code !== 'ENOENT') {
              console.error('Error deleting old image:', unlinkErr);
            }
          });
        }

        res.json({ message: 'Contenido updated', slug });
      }
    );
  });
};

// DELETE contenido (solo autor o admin)
const deleteContenido = (req, res) => {
  const { id } = req.params;
  const autorId = req.user.id;
  const rol = req.user.rol;

  let query = 'SELECT * FROM contenido WHERE id = ?';
  let params = [id];

  if (rol !== 'director_rama') {
    query += ' AND autor_id = ?';
    params.push(autorId);
  }

  db.get(query, params, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(403).json({ error: 'Cannot delete this content' });

    db.all('SELECT archivo_path FROM contenido_archivos WHERE contenido_id = ?', [id], (filesErr, archivos = []) => {
      if (filesErr) return res.status(500).json({ error: filesErr.message });

      db.run('DELETE FROM contenido WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Borrado físico del archivo para evitar huérfanos
      if (row.imagen_path) {
        const filePath = path.join(__dirname, '..', row.imagen_path.replace(/^\/uploads\//, 'uploads/'));
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr && unlinkErr.code !== 'ENOENT') {
            console.error('Error deleting file:', unlinkErr);
          }
        });
      }

      archivos.forEach((archivo) => {
        if (!archivo.archivo_path) return;
        const filePath = path.join(__dirname, '..', archivo.archivo_path.replace(/^\/uploads\//, 'uploads/'));
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr && unlinkErr.code !== 'ENOENT') {
            console.error('Error deleting attachment:', unlinkErr);
          }
        });
      });
      
      res.json({ message: 'Contenido deleted' });
      });
    });
  });
};

// Generador Open Graph SEO Estático
const generarOpenGraph = (req, res) => {
  const { slug } = req.params;
  const baseUrl = req.protocol + '://' + req.get('host'); // e.g. http://localhost:3000

  db.get('SELECT * FROM contenido WHERE slug = ?', [slug], (err, row) => {
    if (err || !row) {
      return res.redirect('/404.html');
    }

    const title = row.titulo;
    const description = row.extracto || row.descripcion || 'IEEE UNMSM Contenido Oficial';
    const image = row.imagen_path ? baseUrl + row.imagen_path : baseUrl + '/images/default-meta.jpg';
    
    // Redirect al frontend visual real (SPA)
    const frontendUrl = `/contenido-detalle.html?slug=${row.slug}`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title} | IEEE UNMSM</title>
  
  <!-- SEO Open Graph para Redes Sociales -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${baseUrl}/api/contenido/share/${slug}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="IEEE Rama Estudiantil UNMSM">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  
  <script>
    // Inmediatamente después de ser leído por el bot (que ignora JS),
    // el usuario humano será redirigido a la página visual real.
    window.location.href = "${frontendUrl}";
  </script>
</head>
<body>
  <p>Redirigiendo a <a href="${frontendUrl}">${title}</a>...</p>
</body>
</html>
    `;
    res.send(html);
  });
};

module.exports = {
  getContenido,
  getContenidoBySlug,
  getContenidoAdminById,
  getPendientes,
  getMisContenido,
  createContenido,
  aprobarContenido,
  rechazarContenido,
  updateContenido,
  deleteContenido,
  generarOpenGraph,
};
