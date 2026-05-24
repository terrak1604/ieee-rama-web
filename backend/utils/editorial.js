const slugify = require('slugify');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

function sanitizeHtml(value) {
  const withoutExecutableBlocks = String(value || '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  return DOMPurify.sanitize(withoutExecutableBlocks, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    ADD_ATTR: ['target', 'rel'],
  });
}

function baseSlug(value) {
  return slugify(value || 'contenido', {
    lower: true,
    strict: true,
    trim: true,
  }) || 'contenido';
}

function uniqueSlug(db, table, value, currentId = null) {
  const base = baseSlug(value);

  return new Promise((resolve, reject) => {
    const trySlug = (candidate, attempts = 0) => {
      const params = [candidate];
      let query = `SELECT id FROM ${table} WHERE slug = ?`;

      if (currentId) {
        query += ' AND id != ?';
        params.push(currentId);
      }

      db.get(query, params, (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(candidate);

        const suffix = Math.random().toString(36).slice(2, 8);
        trySlug(`${base}-${suffix}`, attempts + 1);
      });
    };

    trySlug(base);
  });
}

function normalizeChapterForUser(user, requestedChapter) {
  if (user && user.rol === 'director_capitulo') {
    return user.capitulo;
  }
  return requestedChapter || null;
}

module.exports = {
  sanitizeHtml,
  uniqueSlug,
  normalizeChapterForUser,
};
