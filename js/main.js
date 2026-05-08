/**
 * IEEE Rama General UNMSM - JavaScript Principal
 * Carga dinámica de datos JSON, partículas avanzadas, animaciones y navegación
 */

const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api';
const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// ════════════════════════════════════════════════════════
//  SISTEMA DE PARTÍCULAS AVANZADO – Capa 1: particles.js
// ════════════════════════════════════════════════════════
const PARTICLES_CONFIG = {
  particles: {
    number: { value: 55, density: { enable: true, value_area: 800 } },
    color: { value: ['#00629b', '#002855', '#0099d6', '#004d80', '#0073b7'] },
    shape: {
      type: ['circle', 'triangle'],
      stroke: { width: 0 }
    },
    opacity: {
      value: 0.75,
      random: true,
      anim: { enable: false }
    },
    size: {
      value: 3.5,
      random: true,
      anim: { enable: false }
    },
    line_linked: {
      enable: true,
      distance: 120,
      color: '#004d80',
      opacity: 0.45,
      width: 1
    },
    move: {
      enable: true,
      speed: 1.2,
      direction: 'none',
      random: true,
      straight: false,
      out_mode: 'out',
      bounce: false,
      attract: { enable: false }
    }
  },
  interactivity: {
    detect_on: 'window',
    events: {
      onhover: { enable: true, mode: 'grab' },
      onclick:  { enable: true, mode: 'repulse' },
      resize: true
    },
    modes: {
      grab:    { distance: 160, line_linked: { opacity: 0.9 } },
      repulse: { distance: 130, duration: 0.4 }
    }
  },
  retina_detect: false
};

// ════════════════════════════════════════════════════════
//  SISTEMA DE PARTÍCULAS AVANZADO – Capa 2: Canvas propio
//  Nodos pulsantes + líneas de circuito + efecto aurora
// ════════════════════════════════════════════════════════
function initAdvancedCanvas() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.style.cssText = `
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 1; pointer-events: none;
  `;
  document.body.insertBefore(canvas, document.body.firstChild);

  if (prefersReduced) return; // sin animación para usuarios que lo prefieran

  const ctx = canvas.getContext('2d', { alpha: true });
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  // ─ Estado del mouse (throttled) ─
  const mouse = { x: -9999, y: -9999 };
  let mouseMoveFrame = 0;
  window.addEventListener('mousemove', e => {
    mouseMoveFrame++;
    if (mouseMoveFrame % 2 === 0) { mouse.x = e.clientX; mouse.y = e.clientY; }
  });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  // ─ Sparks al hacer clic (reducidos) ─
  let sparks = [];
  window.addEventListener('click', e => {
    const COUNT = 10;
    for (let i = 0; i < COUNT; i++) {
      const angle = (Math.PI * 2 / COUNT) * i + Math.random() * 0.3;
      const speed = 2 + Math.random() * 3.5;
      sparks.push({
        x: e.clientX, y: e.clientY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.03 + Math.random() * 0.02,
        r: 1.5 + Math.random() * 2,
        isGold: Math.random() < 0.4
      });
    }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      NODE_COUNT = Math.min(18, Math.floor((W * H) / 40000));
      MAX_DIST = Math.min(W, H) * 0.20;
      initNodes();
    }, 150);
  });

  const COLORS = {
    node1:  'rgba(0, 80, 160,',
    node2:  'rgba(0, 50, 120,',
    gold:   'rgba(160, 110, 0,',
    line:   'rgba(0, 90, 170,',
    aurora1:'rgba(0, 60, 150,',
    aurora2:'rgba(0, 100, 200,'
  };

  let nodes = [];
  let NODE_COUNT = Math.min(18, Math.floor((W * H) / 40000));

  function initNodes() {
    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      baseVx: (Math.random() - 0.5) * 0.35,
      baseVy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 2.5 + 1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.015 + Math.random() * 0.02,
      isGold: Math.random() < 0.12,
      brightness: 0.4 + Math.random() * 0.6
    }));
  }
  initNodes();

  let auroraT = 0;
  let auroraFrame = 0;

  function drawAurora() {
    // Solo actualizar posición cada 2 frames (aurora se mueve muy lento, inapreciable)
    auroraFrame++;
    if (auroraFrame % 2 === 0) auroraT += 0.003;

    const g1 = ctx.createRadialGradient(
      W * (0.15 + Math.sin(auroraT * 0.7) * 0.08),
      H * (0.20 + Math.cos(auroraT * 0.5) * 0.06),
      0, W * 0.25, H * 0.25, W * 0.42
    );
    g1.addColorStop(0,   'rgba(0, 80, 180, 0.07)');
    g1.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(
      W * (0.78 + Math.cos(auroraT * 0.6) * 0.07),
      H * (0.70 + Math.sin(auroraT * 0.4) * 0.07),
      0, W * 0.78, H * 0.70, W * 0.38
    );
    g2.addColorStop(0,   'rgba(0, 100, 200, 0.05)');
    g2.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
  }

  // ─ Aura del cursor ─
  function drawMouseAura() {
    if (mouse.x < 0) return;
    const aura = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 90);
    aura.addColorStop(0,   'rgba(0, 100, 200, 0.08)');
    aura.addColorStop(1,   'rgba(0, 0, 0, 0)');
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 90, 0, Math.PI * 2);
    ctx.fillStyle = aura;
    ctx.fill();
  }

  let MAX_DIST = Math.min(W, H) * 0.22;
  const MOUSE_REPEL_DIST = 130;
  const MOUSE_ATTRACT_DIST = 260;

  function drawConnections() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DIST) {
          const alpha = (1 - d / MAX_DIST) * 0.55;
          ctx.beginPath();
          ctx.strokeStyle = `${COLORS.line}${alpha})`;
          ctx.lineWidth = 0.7;
          if (Math.abs(dx) > Math.abs(dy)) {
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
          } else {
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[i].x, nodes[j].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
          }
          ctx.stroke();

          // Línea brillante al mouse cuando está cerca
          const mdx = (nodes[i].x + nodes[j].x) / 2 - mouse.x;
          const mdy = (nodes[i].y + nodes[j].y) / 2 - mouse.y;
          const md  = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < MOUSE_ATTRACT_DIST) {
            const boost = (1 - md / MOUSE_ATTRACT_DIST) * 0.5;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 212, 255, ${boost})`;
            ctx.lineWidth = 0.7 + boost * 1.5;
            if (Math.abs(dx) > Math.abs(dy)) {
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
            } else {
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[i].x, nodes[j].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
            }
            ctx.stroke();
          }
        }
      }
    }
  }

  function drawNodes() {
    nodes.forEach(n => {
      // ─ Interacción con el mouse ─
      const mdx = n.x - mouse.x;
      const mdy = n.y - mouse.y;
      const md  = Math.sqrt(mdx * mdx + mdy * mdy);

      if (md < MOUSE_REPEL_DIST && md > 0) {
        // Repulsión fuerte al acercarse
        const force = (1 - md / MOUSE_REPEL_DIST) * 3.5;
        n.vx += (mdx / md) * force * 0.12;
        n.vy += (mdy / md) * force * 0.12;
      } else if (md < MOUSE_ATTRACT_DIST && md > MOUSE_REPEL_DIST) {
        // Atracción suave en zona intermedia
        const force = (1 - (md - MOUSE_REPEL_DIST) / (MOUSE_ATTRACT_DIST - MOUSE_REPEL_DIST)) * 0.6;
        n.vx -= (mdx / md) * force * 0.04;
        n.vy -= (mdy / md) * force * 0.04;
      }

      // Amortiguación para volver a velocidad base
      n.vx += (n.baseVx - n.vx) * 0.03;
      n.vy += (n.baseVy - n.vy) * 0.03;
      // Limitar velocidad máxima
      const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed > 6) { n.vx = (n.vx / speed) * 6; n.vy = (n.vy / speed) * 6; }

      n.pulse += n.pulseSpeed;
      const isNearMouse = md < MOUSE_ATTRACT_DIST;
      // Clamp a un mínimo positivo: si n.r es chico (~1) y Math.sin() está
      // en -1, pulseR puede ser negativo y romper createRadialGradient.
      const pulseRRaw = n.r + Math.sin(n.pulse) * 1.2 + (isNearMouse ? (1 - md / MOUSE_ATTRACT_DIST) * 3 : 0);
      const pulseR = Math.max(0.5, pulseRRaw);
      const alpha  = 0.7 + Math.sin(n.pulse) * 0.25 + (isNearMouse ? (1 - md / MOUSE_ATTRACT_DIST) * 0.4 : 0);
      const color  = n.isGold ? COLORS.gold : (isNearMouse && md < MOUSE_REPEL_DIST ? 'rgba(0, 212, 255,' : COLORS.node1);

      const halo = ctx.createRadialGradient(n.x, n.y, pulseR * 0.5, n.x, n.y, pulseR * 3.5);
      halo.addColorStop(0,   `${color}${(alpha * 0.45).toFixed(2)})`);
      halo.addColorStop(1,   `${color}0)`);
      ctx.beginPath();
      ctx.arc(n.x, n.y, pulseR * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(n.x, n.y, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = `${color}${Math.min(alpha + 0.3, 0.95).toFixed(2)})`;
      ctx.fill();

      n.x += n.vx; n.y += n.vy;
      if (n.x < -10) n.x = W + 10;
      if (n.x > W + 10) n.x = -10;
      if (n.y < -10) n.y = H + 10;
      if (n.y > H + 10) n.y = -10;
    });
  }

  // ─ Sparks de explosión ─
  function drawSparks() {
    sparks = sparks.filter(s => s.life > 0);
    sparks.forEach(s => {
      s.x += s.vx; s.y += s.vy;
      s.vx *= 0.95; s.vy *= 0.95;
      s.life -= s.decay;
      if (s.life <= 0) return; // evitar radio negativo
      const color = s.isGold ? `rgba(180,120,0,${s.life.toFixed(2)})` : `rgba(0,100,200,${s.life.toFixed(2)})`;
      const radius = Math.max(0.1, s.r * s.life);
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      // Estela
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 4, s.y - s.vy * 4);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(0.1, s.r * s.life * 0.6);
      ctx.stroke();
    });
  }

  function drawGrid() {
    const spacing = 80;
    ctx.strokeStyle = 'rgba(0, 80, 160, 0.07)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 0; x < W; x += spacing) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y < H; y += spacing) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
  }

  const TARGET_FPS = 30;
  const FRAME_MS   = 1000 / TARGET_FPS;
  let lastTickTime = 0;

  function tick(timestamp) {
    requestAnimationFrame(tick);
    if (timestamp - lastTickTime < FRAME_MS) return;
    lastTickTime = timestamp;

    ctx.clearRect(0, 0, W, H);
    drawAurora();
    drawGrid();
    drawMouseAura();
    drawConnections();
    drawNodes();
    drawSparks();
  }
  requestAnimationFrame(tick);
}

// ── DOM Ready ──
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initAdvancedCanvas();
  initParticles();
  initNavbar();
  loadSiteImages();
  loadCapitulos();
  loadNoticias();
  loadProyectos();
  loadConcursos();
  loadRevistas();
  initGaleria();
  initLightbox();
  initContactForm();
  initFAQ();
  initScrollAnimations();
});

// ── Loader ──
// El loader se oculta cuando ocurra el PRIMERO de:
//   a) window.load + 800ms  (todos los recursos cargados)
//   b) 2500ms desde DOMContentLoaded  (failsafe si el CDN va lento)
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  let hidden = false;
  const hide = () => {
    if (hidden) return;
    hidden = true;
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 600);
  };
  window.addEventListener('load', () => setTimeout(hide, 800));
  setTimeout(hide, 2500);
}

// ── Partículas (particles.js – Capa 1) ──
function initParticles() {
  if (typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', PARTICLES_CONFIG);
  }
}

// ── Navbar ──
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks = document.getElementById('nav-links');

  // Scroll effect
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    updateActiveLink();
  });

  // Hamburger toggle
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Smooth scroll en links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 72;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
        if (navLinks && navLinks.classList.contains('open')) {
          navLinks.classList.remove('open');
          if (hamburger) {
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
          }
        }
      }
    });
  });
}

// Solo actúa como scrollspy en la home (index.html). En subpáginas el link
// activo viene marcado en el HTML (class="active") y no debe sobrescribirse.
function updateActiveLink() {
  if (document.body.dataset.page !== 'home') return;
  const sections = ['inicio', 'capitulos', 'noticias', 'proyectos', 'concursos', 'revista', 'galeria', 'contacto'];
  const links = document.querySelectorAll('.nav-links a');
  let current = '';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 120) current = id;
  });
  links.forEach(a => {
    a.classList.remove('active');
    const href = a.getAttribute('href') || '';
    if (href === `#${current}` || href === `index.html#${current}`) a.classList.add('active');
  });
}

// ── Carga de Capítulos desde JSON ──
// container puede tener:
//   data-mode="preview" (default) → muestra solo los primeros N (data-limit)
//   data-mode="full"               → muestra todos + activa filtros si existen
async function loadCapitulos() {
  const container = document.getElementById('capitulos-container');
  if (!container) return;
  const mode  = container.dataset.mode  || 'preview';
  const limit = parseInt(container.dataset.limit || '6', 10);
  try {
    const res = await fetch('data/capitulos.json');
    const capitulos = await res.json();
    const render = (list) => {
      if (!list.length) {
        container.innerHTML = '<p class="no-results">No se encontraron capítulos con ese criterio.</p>';
        return;
      }
      container.innerHTML = list.map(cap => createCapituloCard(cap)).join('');
      animateCards(container.querySelectorAll('.capitulo-card'));
    };
    if (mode === 'full') {
      container.classList.add('full');
      render(capitulos);
      initCapitulosFilters(capitulos, render);
    } else {
      render(capitulos.slice(0, limit));
    }
  } catch (err) {
    console.warn('Error cargando capítulos:', err);
    container.innerHTML = '<p class="loading-text">Error cargando capítulos. Verifica el archivo data/capitulos.json</p>';
  }
}

function initCapitulosFilters(capitulos, render) {
  const search = document.getElementById('cap-search');
  if (!search) return;
  const apply = () => {
    const q = search.value.trim().toLowerCase();
    const filtered = capitulos.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.siglas.toLowerCase().includes(q) ||
      c.descripcion.toLowerCase().includes(q)
    );
    render(filtered);
  };
  search.addEventListener('input', apply);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function escapeAttribute(value) {
  const text = String(value ?? '#').trim();
  if (/^\s*javascript:/i.test(text)) return '#';
  return escapeHTML(text);
}

function sanitizeColor(value, fallback = '#0099d6') {
  const text = String(value ?? '').trim();
  return /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(text) ? text : fallback;
}

function safeParseDate(dateStr) {
  if (!dateStr) return new Date();
  const s = String(dateStr).trim();
  if (s.includes('T') || s.includes(' ')) return new Date(s);
  return new Date(s + 'T00:00:00');
}

function resolveImageUrl(imagePath) {
  if (!imagePath || imagePath === 'placeholder.jpg') return null;
  const p = String(imagePath).trim();
  if (p.startsWith('/uploads/')) return UPLOADS_BASE_URL + p;
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  return p; // ruta local relativa como images/noticias/xxx.jpg
}

// ── Carga de imágenes del sitio (hero, logo) ──
async function loadSiteImages() {
  try {
    const res = await fetch(`${API_BASE_URL}/site-images`);
    if (!res.ok) return;
    const images = await res.json();
    images.forEach(img => {
      if (!img.path) return;
      const url = resolveImageUrl(img.path);
      if (img.clave === 'hero') {
        const wrapper = document.getElementById('hero-img-wrapper');
        if (wrapper) {
          wrapper.innerHTML = `<img src="${escapeAttribute(url)}" alt="${escapeHTML(img.alt_text || 'IEEE UNMSM')}" class="hero-real-img">`;
        }
      }
      if (img.clave === 'logo') {
        const logoEl = document.querySelector('.nav-logo-img');
        if (logoEl) logoEl.src = url;
      }
    });
  } catch (e) {
    // No site images configured yet, keep defaults
  }
}

// ── Carga de Revistas desde API ──
async function loadRevistas() {
  const container = document.getElementById('revistas-container');
  if (!container) return;
  const mode = container.dataset.mode || 'preview';
  try {
    let revistas = [];
    try {
      const res = await fetch(`${API_BASE_URL}/revistas`);
      if (res.ok) {
        revistas = await res.json();
        console.log('✅ Revistas cargadas desde API');
      } else { throw new Error('API not available'); }
    } catch (apiErr) {
      console.warn('⚠️ API revistas no disponible, cargando JSON local');
      try {
        const res = await fetch('data/revistas.json');
        revistas = await res.json();
      } catch (e) { revistas = []; }
    }

    if (!revistas.length) {
      container.innerHTML = '<p class="loading-text">Próximamente: primera edición de la revista IEEE UNMSM.</p>';
      return;
    }

    const items = (mode === 'full') ? revistas : revistas.slice(0, 3);
    container.innerHTML = items.map(r => createRevistaCard(r)).join('');
    animateCards(container.querySelectorAll('.revista-card'));
  } catch (err) {
    console.warn('Error cargando revistas:', err);
  }
}

function createRevistaCard(r) {
  const titulo = escapeHTML(r.titulo);
  const descripcion = escapeHTML(r.descripcion || '');
  const edicion = escapeHTML(String(r.edicion || ''));
  const fecha = safeParseDate(r.fecha).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  const portadaUrl = resolveImageUrl(r.portada_path || r.portada);
  const pdfUrl = r.pdf_path ? resolveImageUrl(r.pdf_path) : (r.pdf_link || '#');

  return `
  <div class="revista-card">
    <div class="revista-portada">
      ${portadaUrl
        ? `<img src="${escapeAttribute(portadaUrl)}" alt="${titulo}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : ''}
      <div class="revista-portada-placeholder" ${portadaUrl ? 'style="display:none"' : ''}>
        <span>📰</span>
        <span>Ed. ${edicion}</span>
      </div>
    </div>
    <div class="revista-body">
      <span class="revista-edicion">Edición ${edicion}</span>
      <h3 class="revista-titulo">${titulo}</h3>
      <p class="revista-fecha">📅 ${fecha}</p>
      ${descripcion ? `<p class="revista-desc">${descripcion}</p>` : ''}
      <a href="${escapeAttribute(pdfUrl)}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">📄 Leer revista</a>
    </div>
  </div>`;
}

function createCapituloCard(cap) {
  const id = escapeHTML(cap.id);
  const color = sanitizeColor(cap.color);
  const siglas = escapeHTML(cap.siglas);
  const nombre = escapeHTML(cap.nombre);
  const descripcion = escapeHTML(cap.descripcion);
  const icono = escapeHTML(cap.icono);
  const link = escapeAttribute(cap.link || '#');

  return `
  <div class="capitulo-card" data-cap="${id}">
    <div class="cap-img-wrapper" style="border-top: 3px solid ${color}">
      <div class="cap-placeholder" style="background: linear-gradient(135deg, rgba(0,20,45,0.9), ${color}18)">
        <span class="cap-icon">${icono}</span>
        <span class="cap-placeholder-text">Agregar imagen en images/capitulos/${id}.jpg</span>
      </div>
      <span class="cap-siglas-badge" style="border-color:${color};color:${color}">${siglas}</span>
    </div>
    <div class="cap-body">
      <h3 class="cap-nombre">${nombre}</h3>
      <p class="cap-desc">${descripcion}</p>
      <a href="${link}" class="cap-link">
        Más información <span>→</span>
      </a>
    </div>
  </div>`;
}

// ── Carga de Noticias desde API ──
async function loadNoticias() {
  const container = document.getElementById('noticias-container');
  if (!container) return;
  const mode = container.dataset.mode || 'preview';
  try {
    // Intentar cargar desde API primero
    let noticias = [];
    try {
      const apiUrl = `${API_BASE_URL}/contenido?tipo=noticia&estado=aprobado`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        noticias = await res.json();
        console.log('✅ Noticias cargadas desde API');
      } else {
        throw new Error('API not available');
      }
    } catch (apiErr) {
      console.warn('⚠️ API no disponible, cargando desde JSON local');
      const res = await fetch('data/noticias.json');
      noticias = await res.json();
    }

    // Convertir datos de API al formato esperado si es necesario
    noticias = noticias.map(n => ({
      id: n.id || Math.random(),
      titulo: n.titulo,
      fecha: n.created_at || n.fecha,
      categoria: n.categoria || 'noticia',
      descripcion: n.descripcion,
      imagen: n.imagen_path || 'placeholder.jpg',
      link: n.link || '#',
      destacado: false
    }));

    // Orden por fecha descendente
    noticias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const render = (list) => {
      if (!list.length) {
        container.innerHTML = '<p class="no-results">No hay noticias para esta categoría.</p>';
        return;
      }
      const destacada = list.find(n => n.destacado) || list[0];
      const resto = list.filter(n => n.id !== destacada?.id);
      let html = '';
      if (destacada) html += createNoticiaCard(destacada, true);
      resto.forEach(n => { html += createNoticiaCard(n, false); });
      container.innerHTML = html;
      animateCards(container.querySelectorAll('.noticia-card'));
    };

    if (mode === 'full') {
      container.classList.add('full');
      render(noticias);
      initNoticiasFilters(noticias, render);
    } else {
      const previewLimit = Math.min(4, noticias.length);
      render(noticias.slice(0, previewLimit));
    }
  } catch (err) {
    console.warn('Error cargando noticias:', err);
  }
}

function initNoticiasFilters(noticias, render) {
  const chips = document.querySelectorAll('[data-noticias-filter] .chip');
  if (!chips.length) return;
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const cat = chip.dataset.cat;
      const list = (cat === 'all') ? noticias : noticias.filter(n => n.categoria === cat);
      render(list);
    });
  });
}

// ── Carga de Proyectos desde API ──
async function loadProyectos() {
  const container = document.getElementById('proyectos-container');
  if (!container) return;
  const mode = container.dataset.mode || 'preview';
  try {
    // Intentar cargar desde API primero
    let proyectos = [];
    try {
      const apiUrl = `${API_BASE_URL}/contenido?tipo=proyecto&estado=aprobado`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        proyectos = await res.json();
        console.log('✅ Proyectos cargados desde API');
      } else {
        throw new Error('API not available');
      }
    } catch (apiErr) {
      console.warn('⚠️ API de proyectos no disponible. Mostrando mensaje vacío.');
      proyectos = [];
    }

    // Convertir datos de API al formato esperado
    proyectos = proyectos.map(p => ({
      id: p.id || Math.random(),
      titulo: p.titulo,
      fecha: p.created_at || p.fecha,
      descripcion: p.descripcion,
      imagen: p.imagen_path || p.imagen || null,
      link: p.link || '#',
      capitulo: p.capitulo || 'General'
    }));

    // Orden por fecha descendente
    proyectos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const render = (list) => {
      if (!list.length) {
        container.innerHTML = '<p class="no-results">No hay proyectos publicados aún. ¡Pronto habrá contenido aquí!</p>';
        return;
      }
      container.innerHTML = list.map(p => createProyectoCard(p)).join('');
      animateCards(container.querySelectorAll('.proyecto-card'));
    };

    if (mode === 'full') {
      container.classList.add('full');
      render(proyectos);
    } else {
      const previewLimit = Math.min(3, proyectos.length);
      render(proyectos.slice(0, previewLimit));
    }
  } catch (err) {
    console.warn('Error cargando proyectos:', err);
  }
}

function createProyectoCard(p) {
  const fecha = safeParseDate(p.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  const titulo = escapeHTML(p.titulo);
  const descripcion = escapeHTML(p.descripcion);
  const capitulo = escapeHTML(p.capitulo);
  const link = escapeAttribute(p.link || '#');
  const imgUrl = resolveImageUrl(p.imagen);

  return `
  <div class="proyecto-card">
    <div class="proyecto-img">
      ${imgUrl ? `<img src="${escapeAttribute(imgUrl)}" alt="${titulo}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
      <div class="img-placeholder" ${imgUrl ? 'class="img-placeholder img-placeholder-hidden"' : 'class="img-placeholder"'}>
        <span class="img-icon">🚀</span>
        <span class="img-text">Proyecto: ${titulo}</span>
      </div>
    </div>
    <div class="proyecto-body">
      <div class="proyecto-meta">
        <span class="proyecto-capitulo">🏷️ ${capitulo}</span>
        <span class="proyecto-fecha">📅 ${fecha}</span>
      </div>
      <h3 class="proyecto-titulo">${titulo}</h3>
      <p class="proyecto-desc">${descripcion}</p>
      <a href="${link}" class="proyecto-link">Más información <span>→</span></a>
    </div>
  </div>`;
}

function createNoticiaCard(n, destacada) {
  const fecha = safeParseDate(n.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  const catColors = { convocatoria: '#0099d6', evento: '#4ade80', charla: '#f0b429', programa: '#e91e8c', actividad: '#a78bfa' };
  const color = catColors[n.categoria] || '#0099d6';
  const categoria = escapeHTML(n.categoria);
  const titulo = escapeHTML(n.titulo);
  const descripcion = escapeHTML(n.descripcion);
  const link = escapeAttribute(n.link || '#');
  const imgUrl = resolveImageUrl(n.imagen);

  return `
  <div class="noticia-card${destacada ? ' destacada' : ''}">
    <div class="noticia-img">
      ${imgUrl ? `<img src="${escapeAttribute(imgUrl)}" alt="${titulo}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
      <div class="img-placeholder" ${imgUrl ? 'class="img-placeholder img-placeholder-hidden"' : 'class="img-placeholder"'}>
        <span class="img-icon">🖼️</span>
        <span class="img-text">${titulo}</span>
      </div>
    </div>
    <div class="noticia-body">
      <div class="noticia-meta">
        <span class="noticia-cat" style="background:${color}22;color:${color};border:1px solid ${color}44">${categoria}</span>
        <span class="noticia-fecha">📅 ${fecha}</span>
      </div>
      <h3 class="noticia-titulo">${titulo}</h3>
      <p class="noticia-desc">${descripcion}</p>
      <a href="${link}" class="noticia-link">Leer más <span>→</span></a>
    </div>
  </div>`;
}

// (duplicado eliminado – initNoticiasFilters ya está definida arriba)

// ── Carga de Concursos desde API ──
async function loadConcursos() {
  const container = document.getElementById('concursos-container');
  if (!container) return;
  const mode = container.dataset.mode || 'preview';
  try {
    // Intentar cargar desde API primero (tipo=evento)
    let concursos = [];
    try {
      const apiUrl = `${API_BASE_URL}/contenido?tipo=evento&estado=aprobado`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        concursos = await res.json();
        console.log('✅ Eventos/Concursos cargados desde API');
      } else {
        throw new Error('API not available');
      }
    } catch (apiErr) {
      console.warn('⚠️ API no disponible, cargando desde JSON local');
      const res = await fetch('data/concursos.json');
      concursos = await res.json();
    }

    // Convertir datos de API al formato esperado si es necesario
    concursos = concursos.map(c => ({
      id: c.id || Math.random(),
      titulo: c.titulo,
      fechaLimite: c.fecha_evento || c.fechaLimite,
      descripcion: c.descripcion,
      requisitos: c.requisitos || '',
      imagen: c.imagen_path || c.imagen || null,
      link: c.link || '#',
      bases: c.bases || '#',
      capitulo: c.capitulo || 'Rama General',
      convocatoria: c.estado === 'aprobado' ? 'Abierta' : 'Próximamente'
    }));

    const render = (list) => {
      if (!list.length) {
        container.innerHTML = '<p class="no-results">No hay convocatorias en este estado.</p>';
        return;
      }
      container.innerHTML = list.map(c => createConcursoCard(c, mode === 'full')).join('');
      animateCards(container.querySelectorAll('.concurso-card'));
    };

    if (mode === 'full') {
      container.classList.add('full');
      render(concursos);
      initConcursosFilters(concursos, render);
    } else {
      render(concursos);
    }
  } catch (err) {
    console.warn('Error cargando concursos:', err);
  }
}

function initConcursosFilters(concursos, render) {
  const chips = document.querySelectorAll('[data-concursos-filter] .chip');
  if (!chips.length) return;
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const estado = chip.dataset.estado;
      const list = (estado === 'all') ? concursos : concursos.filter(c => c.convocatoria === estado);
      render(list);
    });
  });
}

function createConcursoCard(c, full = false) {
  const isAbierta = c.convocatoria === 'Abierta';
  const badgeClass = isAbierta ? 'badge-abierta' : 'badge-proximo';
  const fechaStr = safeParseDate(c.fechaLimite).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  const titulo = escapeHTML(c.titulo);
  const convocatoria = escapeHTML(c.convocatoria);
  const descripcion = escapeHTML(c.descripcion);
  const requisitosText = escapeHTML(c.requisitos);
  const capitulo = escapeHTML(c.capitulo || 'Rama General');
  const link = escapeAttribute(c.link || '#');
  const bases = escapeAttribute(c.bases || '#');
  const imgUrl = resolveImageUrl(c.imagen);
  const imgSection = imgUrl ? `
    <div class="concurso-img">
      <img src="${escapeAttribute(imgUrl)}" alt="${titulo}" onerror="this.parentElement.style.display='none'">
    </div>` : '';
  const meta = full ? `
    <div class="concurso-meta-row">
      <span>🏷️ ${capitulo}</span>
    </div>` : '';
  const requisitos = full && c.requisitos ? `
    <div class="concurso-requisitos"><strong>Requisitos:</strong> ${requisitosText}</div>` : '';
  return `
  <div class="concurso-card${full ? ' full' : ''}">
    ${imgSection}
    <div class="concurso-header">
      <h3 class="concurso-titulo">${titulo}</h3>
      <span class="concurso-badge ${badgeClass}">${convocatoria}</span>
    </div>
    ${meta}
    <p class="concurso-desc">${descripcion}</p>
    ${requisitos}
    <div class="concurso-fecha">⏰ Fecha límite: ${fechaStr}</div>
    <div class="concurso-actions">
      <a href="${link}" class="btn btn-primary btn-sm">Participar</a>
      <a href="${bases}" class="btn btn-outline btn-sm">Ver bases</a>
    </div>
  </div>`;
}

// ── Galería (carga dinámica desde API + fallback) ──
async function initGaleria() {
  const container = document.getElementById('galeria-container');
  if (!container) return;
  const mode = container.dataset.mode || 'preview';
  if (mode === 'full') container.classList.add('full');

  let fotos = [];
  try {
    const res = await fetch(`${API_BASE_URL}/galeria`);
    if (res.ok) {
      fotos = await res.json();
      console.log('✅ Galería cargada desde API');
    }
  } catch (e) {
    console.warn('⚠️ API galería no disponible');
  }

  if (!fotos.length) {
    container.innerHTML = '<p class="loading-text">Aún no hay fotos en la galería. ¡Subía las primeras desde el panel admin!</p>';
    return;
  }

  const items = (mode === 'full') ? fotos : fotos.slice(0, 8);
  container.innerHTML = items.map((foto, i) => {
    const imgUrl = resolveImageUrl(foto.path);
    const label = escapeHTML(foto.evento || foto.capitulo || 'Foto IEEE');
    return `
    <div class="galeria-item${i === 0 ? ' large' : ''}" data-idx="${i}" data-label="${escapeAttribute(label)}" data-src="${escapeAttribute(imgUrl || '')}">
      ${imgUrl ? `<img src="${escapeAttribute(imgUrl)}" alt="${label}" loading="lazy">` : '<span class="galeria-icon">🖼️</span>'}
      <span class="galeria-overlay">${label}</span>
    </div>`;
  }).join('');
  animateCards(container.querySelectorAll('.galeria-item'));
}

// ── Animaciones de entrada ──
// Las secciones que ya estén en el viewport al cargar se muestran de
// inmediato (sin fade) para evitar parpadeo o "secciones invisibles".
// Las que están abajo se observan y aparecen al hacer scroll.
// Safety fallback: si por cualquier razón el observer no dispara,
// a los 1500ms forzamos visibilidad de cualquier sección oculta.
function initScrollAnimations() {
  const sections = document.querySelectorAll('section');
  if (!sections.length) return;

  const reveal = (el) => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

  sections.forEach(sec => {
    sec.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    const rect = sec.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView) {
      // Ya visible al cargar: mostrar inmediatamente, sin fade.
      reveal(sec);
    } else {
      sec.style.opacity = '0';
      sec.style.transform = 'translateY(30px)';
      observer.observe(sec);
    }
  });

  // Safety: si algo bloquea al observer, forzar visibilidad a 1.5s.
  setTimeout(() => {
    sections.forEach(sec => {
      if (getComputedStyle(sec).opacity === '0') reveal(sec);
    });
  }, 1500);
}

function animateCards(cards) {
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `opacity 0.5s ease ${i * 0.05}s, transform 0.5s ease ${i * 0.05}s`;
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 50 + i * 50);
  });
}

// ════════════════════════════════════════════════════════
//  LIGHTBOX (galería ampliada) – solo se activa si existe el contenedor
// ════════════════════════════════════════════════════════
function initLightbox() {
  const galeria = document.getElementById('galeria-container');
  const lightbox = document.getElementById('lightbox');
  if (!galeria || !lightbox) return;

  const imgWrap  = lightbox.querySelector('.lightbox-img');
  const caption  = lightbox.querySelector('.lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  galeria.addEventListener('click', e => {
    const item = e.target.closest('.galeria-item');
    if (!item) return;
    const label = item.dataset.label || 'Foto IEEE';
    const src = item.dataset.src;
    if (src) {
      imgWrap.innerHTML = `<img src="${escapeAttribute(src)}" alt="${escapeHTML(label)}">`;
    } else {
      imgWrap.innerHTML = `<span class="galeria-placeholder-icon">🖼️</span><p class="galeria-placeholder-text">Imagen aún no agregada</p>`;
    }
    caption.textContent = label;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  const close = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  };
  closeBtn?.addEventListener('click', close);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

// ════════════════════════════════════════════════════════
//  FORMULARIO DE CONTACTO
//  Si el atributo `action` apunta a Formspree (formspree.io/f/XXXX)
//  el formulario se envía vía fetch sin recargar la página.
//  Si action === '#' o vacío, queda como demo (muestra mensaje).
// ════════════════════════════════════════════════════════
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = form.querySelector('.form-status');
  const action = form.getAttribute('action') || '';
  const isReal = action.includes('formspree.io');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isReal) {
      showStatus(status, 'success',
        'Mensaje recibido (modo demo). Para activar el envío real, configura Formspree en el atributo action del formulario.');
      form.reset();
      return;
    }
    try {
      const data = new FormData(form);
      const res = await fetch(action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        showStatus(status, 'success', '¡Mensaje enviado! Te responderemos pronto.');
        form.reset();
      } else {
        showStatus(status, 'error', 'Hubo un problema al enviar. Intenta nuevamente.');
      }
    } catch (err) {
      showStatus(status, 'error', 'Error de conexión. Revisa tu internet o intenta más tarde.');
    }
  });
}

function showStatus(el, type, msg) {
  if (!el) return;
  el.className = `form-status ${type}`;
  el.textContent = msg;
}

// ════════════════════════════════════════════════════════
//  FAQ ACCORDION
// ════════════════════════════════════════════════════════
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-question');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });
}
