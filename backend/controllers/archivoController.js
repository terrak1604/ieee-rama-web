const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { uploadPath } = require('../middleware/upload');

function canEditContent(user, contenido) {
  if (!user) return false;
  if (user.rol === 'director_rama') return true;
  return Number(contenido.autor_id) === Number(user.id) || contenido.capitulo === user.capitulo;
}

const uploadContenidoArchivos = (req, res) => {
  db.get('SELECT * FROM contenido WHERE id = ?', [req.params.id], (err, contenido) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!contenido) return res.status(404).json({ error: 'Contenido not found' });
    if (!canEditContent(req.user, contenido)) return res.status(403).json({ error: 'Cannot edit this content' });

    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'archivos required' });

    const stmt = db.prepare(
      `INSERT INTO contenido_archivos
       (contenido_id, tipo, archivo_path, nombre_original, mime_type, tamaño_bytes, orden, caption)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const inserted = files.map((file, index) => {
      const tipo = file.mimetype.startsWith('image/') ? 'imagen' : 'documento';
      const archivo_path = uploadPath(file);
      const caption = req.body[`caption_${index}`] || req.body.caption || '';
      const ordenRaw = req.body[`orden_${index}`] ?? req.body.orden ?? index;
      const orden = Number.isFinite(Number(ordenRaw)) ? Number(ordenRaw) : index;

      stmt.run([
        contenido.id,
        tipo,
        archivo_path,
        file.originalname,
        file.mimetype,
        file.size,
        orden,
        caption,
      ]);

      return { tipo, archivo_path, nombre_original: file.originalname, mime_type: file.mimetype, orden, caption };
    });

    stmt.finalize((finalizeErr) => {
      if (finalizeErr) return res.status(500).json({ error: finalizeErr.message });
      res.status(201).json({ message: 'Archivos uploaded', archivos: inserted });
    });
  });
};

const deleteContenidoArchivo = (req, res) => {
  const { id, archivoId } = req.params;

  db.get('SELECT * FROM contenido WHERE id = ?', [id], (contentErr, contenido) => {
    if (contentErr) return res.status(500).json({ error: contentErr.message });
    if (!contenido) return res.status(404).json({ error: 'Contenido not found' });
    if (!canEditContent(req.user, contenido)) return res.status(403).json({ error: 'Cannot edit this content' });

    db.get(
      'SELECT * FROM contenido_archivos WHERE id = ? AND contenido_id = ?',
      [archivoId, id],
      (err, archivo) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!archivo) return res.status(404).json({ error: 'Archivo not found' });

        db.run('DELETE FROM contenido_archivos WHERE id = ?', [archivoId], (deleteErr) => {
          if (deleteErr) return res.status(500).json({ error: deleteErr.message });

          const localPath = path.join(__dirname, '..', archivo.archivo_path.replace(/^\/uploads\//, 'uploads/'));
          fs.unlink(localPath, () => {
            res.json({ message: 'Archivo deleted' });
          });
        });
      }
    );
  });
};

module.exports = {
  uploadContenidoArchivos,
  deleteContenidoArchivo,
};
