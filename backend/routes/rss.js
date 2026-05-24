const express = require('express');
const router = express.Router();
const db = require('../config/db');

const esc = (str = '') => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// GET /api/rss  —  feed RSS 2.0 público del portal
router.get('/', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://ieee-unmsm.org';
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  const query = `
    SELECT id, tipo, titulo, descripcion, extracto, slug, capitulo,
           autor_nombre, created_at, publicado_at, imagen_path
    FROM contenido
    WHERE estado = 'aprobado'
    ORDER BY COALESCE(publicado_at, created_at) DESC
    LIMIT ?`;

  db.all(query, [limit], (err, rows) => {
    if (err) return res.status(500).send('Error generating feed');

    const items = (rows || []).map(row => {
      const date = new Date(row.publicado_at || row.created_at).toUTCString();
      const link = `${siteUrl}/contenido-detalle.html?slug=${esc(row.slug)}`;
      const desc = esc(row.extracto || row.descripcion || '').substring(0, 300);
      const img = row.imagen_path
        ? `<enclosure url="${siteUrl}/uploads/${esc(row.imagen_path)}" type="image/jpeg"/>`
        : '';
      return `
    <item>
      <title>${esc(row.titulo)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${desc}</description>
      <pubDate>${date}</pubDate>
      <category>${esc(row.tipo)}</category>
      ${row.capitulo ? `<author>${esc(row.capitulo)}</author>` : ''}
      ${img}
    </item>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>IEEE Rama Estudiantil UNMSM</title>
    <link>${siteUrl}</link>
    <description>Noticias, proyectos y eventos de la Rama Estudiantil IEEE UNMSM</description>
    <language>es-PE</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    res.send(xml);
  });
});

module.exports = router;
