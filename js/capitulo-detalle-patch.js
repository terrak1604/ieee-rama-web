/**
 * capitulo-detalle-patch.js
 * Renders the chapter detail page using proper CSS classes (no hardcoded colors).
 * Uses window.load to run AFTER main.js defer scripts.
 */
(function () {
  'use strict';

  var API_URL = window.location.origin + '/api';

  function resolveImg(path) {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return window.location.origin + (path.startsWith('/') ? path : '/' + path);
  }

  function esc(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(str) {
    if (!str) return '';
    try {
      return new Date(str).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (e) { return str; }
  }

  async function renderCapituloDetalle() {
    var root = document.getElementById('capitulo-detail-root');
    if (!root) return;

    var slug = new URLSearchParams(window.location.search).get('slug');
    if (!slug) {
      root.innerHTML = '<div class="container cap-not-found"><h2>Cap\u00edtulo no encontrado</h2>'
        + '<p>No se proporcion\u00f3 un identificador.</p>'
        + '<a href="/capitulos" class="btn btn-primary">\u2190 Volver</a></div>';
      return;
    }

    try {
      var res = await fetch(API_URL + '/capitulos/' + encodeURIComponent(slug));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var cap = await res.json();

      var sigla = cap.siglas || cap.sigla || '';

      /* ── Portada hero ── */
      var portadaUrl = resolveImg(cap.imagen_portada_path);
      var heroPortada = portadaUrl
        ? '<div class="cap-hero-portada" style="background-image:url(\'' + portadaUrl + '\');"></div>'
          + '<div class="cap-hero-overlay"></div>'
        : '';

      /* ── Logo ── */
      var logoHtml = cap.logo_path
        ? '<img class="cap-detail-logo" src="' + resolveImg(cap.logo_path) + '" alt="Logo ' + esc(sigla) + '" loading="lazy">'
        : '<div class="cap-detail-logo-placeholder">' + esc(sigla.slice(0, 3) || '?') + '</div>';

      /* ── Redes desde redes_json ── */
      var redes = [];
      if (cap.redes_json) {
        try {
          var r = typeof cap.redes_json === 'string' ? JSON.parse(cap.redes_json) : cap.redes_json;
          var redDefs = [
            { key: 'facebook',  icon: 'facebook',      label: 'Facebook'  },
            { key: 'instagram', icon: 'instagram',      label: 'Instagram' },
            { key: 'linkedin',  icon: 'linkedin',       label: 'LinkedIn'  },
            { key: 'twitter',   icon: 'twitter',        label: 'Twitter/X' },
            { key: 'youtube',   icon: 'youtube',        label: 'YouTube'   },
            { key: 'tiktok',    icon: 'music-2',        label: 'TikTok'    },
            { key: 'web',       icon: 'globe',          label: 'Sitio web' },
          ];
          redDefs.forEach(function (d) {
            if (r[d.key]) {
              redes.push('<a class="cap-social-link" href="' + esc(r[d.key]) + '" target="_blank" rel="noopener">'
                + '<i data-lucide="' + d.icon + '"></i> ' + d.label + '</a>');
            }
          });
        } catch (e) { console.warn('[patch] redes_json:', e); }
      }
      if (cap.email_contacto) {
        redes.push('<a class="cap-social-link" href="mailto:' + esc(cap.email_contacto) + '">'
          + '<i data-lucide="mail"></i> Email</a>');
      }

      /* ── Sidebar info rows — no inline colors ── */
      var infoRows = '';
      if (cap.fecha_fundacion) {
        infoRows += '<div class="cap-info-row"><strong>Fundaci\u00f3n</strong><span>' + esc(formatDate(cap.fecha_fundacion)) + '</span></div>';
      }
      if (cap.email_contacto) {
        infoRows += '<div class="cap-info-row"><strong>Email</strong>'
          + '<a href="mailto:' + esc(cap.email_contacto) + '">' + esc(cap.email_contacto) + '</a></div>';
      }
      if (cap.link_externo) {
        var shortLink = cap.link_externo.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
        if (shortLink.length > 35) shortLink = shortLink.slice(0, 33) + '...';
        infoRows += '<div class="cap-info-row"><strong>Sitio web</strong>'
          + '<a href="' + esc(cap.link_externo) + '" target="_blank" rel="noopener">' + esc(shortLink) + '</a></div>';
      }
      if (!infoRows) {
        infoRows = '<p style="color:var(--text-muted);font-size:0.85rem;margin:0;">Sin informaci\u00f3n adicional.</p>';
      }

      /* ── Publicaciones recientes — usando clases CSS ── */
      var recientes = (cap.contenidos || []).slice(0, 3);
      var recienteHtml = '';
      if (recientes.length) {
        var cards = recientes.map(function (c) {
          var ext = (c.extracto || '').slice(0, 100);
          var imgSrc = c.imagen_path ? resolveImg(c.imagen_path) : '';
          return '<a class="cap-reciente-card" href="/contenido-detalle?slug=' + esc(c.slug) + '">'
            + (imgSrc ? '<img class="cap-reciente-card-img" src="' + imgSrc + '" alt="" loading="lazy">' : '')
            + '<div class="cap-reciente-card-body">'
            + '<span class="article-type-badge type-' + esc(c.tipo) + '">' + esc(c.tipo) + '</span>'
            + '<p class="cap-reciente-title">' + esc(c.titulo) + '</p>'
            + '<p class="cap-reciente-excerpt">' + esc(ext) + (ext.length >= 100 ? '...' : '') + '</p>'
            + '</div></a>';
        }).join('');

        recienteHtml = '<section class="cap-recientes-section">'
          + '<div class="container">'
          + '<h2>Publicaciones Recientes</h2>'
          + '<div class="cap-reciente-grid">' + cards + '</div>'
          + '</div></section>';
      }

      /* ── Compartir ── */
      var pageUrl = window.location.href;
      var shareBar = '<div class="share-bar">'
        + '<span>Compartir:</span>'
        + '<button class="share-btn share-btn-copy" onclick="navigator.clipboard.writeText(\'' + pageUrl.replace(/'/g, "\\'") + '\')">'
        + '<i data-lucide="link"></i> Copiar enlace</button>'
        + '<a class="share-btn share-btn-wa" href="https://wa.me/?text=' + encodeURIComponent((cap.nombre || sigla) + ' ' + pageUrl) + '" target="_blank" rel="noopener">'
        + '<i data-lucide="message-circle"></i> WhatsApp</a>'
        + '</div>';

      /* ── Hero buttons ── */
      var heroBtns = ''
        + (cap.link_externo ? '<a href="' + esc(cap.link_externo) + '" target="_blank" rel="noopener" class="btn btn-primary"><i data-lucide="globe"></i> Sitio web</a>' : '')
        + '<a href="/capitulos" class="btn btn-secondary">\u2190 Todos los cap\u00edtulos</a>';

      /* ── Render final ── */
      root.innerHTML =
        '<div class="cap-detail-hero">'
          + heroPortada
          + '<div class="container" style="position:relative;z-index:3;">'
          +   logoHtml
          +   '<div class="cap-detail-meta">'
          +     (sigla ? '<span class="cap-detail-sigla">' + esc(sigla) + '</span>' : '')
          +     '<h1>' + esc(cap.nombre || sigla) + '</h1>'
          +     (cap.descripcion_corta ? '<p class="cap-detail-desc">' + esc(cap.descripcion_corta) + '</p>' : '')
          +     '<div class="cap-detail-actions">' + heroBtns + '</div>'
          +   '</div>'
          + '</div>'
        + '</div>'

        + '<section class="cap-detail-body">'
          + '<div class="container cap-detail-grid">'
            + '<div class="cap-detail-main">'
              + (cap.descripcion_larga ? '<h2>Sobre el cap\u00edtulo</h2><p>' + cap.descripcion_larga + '</p>' : '')
              + (cap.mision ? '<h2>Misi\u00f3n</h2><p>' + cap.mision + '</p>' : '')
              + (cap.vision ? '<h2>Visi\u00f3n</h2><p>' + cap.vision + '</p>' : '')
              + shareBar
            + '</div>'
            + '<aside>'
              + '<div class="cap-sidebar-card"><h3>Informaci\u00f3n</h3>' + infoRows + '</div>'
              + (redes.length
                  ? '<div class="cap-sidebar-card"><h3>Redes y contacto</h3><div class="cap-social-links">' + redes.join('') + '</div></div>'
                  : '')
            + '</aside>'
          + '</div>'
        + '</section>'
        + recienteHtml;

      if (window.lucide) window.lucide.createIcons();

    } catch (err) {
      console.error('[capitulo-detalle-patch]', err);
      root.innerHTML = '<div class="container cap-not-found">'
        + '<h2>Cap\u00edtulo no encontrado</h2>'
        + '<p>No existe un cap\u00edtulo con ese identificador.<br>'
        + '<small>' + esc(err.message) + '</small></p>'
        + '<a href="/capitulos" class="btn btn-primary">\u2190 Volver a Cap\u00edtulos</a></div>';
    }
  }

  // Ejecutar después de todos los scripts defer (window.load garantiza esto)
  window.addEventListener('load', function () {
    setTimeout(renderCapituloDetalle, 50);
  });

})();
