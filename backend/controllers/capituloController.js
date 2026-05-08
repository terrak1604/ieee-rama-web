const db = require('../config/db');
const { uniqueSlug } = require('../utils/editorial');
const { uploadPath } = require('../middleware/upload');

const publicChapterFields = `
  id, slug, nombre, siglas, descripcion_corta, descripcion_larga, logo_path,
  imagen_portada_path, color, email_contacto, link_externo, redes_json,
  director_id, mision, vision, fecha_fundacion, activo, updated_at
`;

function canEditChapter(user, chapter) {
  if (!user) return false;
  if (user.rol === 'director_rama') return true;
  return user.rol === 'director_capitulo' && user.capitulo === chapter.slug;
}

const listCapitulos = (req, res) => {
  db.all(
    `SELECT id, slug, nombre, siglas, descripcion_corta, logo_path, imagen_portada_path, color
     FROM capitulo_detalle
     WHERE activo = 1
     ORDER BY nombre ASC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
};

const getCapitulo = (req, res) => {
  db.get(
    `SELECT ${publicChapterFields} FROM capitulo_detalle WHERE slug = ? AND activo = 1`,
    [req.params.slug],
    (err, capitulo) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!capitulo) return res.status(404).json({ error: 'Capitulo not found' });

      db.all(
        `SELECT id, slug, tipo, titulo, descripcion, extracto, imagen_path, categoria,
                fecha_evento, lugar, publicado_at, created_at, vistas
         FROM contenido
         WHERE estado = 'aprobado' AND capitulo = ?
         ORDER BY COALESCE(publicado_at, created_at) DESC`,
        [capitulo.slug],
        (contentErr, contenidos) => {
          if (contentErr) return res.status(500).json({ error: contentErr.message });
          res.json({ ...capitulo, contenidos: contenidos || [] });
        }
      );
    }
  );
};

const updateCapitulo = async (req, res) => {
  db.get('SELECT * FROM capitulo_detalle WHERE slug = ?', [req.params.slug], async (err, capitulo) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!capitulo) return res.status(404).json({ error: 'Capitulo not found' });
    if (!canEditChapter(req.user, capitulo)) return res.status(403).json({ error: 'Cannot edit this capitulo' });

    const {
      nombre,
      siglas,
      descripcion_corta,
      descripcion_larga,
      color,
      email_contacto,
      link_externo,
      redes_json,
      mision,
      vision,
      fecha_fundacion,
      activo,
    } = req.body;

    let nextSlug = capitulo.slug;
    if (req.user.rol === 'director_rama' && nombre && nombre !== capitulo.nombre) {
      nextSlug = await uniqueSlug(db, 'capitulo_detalle', nombre, capitulo.id);
    }

    db.run(
      `UPDATE capitulo_detalle
       SET slug = ?, nombre = COALESCE(?, nombre), siglas = COALESCE(?, siglas),
           descripcion_corta = COALESCE(?, descripcion_corta),
           descripcion_larga = COALESCE(?, descripcion_larga),
           color = COALESCE(?, color), email_contacto = COALESCE(?, email_contacto),
           link_externo = COALESCE(?, link_externo), redes_json = COALESCE(?, redes_json),
           mision = COALESCE(?, mision), vision = COALESCE(?, vision),
           fecha_fundacion = COALESCE(?, fecha_fundacion),
           activo = COALESCE(?, activo), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        nextSlug,
        nombre,
        siglas,
        descripcion_corta,
        descripcion_larga,
        color,
        email_contacto,
        link_externo,
        redes_json,
        mision,
        vision,
        fecha_fundacion,
        typeof activo === 'undefined' ? null : activo ? 1 : 0,
        capitulo.id,
      ],
      (updateErr) => {
        if (updateErr) return res.status(500).json({ error: updateErr.message });
        res.json({ message: 'Capitulo updated', slug: nextSlug });
      }
    );
  });
};

const uploadCapituloArchivo = (req, res) => {
  db.get('SELECT * FROM capitulo_detalle WHERE slug = ?', [req.params.slug], (err, capitulo) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!capitulo) return res.status(404).json({ error: 'Capitulo not found' });
    if (!canEditChapter(req.user, capitulo)) return res.status(403).json({ error: 'Cannot edit this capitulo' });
    const file =
      (req.files && req.files.portada && req.files.portada[0]) ||
      (req.files && req.files.logo && req.files.logo[0]) ||
      (req.files && req.files.archivo && req.files.archivo[0]);

    if (!file) return res.status(400).json({ error: 'archivo required' });

    const tipo = file.fieldname === 'portada' || req.body.tipo === 'portada'
      ? 'imagen_portada_path'
      : 'logo_path';
    const filePath = uploadPath(file);

    db.run(
      `UPDATE capitulo_detalle SET ${tipo} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [filePath, capitulo.id],
      (updateErr) => {
        if (updateErr) return res.status(500).json({ error: updateErr.message });
        res.status(201).json({ message: 'Archivo uploaded', path: filePath, tipo });
      }
    );
  });
};

module.exports = {
  listCapitulos,
  getCapitulo,
  updateCapitulo,
  uploadCapituloArchivo,
};
