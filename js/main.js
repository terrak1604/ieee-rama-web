/**
 * IEEE Rama General UNMSM - JavaScript Principal
 * Carga dinámica de datos JSON, partículas avanzadas, animaciones y navegación
 */

const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api';
const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
const IEEE_FALLBACK_IMAGE = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 675%22%3E%3Crect width=%221200%22 height=%22675%22 fill=%22%2300629B%22/%3E%3Ctext x=%22600%22 y=%22320%22 text-anchor=%22middle%22 font-family=%22Arial%2C sans-serif%22 font-size=%22116%22 font-weight=%22700%22 fill=%22white%22%3EIEEE%3C/text%3E%3Ctext x=%22600%22 y=%22405%22 text-anchor=%22middle%22 font-family=%22Arial%2C sans-serif%22 font-size=%2238%22 fill=%22white%22%3ERama Estudiantil UNMSM%3C/text%3E%3C/svg%3E';

// ════════════════════════════════════════════════════════
//  UI HELPERS
// ════════════════════════════════════════════════════════
function renderEmptyState(container, text, icon = '<i class="ph-fill ph-folder-open"></i>') {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <p class="empty-state-text">${text}</p>
    </div>
  `;
}

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
  loadCapituloDetalle();
  loadContenidoDetalle();
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

  if (navLinks && !document.querySelector('.nav-search')) {
    // Insertar link Calendario antes de Contacto
    const contactoLi = Array.from(navLinks.children).find(li => li.textContent.trim().includes('Contacto'));
    if (contactoLi) {
      const calLi = document.createElement('li');
      calLi.innerHTML = '<a href="calendario.html">Calendario</a>';
      navLinks.insertBefore(calLi, contactoLi);
    }

    // Insertar barra de búsqueda al final
    const searchLi = document.createElement('li');
    searchLi.classList.add('nav-search');
    searchLi.innerHTML = `
      <form action="resultados.html" method="GET" class="search-form">
        <input type="text" name="q" placeholder="Buscar..." aria-label="Buscar" required>
        <button type="submit" aria-label="Botón buscar">🔍</button>
      </form>
    `;
    navLinks.appendChild(searchLi);
  }

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
async function loadCapitulos() {
  const container = document.getElementById('capitulos-container');
  if (!container) return;
  const mode  = container.dataset.mode  || 'preview';
  const limit = parseInt(container.dataset.limit || '6', 10);
  renderSkeletonCards(container, mode === 'full' ? 8 : limit);
  try {
    const res = await fetch(`${API_BASE_URL}/capitulos`);
    if (!res.ok) throw new Error('API not available');
    const capitulos = await res.json();
    const render = (list) => {
      if (!list.length) {
        renderEmptyState(container, 'No se encontraron capítulos con ese criterio.', '<i class="ph-fill ph-magnifying-glass"></i>');
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
    renderEmptyState(container, 'Error cargando capítulos desde el servidor.', '<i class="ph-fill ph-warning-circle"></i>');
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

function renderSkeletonCards(container, count = 3) {
  if (!container) return;
  container.innerHTML = Array.from({ length: count }, () => `
    <div class="content-skeleton-card">
      <div class="content-skeleton-media"></div>
      <div class="content-skeleton-line wide"></div>
      <div class="content-skeleton-line"></div>
      <div class="content-skeleton-line short"></div>
    </div>
  `).join('');
}

function contentDetailLink(item, fallback = '#') {
  return item.slug ? `contenido-detalle.html?slug=${encodeURIComponent(item.slug)}` : (item.link || fallback);
}

function chapterDetailLink(item) {
  const slug = item.slug || item.id;
  return slug ? `capitulo-detalle.html?slug=${encodeURIComponent(slug)}` : (item.link || '#');
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
          wrapper.innerHTML = `<img src="${escapeAttribute(url)}" alt="${escapeHTML(img.alt_text || 'IEEE UNMSM')}" class="hero-real-img" onerror="this.src='${IEEE_FALLBACK_IMAGE}'">`;
        }
      }
      if (img.clave === 'logo') {
        const logoEl = document.querySelector('.nav-logo-img');
        if (logoEl) {
          logoEl.src = url;
          logoEl.onerror = () => { logoEl.src = IEEE_FALLBACK_IMAGE; };
        }
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
  renderSkeletonCards(container, mode === 'full' ? 6 : 3);
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
      renderEmptyState(container, 'Próximamente: primera edición de la revista IEEE UNMSM.', '<i class="ph-fill ph-newspaper"></i>');
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
        ? `<img src="${escapeAttribute(portadaUrl)}" alt="${titulo}" onerror="this.src='${IEEE_FALLBACK_IMAGE}'">`
        : ''}
      <div class="revista-portada-placeholder" ${portadaUrl ? 'style="display:none"' : ''}>
        <span><i class="ph-fill ph-book-open-text"></i></span>
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
  const id = escapeHTML(cap.id || cap.slug);
  const color = sanitizeColor(cap.color);
  const siglas = escapeHTML(cap.siglas);
  const nombre = escapeHTML(cap.nombre);
  const descripcion = escapeHTML(cap.descripcion || cap.descripcion_corta);
  const icono = escapeHTML(cap.icono || cap.siglas || 'IEEE');
  const link = escapeAttribute(chapterDetailLink(cap));

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
// ── Carga de Noticias desde API ──
async function loadNoticias() {
  const container = document.getElementById('noticias-container');
  if (!container) return;
  const mode = container.dataset.mode || 'preview';
  renderSkeletonCards(container, mode === 'full' ? 6 : 3);
  try {
    let noticias = [];
    const apiUrl = `${API_BASE_URL}/contenido?tipo=noticia&estado=aprobado`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('API not available');
    
    noticias = await res.json();
    console.log('✅ Noticias cargadas desde API');

    // Convertir datos de API al formato esperado si es necesario
    noticias = noticias.map(n => ({
      id: n.id || Math.random(),
      slug: n.slug,
      titulo: n.titulo,
      fecha: n.created_at || n.fecha,
      categoria: n.categoria || 'noticia',
      descripcion: n.descripcion || n.extracto,
      imagen: n.imagen_path || 'placeholder.jpg',
      link: contentDetailLink(n),
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
    container.innerHTML = '<p class="loading-text">No hay noticias disponibles en este momento.</p>';
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
  renderSkeletonCards(container, mode === 'full' ? 6 : 3);
  try {
    let proyectos = [];
    const apiUrl = `${API_BASE_URL}/contenido?tipo=proyecto&estado=aprobado`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('API not available');
    
    proyectos = await res.json();
    console.log('✅ Proyectos cargados desde API');

    // Convertir datos de API al formato esperado
    proyectos = proyectos.map(p => ({
      id: p.id || Math.random(),
      slug: p.slug,
      titulo: p.titulo,
      fecha: p.created_at || p.fecha,
      descripcion: p.descripcion || p.extracto,
      imagen: p.imagen_path || p.imagen || null,
      link: contentDetailLink(p),
      capitulo: p.capitulo || 'General'
    }));

    // Orden por fecha descendente
    proyectos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const render = (list) => {
      // Si la lista está vacía de la BD, mostramos los proyectos de demostración automáticamente para testing
      if (!list.length) {
        throw new Error('No hay proyectos en la BD, forzando carga de demostración');
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
    console.warn('Error cargando proyectos o usando entorno local. Cargando proyectos de demostración:', err);
    // Fallback con proyectos de demostración para visualización
    const demoProyectos = [
      {
        id: 1,
        titulo: "Rover de Exploración Marciana Autónoma",
        fecha: "2026-05-01",
        descripcion: "Diseño y desarrollo de un rover autónomo con visión artificial y algoritmos de machine learning para mapeo de terrenos simulados en entornos hostiles. Ganador del premio nacional de robótica IEEE.",
        capitulo: "IEEE RAS",
        imagen: "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?auto=format&fit=crop&q=80&w=1600",
        link: "#"
      },
      {
        id: 2,
        titulo: "Prótesis Bio-Biónica Controlada por EEG",
        fecha: "2026-04-15",
        descripcion: "Brazo robótico impreso en 3D que responde a señales electroencefalográficas (EEG) en tiempo real, permitiendo a personas amputadas recuperar motricidad fina con un coste reducido al 10%.",
        capitulo: "IEEE EMBS",
        imagen: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1600",
        link: "#"
      },
      {
        id: 3,
        titulo: "Smart Grid: Red Eléctrica Descentralizada",
        fecha: "2026-03-22",
        descripcion: "Sistema de gestión de energía basado en IoT y micro-controladores para comunidades rurales aisladas. Permite balancear cargas de paneles solares entre múltiples hogares automáticamente.",
        capitulo: "IEEE PES",
        imagen: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=1600",
        link: "#"
      },
      {
        id: 4,
        titulo: "Red de Sensores para Agricultura de Precisión",
        fecha: "2026-02-10",
        descripcion: "Módulos de comunicación LoRaWAN que monitorean la humedad, temperatura y pH del suelo. Los datos se envían a una plataforma web que predice y optimiza los ciclos de riego mediante IA.",
        capitulo: "IEEE ComSoc",
        imagen: "https://images.unsplash.com/photo-1586771107445-d3af9e11fb98?auto=format&fit=crop&q=80&w=1600",
        link: "#"
      },
      {
        id: 5,
        titulo: "Framework Ciber-Defensivo Basado en IA",
        fecha: "2026-01-05",
        descripcion: "Plataforma de código abierto capaz de detectar intrusiones en redes institucionales usando aprendizaje profundo y neutralizar ataques DDoS en menos de 5 segundos.",
        capitulo: "IEEE CS",
        imagen: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1600",
        link: "#"
      }
    ];

    const render = (list) => {
      container.innerHTML = list.map(p => createProyectoCard(p)).join('');
      animateCards(container.querySelectorAll('.proyecto-card'));
    };

    if (mode === 'full') {
      container.classList.add('full');
      render(demoProyectos);
    } else {
      render(demoProyectos.slice(0, 3));
    }
  }
}

// ── Motor Virtual Scroll "Obys Style" ──
function initHorizontalScroll() {
  const container = document.getElementById('proyectos-container');
  if (!container) return;
  
  let targetScroll = 0;
  let currentScroll = 0;
  const ease = 0.07; // Coeficiente de fricción/suavidad
  let maxScroll = 0;
  
  function updateLimits() {
    // max-content hace que clientWidth contenga todo el ancho de las tarjetas
    // El límite es el ancho total menos la pantalla, más un pequeño margen
    maxScroll = Math.max(0, container.clientWidth - window.innerWidth + (window.innerWidth * 0.1));
  }
  
  // Inicializar y recalcular si cambia el tamaño de pantalla
  setTimeout(updateLimits, 500); // Dar tiempo a que las imágenes carguen
  window.addEventListener('resize', updateLimits);

  // Secuestrar la rueda del ratón
  container.parentElement.addEventListener('wheel', (evt) => {
    if (maxScroll <= 0) return;
    evt.preventDefault();
    targetScroll += evt.deltaY * 1.5;
    targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));
  }, { passive: false });

  // Soporte para dispositivos táctiles (Mobile Touch)
  let touchStartX = 0;
  let scrollStartX = 0;

  container.parentElement.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    scrollStartX = targetScroll;
  }, { passive: true });

  container.parentElement.addEventListener('touchmove', (e) => {
    if (maxScroll <= 0) return;
    const touchCurrentX = e.touches[0].clientX;
    const touchDeltaX = touchStartX - touchCurrentX;
    
    // Multiplicamos por un factor para que el arrastre sea natural
    targetScroll = scrollStartX + touchDeltaX * 2;
    targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));
    
    // Evitar scroll vertical nativo mientras se arrastra la galería
    if (Math.abs(touchDeltaX) > 10) {
       if (e.cancelable) e.preventDefault();
    }
  }, { passive: false });
  
  // Loop de Renderizado (60 FPS)
  function renderScroll() {
    // Interpolación Lineal (Lerping)
    currentScroll += (targetScroll - currentScroll) * ease;
    
    // Calcular "velocidad" basada en la distancia entre el target y la posición actual
    let speed = targetScroll - currentScroll;
    
    // Física 1: Skew (Inclinación por resistencia al viento)
    let skew = speed * 0.015;
    skew = Math.max(-12, Math.min(skew, 12)); // Limitar a max 12 grados
    
    // Física 2: Scale (Pequeño zoom out al moverse rápido)
    let scale = 1 - Math.min(Math.abs(speed) * 0.0004, 0.04);
    
    // Mover la cámara (el contenedor completo)
    container.style.transform = `translate3d(${-currentScroll}px, 0, 0)`;
    
    // Aplicar físicas a cada tarjeta individualmente
    const cards = container.querySelectorAll('.proyecto-card');
    cards.forEach(card => {
      // Aplicamos inclinación horizontal y escalado
      card.style.transform = `skewX(${skew}deg) scale(${scale})`;
    });
    
    requestAnimationFrame(renderScroll);
  }
  
  // Iniciar motor
  requestAnimationFrame(renderScroll);
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
      ${imgUrl ? `<img src="${escapeAttribute(imgUrl)}" alt="${titulo}" onerror="this.src='${IEEE_FALLBACK_IMAGE}'">` : ''}
      <div class="img-placeholder" ${imgUrl ? 'class="img-placeholder img-placeholder-hidden"' : 'class="img-placeholder"'}>
        <span class="img-icon"><i class="ph-fill ph-rocket-launch"></i></span>
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
      ${imgUrl ? `<img src="${escapeAttribute(imgUrl)}" alt="${titulo}" onerror="this.src='${IEEE_FALLBACK_IMAGE}'">` : ''}
      <div class="img-placeholder" ${imgUrl ? 'class="img-placeholder img-placeholder-hidden"' : 'class="img-placeholder"'}>
        <span class="img-icon"><i class="ph-fill ph-image"></i></span>
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
  renderSkeletonCards(container, mode === 'full' ? 6 : 3);
  try {
    let concursos = [];
    const apiUrl = `${API_BASE_URL}/contenido?tipo=evento&estado=aprobado`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('API not available');
    
    concursos = await res.json();
    console.log('✅ Eventos/Concursos cargados desde API');

    // Convertir datos de API al formato esperado
    concursos = concursos.map(c => ({
      id: c.id || Math.random(),
      slug: c.slug,
      titulo: c.titulo,
      fechaLimite: c.fecha_evento || c.created_at,
      descripcion: c.descripcion || c.extracto,
      requisitos: '',
      imagen: c.imagen_path || null,
      link: contentDetailLink(c),
      bases: '#',
      capitulo: c.capitulo || 'Rama General',
      convocatoria: c.fecha_evento ? 'Próximo' : 'Abierta'
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
    container.innerHTML = '<p class="loading-text">No hay eventos disponibles en este momento.</p>';
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
      <img src="${escapeAttribute(imgUrl)}" alt="${titulo}" onerror="this.src='${IEEE_FALLBACK_IMAGE}'">
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
      <a href="${link}" class="btn btn-primary btn-sm">Leer más</a>
      <a href="${bases}" class="btn btn-outline btn-sm">Ver bases</a>
    </div>
  </div>`;
}

async function loadCapituloDetalle() {
  const root = document.getElementById('capitulo-detail-root');
  if (!root) return;

  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) {
    root.innerHTML = '<section><div class="container"><p class="no-results">No se indicó un capítulo.</p></div></section>';
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/capitulos/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('Capitulo not found');
    const capitulo = await res.json();
    const color = sanitizeColor(capitulo.color, '#00629B');
    const portada = resolveImageUrl(capitulo.imagen_portada_path) || IEEE_FALLBACK_IMAGE;
    const logo = resolveImageUrl(capitulo.logo_path) || IEEE_FALLBACK_IMAGE;
    const contenidos = capitulo.contenidos || [];
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const canEdit = user && (user.rol === 'director_rama' || (user.rol === 'director_capitulo' && user.capitulo === capitulo.slug));

    const grouped = {
      noticia: contenidos.filter(item => item.tipo === 'noticia'),
      proyecto: contenidos.filter(item => item.tipo === 'proyecto'),
      evento: contenidos.filter(item => item.tipo === 'evento'),
    };

    root.innerHTML = `
      <header class="chapter-hero" style="--chapter-color:${color};background-image:linear-gradient(90deg, rgba(0,20,45,.92), rgba(0,40,85,.72)), url('${escapeAttribute(portada)}')">
        <div class="container chapter-hero-inner">
          <img src="${escapeAttribute(logo)}" alt="${escapeHTML(capitulo.nombre)}" class="chapter-logo" onerror="this.src='${IEEE_FALLBACK_IMAGE}'">
          <div>
            <nav class="breadcrumb" aria-label="Ruta de navegación">
              <a href="index.html">Inicio</a><span class="sep">›</span><a href="capitulos.html">Capítulos</a><span class="sep">›</span><span>${escapeHTML(capitulo.siglas)}</span>
            </nav>
            <h1 class="page-title">${escapeHTML(capitulo.nombre)}</h1>
            <p class="page-subtitle">${escapeHTML(capitulo.descripcion_larga || capitulo.descripcion_corta || '')}</p>
            ${canEdit ? '<a class="btn btn-primary btn-sm" href="admin/dashboard.html">Editar Capítulo</a>' : ''}
          </div>
        </div>
      </header>
      <section>
        <div class="container detail-layout">
          <article class="detail-main">
            <div class="tabs" data-tabs>
              <button class="chip active" data-tab="noticia">Noticias</button>
              <button class="chip" data-tab="proyecto">Proyectos</button>
              <button class="chip" data-tab="evento">Eventos</button>
            </div>
            <div id="chapter-tab-content"></div>
          </article>
          <aside class="detail-sidebar">
            <h2>Directiva</h2>
            <p>${escapeHTML(capitulo.director_id ? `Director ID ${capitulo.director_id}` : 'Directiva por actualizar')}</p>
            <h2>Misión</h2>
            <p>${escapeHTML(capitulo.mision || 'Información por actualizar.')}</p>
            <h2>Visión</h2>
            <p>${escapeHTML(capitulo.vision || 'Información por actualizar.')}</p>
          </aside>
        </div>
      </section>`;

    const tabContent = document.getElementById('chapter-tab-content');
    const renderTab = (type) => {
      const items = grouped[type] || [];
      tabContent.innerHTML = items.length
        ? `<div class="noticias-grid full">${items.map(item => createNoticiaCard({
            ...item,
            fecha: item.publicado_at || item.created_at,
            categoria: item.tipo,
            imagen: item.imagen_path,
            link: contentDetailLink(item),
          }, false)).join('')}</div>`
        : '<p class="no-results">No hay contenido publicado en esta sección.</p>';
    };

    root.querySelectorAll('[data-tab]').forEach(button => {
      button.addEventListener('click', () => {
        root.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        renderTab(button.dataset.tab);
      });
    });
    renderTab('noticia');
  } catch (err) {
    root.innerHTML = '<section><div class="container"><p class="no-results">No se pudo cargar el capítulo.</p></div></section>';
  }
}

async function loadContenidoDetalle() {
  const root = document.getElementById('contenido-detail-root');
  if (!root) return;

  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) {
    root.innerHTML = '<section><div class="container"><p class="no-results">No se indicó un contenido.</p></div></section>';
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/contenido/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('Contenido not found');
    const item = await res.json();
    const fecha = safeParseDate(item.fecha_evento || item.publicado_at || item.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
    const hero = resolveImageUrl(item.imagen_path) || IEEE_FALLBACK_IMAGE;
    const archivos = item.archivos || [];
    const imagenes = archivos.filter(file => file.tipo === 'imagen');
    const documentos = archivos.filter(file => file.tipo === 'documento');

    root.innerHTML = `
      <header class="page-header article-header">
        <div class="container">
          <nav class="breadcrumb" aria-label="Ruta de navegación">
            <a href="index.html">Inicio</a><span class="sep">›</span><span>${escapeHTML(item.tipo)}</span>
          </nav>
          <div class="article-tags">
            <span>${escapeHTML(item.tipo)}</span>
            <span>${escapeHTML(item.capitulo || 'Rama IEEE')}</span>
            <span>${fecha}</span>
          </div>
          <h1 class="page-title">${escapeHTML(item.titulo)}</h1>
          <p class="page-subtitle">${escapeHTML(item.extracto || item.descripcion || '')}</p>
        </div>
      </header>
      <section>
        <div class="container article-layout">
          <article class="article-content">
            <img src="${escapeAttribute(hero)}" alt="${escapeHTML(item.titulo)}" class="article-featured" onerror="this.src='${IEEE_FALLBACK_IMAGE}'">
            <div class="article-body">${item.cuerpo || `<p>${escapeHTML(item.descripcion || '')}</p>`}</div>
            ${imagenes.length ? `<h2>Galería</h2><div class="article-gallery">${imagenes.map(file => `
              <img src="${escapeAttribute(resolveImageUrl(file.archivo_path) || IEEE_FALLBACK_IMAGE)}" alt="${escapeHTML(file.caption || file.nombre_original || item.titulo)}" onerror="this.src='${IEEE_FALLBACK_IMAGE}'">
            `).join('')}</div>` : ''}
            ${documentos.length ? `<h2>Documentos</h2><div class="document-list">${documentos.map(file => `
              <a href="${escapeAttribute(resolveImageUrl(file.archivo_path) || '#')}" target="_blank" rel="noopener">${escapeHTML(file.nombre_original || 'Documento adjunto')}</a>
            `).join('')}</div>` : ''}
          </article>
        </div>
      </section>`;
  } catch (err) {
    root.innerHTML = '<section><div class="container"><p class="no-results">No se pudo cargar el contenido.</p></div></section>';
  }
}

// ── Galería (carga dinámica desde API + fallback) ──
async function initGaleria() {
  const container = document.getElementById('galeria-container');
  if (!container) return;
  const mode = container.dataset.mode || 'preview';
  if (mode === 'full') container.classList.add('full');
  renderSkeletonCards(container, mode === 'full' ? 9 : 4);

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
    renderEmptyState(container, 'Aún no hay fotos en la galería. ¡Sube las primeras desde el panel admin!', '<i class="ph-fill ph-image"></i>');
    return;
  }

  const items = (mode === 'full') ? fotos : fotos.slice(0, 8);
  container.innerHTML = items.map((foto, i) => {
    const imgUrl = resolveImageUrl(foto.path);
    const label = escapeHTML(foto.evento || foto.capitulo || 'Foto IEEE');
    return `
    <div class="galeria-item${i === 0 ? ' large' : ''}" data-idx="${i}" data-label="${escapeAttribute(label)}" data-src="${escapeAttribute(imgUrl || '')}">
      ${imgUrl ? `<img src="${escapeAttribute(imgUrl)}" alt="${label}" loading="lazy" onerror="this.src='${IEEE_FALLBACK_IMAGE}'">` : '<span class="galeria-icon">🖼️</span>'}
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
  const elements = document.querySelectorAll('section, .page-header, .footer-grid');
  if (!elements.length) return;

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
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach(el => {
    el.style.transition = 'opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView) {
      reveal(el);
    } else {
      el.style.opacity = '0';
      el.style.transform = 'translateY(40px)';
      observer.observe(el);
    }
  });

  setTimeout(() => {
    elements.forEach(el => {
      if (getComputedStyle(el).opacity === '0') reveal(el);
    });
  }, 2000);
}

function animateCards(cards) {
  if (!cards || !cards.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        observer.unobserve(card);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    // Retraso escalonado sutil basado en el índice local para dar efecto cascada
    card.style.transition = `opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1) ${i * 0.05}s, transform 0.6s cubic-bezier(0.25, 1, 0.5, 1) ${i * 0.05}s`;
    
    // Solo observar si no está ya en viewport, de lo contrario revelar rápido
    const rect = card.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 50 + i * 50);
    } else {
      observer.observe(card);
    }
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
      imgWrap.innerHTML = `<img src="${escapeAttribute(src)}" alt="${escapeHTML(label)}" onerror="this.src='${IEEE_FALLBACK_IMAGE}'">`;
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obtener los datos como objeto JSON
    const formData = new FormData(form);
    const dataObj = Object.fromEntries(formData.entries());
    
    try {
      status.className = 'form-status';
      status.textContent = 'Enviando...';
      
      const res = await fetch(`${API_BASE_URL}/contacto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataObj)
      });
      
      const resData = await res.json();
      
      if (res.ok) {
        showStatus(status, 'success', '¡Mensaje enviado! Te responderemos pronto.');
        form.reset();
      } else {
        showStatus(status, 'error', resData.error || 'Hubo un problema al enviar.');
      }
    } catch (err) {
      showStatus(status, 'error', 'Error de conexión. Intenta más tarde.');
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

// ════════════════════════════════════════════════════════
//  RESULTADOS DE BÚSQUEDA
// ════════════════════════════════════════════════════════
async function loadResultados() {
  const container = document.getElementById('resultados-container');
  const display = document.getElementById('search-query-display');
  if (!container || !display) return;

  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');

  if (!q) {
    display.textContent = 'Búsqueda vacía';
    container.innerHTML = '<p class="no-results">Por favor ingresa un término de búsqueda en la barra superior.</p>';
    return;
  }

  display.textContent = `Mostrando resultados para: "${escapeHTML(q)}"`;
  renderSkeletonCards(container, 6);

  try {
    const res = await fetch(`${API_BASE_URL}/contenido?q=${encodeURIComponent(q)}&estado=aprobado`);
    if (!res.ok) throw new Error('API not available');
    
    const resultados = await res.json();
    
    if (!resultados.length) {
      container.innerHTML = '<p class="no-results">No se encontraron noticias, proyectos o eventos para esta búsqueda.</p>';
      return;
    }

    container.innerHTML = resultados.map(item => createNoticiaCard({
      ...item,
      fecha: item.publicado_at || item.created_at,
      categoria: item.tipo,
      imagen: item.imagen_path,
      link: contentDetailLink(item),
    }, false)).join('');
    
    animateCards(container.querySelectorAll('.noticia-card'));
  } catch (err) {
    console.warn('Error en búsqueda:', err);
    container.innerHTML = '<p class="loading-text">Error conectando con el servidor.</p>';
  }
}

// ════════════════════════════════════════════════════════
//  CALENDARIO DE EVENTOS
// ════════════════════════════════════════════════════════
async function initCalendar() {
  const grid = document.getElementById('calendar-grid');
  const monthYearDisplay = document.getElementById('cal-month-year');
  const btnPrev = document.getElementById('cal-prev');
  const btnNext = document.getElementById('cal-next');
  if (!grid || !monthYearDisplay) return;

  let currentDate = new Date();
  let events = [];

  const loadEvents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/contenido?tipo=evento&estado=aprobado`);
      if (res.ok) events = await res.json();
    } catch (e) { console.warn('Error loading events:', e); }
  };

  const renderCalendar = () => {
    grid.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

    // Cabeceras de los días
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    days.forEach(d => {
      const h = document.createElement('div');
      h.className = 'calendar-day-header';
      h.textContent = d;
      grid.appendChild(h);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'calendar-day empty';
      grid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day';
      dayCell.innerHTML = `<div class="calendar-date">${day}</div>`;

      // Find events for this day
      const dayEvents = events.filter(e => {
        if (!e.fecha_evento) return false;
        const eDate = new Date(e.fecha_evento);
        // Usar UTC date localmente si es necesario o simplificar comparando Y-M-D
        return eDate.getDate() === day && eDate.getMonth() === month && eDate.getFullYear() === year;
      });

      dayEvents.forEach(e => {
        const evnt = document.createElement('a');
        evnt.className = 'calendar-event';
        evnt.href = contentDetailLink(e);
        evnt.textContent = e.titulo;
        evnt.title = e.titulo;
        dayCell.appendChild(evnt);
      });

      grid.appendChild(dayCell);
    }
  };

  await loadEvents();
  
  // Inject Mock Event for Visual Testing if empty
  if (events.length === 0) {
    events.push({
      titulo: 'Congreso Internacional IEEE',
      fecha_evento: new Date().toISOString(),
      link: '#'
    });
    events.push({
      titulo: 'Taller de Robótica Avanzada',
      fecha_evento: new Date(Date.now() + 86400000 * 2).toISOString(),
      link: '#'
    });
  }

  renderCalendar();

  btnPrev?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
  btnNext?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
}

// ════════════════════════════════════════════════════════
//  REVISTA IEEE
// ════════════════════════════════════════════════════════
async function loadRevistas() {
  const container = document.getElementById('revistas-container');
  if (!container) return;
  const mode = container.dataset.mode || 'preview';
  const limit = parseInt(container.dataset.limit) || (mode === 'preview' ? 4 : 12);
  
  renderSkeletonCards(container, mode === 'full' ? 8 : limit);
  
  try {
    const res = await fetch(`${API_BASE_URL}/contenido?tipo=revista&estado=aprobado`);
    if (!res.ok) throw new Error('API not available');
    let revistas = await res.json();
    
    // Inyección de Mock Data (Fallback Visual) si la API está vacía
    if (!revistas.length) {
      revistas = [
        { id: 1, titulo: "Revista IEEE #1 - IA Generativa", descripcion: "Edición enfocada en el impacto de la Inteligencia Artificial.", imagen_path: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800&h=1200", publicado_at: new Date().toISOString(), link: "#" },
        { id: 2, titulo: "Revista IEEE #2 - Robótica", descripcion: "Los avances de Boston Dynamics y robótica peruana.", imagen_path: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800&h=1200", publicado_at: new Date(Date.now() - 86400000 * 30).toISOString(), link: "#" },
        { id: 3, titulo: "Revista IEEE #3 - Ciberseguridad", descripcion: "Protegiendo las infraestructuras críticas del país.", imagen_path: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800&h=1200", publicado_at: new Date(Date.now() - 86400000 * 60).toISOString(), link: "#" }
      ];
    }
    
    const render = (list) => {
      container.innerHTML = list.map(item => `
        <a href="${contentDetailLink(item)}" class="revista-card">
          <div class="revista-img">
            <img src="${resolveImageUrl(item.imagen_path) || IEEE_FALLBACK_IMAGE}" alt="${escapeAttribute(item.titulo)}" loading="lazy">
            <div class="revista-overlay">
              <span class="revista-date">${formatDate(item.publicado_at || item.created_at)}</span>
            </div>
          </div>
          <div class="revista-info">
            <h3>${escapeHTML(item.titulo)}</h3>
            <p>${escapeHTML(item.descripcion)}</p>
          </div>
        </a>
      `).join('');
      animateCards(container.querySelectorAll('.revista-card'));
    };
    
    if (mode === 'full') {
      container.classList.add('full');
      render(revistas);
    } else {
      render(revistas.slice(0, limit));
    }
  } catch (err) {
    console.warn('Error cargando revistas:', err);
    renderEmptyState(container, 'Error cargando las revistas.', '<i class="ph-fill ph-warning-circle"></i>');
  }
}

// ════════════════════════════════════════════════════════
//  ROUTER Y ARRANQUE (BOOTSTRAP)
// ════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  
  initNavbar();
  initParticles();
  initScrollAnimations();
  

// ════════════════════════════════════════════════════════
//  BLOQUE D — PÁGINAS DE DETALLE DINÁMICAS
// ════════════════════════════════════════════════════════

/** Actualiza los meta tags Open Graph y el <title> */
function updateOpenGraph({ title, description, image, url }) {
  document.title = `${title} | IEEE Rama Estudiantil UNMSM`;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.setAttribute('content', val); };
  set('og-title',       title);
  set('og-description', description || '');
  set('og-image',       image || '/images/default-meta.jpg');
  set('og-url',         url || window.location.href);
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.textContent = `${title} | IEEE Rama Estudiantil UNMSM`;
}

/** D.4 — Barra de compartir */
function renderShareBar(title, url) {
  const encoded = encodeURIComponent(url);
  const text    = encodeURIComponent(title);
  return `
    <div class="share-bar">
      <span>Compartir:</span>
      <button class="share-btn share-btn-copy" onclick="navigator.clipboard.writeText('${url}').then(()=>this.textContent='¡Copiado!')">
        <i data-lucide="link"></i> Copiar enlace
      </button>
      <a class="share-btn share-btn-wa" href="https://wa.me/?text=${text}%20${encoded}" target="_blank" rel="noopener">
        <i data-lucide="message-circle"></i> WhatsApp
      </a>
      <a class="share-btn share-btn-tw" href="https://twitter.com/intent/tweet?text=${text}&url=${encoded}" target="_blank" rel="noopener">
        <i data-lucide="twitter"></i> Twitter
      </a>
    </div>`;
}

/** D.1 — Capítulo detalle */
async function loadCapituloDetalle() {
  const root = document.getElementById('capitulo-detail-root');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const slug   = params.get('slug');
  if (!slug) {
    root.innerHTML = `<div class="cap-not-found container"><h2>Capítulo no encontrado</h2><p>No se proporcionó un identificador de capítulo.</p><a href="/capitulos" class="btn btn-primary">← Volver a Capítulos</a></div>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/capitulos/${slug}`);
    if (!res.ok) throw new Error('Not found');
    const cap = await res.json();

    updateOpenGraph({
      title:       cap.nombre || cap.sigla,
      description: cap.descripcion,
      image:       cap.imagen_path ? `${UPLOADS_BASE_URL}${cap.imagen_path}` : null,
      url:         window.location.href,
    });

    const logoHtml = cap.logo_path
      ? `<img class="cap-detail-logo" src="${UPLOADS_BASE_URL}${cap.logo_path}" alt="Logo ${cap.sigla}" loading="lazy">`
      : `<div class="cap-detail-logo-placeholder">${(cap.sigla||'?').slice(0,3)}</div>`;

    // Fetch contenido reciente del capítulo
    const contRes  = await fetch(`${API_BASE_URL}/contenido?capitulo=${encodeURIComponent(cap.sigla)}&estado=aprobado`);
    const contenidos = contRes.ok ? await contRes.json() : [];
    const recientes  = contenidos.slice(0, 3);

    const recienteHtml = recientes.length ? `
      <section style="padding: var(--space-8) 0; background: var(--bg-body);">
        <div class="container">
          <h2 style="font-family:'Orbitron',sans-serif;font-size:var(--text-2xl);color:var(--ieee-dark);margin-bottom:var(--space-5);">
            Publicaciones Recientes
          </h2>
          <div class="cap-reciente-grid">
            ${recientes.map(c => `
              <a href="/contenido-detalle?slug=${c.slug}" style="text-decoration:none;">
                <div class="noticia-card" style="background:#fff;padding:var(--space-5);border-radius:var(--radius-card);">
                  <span class="article-type-badge type-${c.tipo}" style="font-size:var(--text-xs);padding:2px 10px;border-radius:50px;margin-bottom:8px;display:inline-block;">${c.tipo}</span>
                  <h3 style="color:var(--ieee-dark);font-size:var(--text-base);margin-bottom:var(--space-2);">${c.titulo}</h3>
                  <p style="color:var(--text-muted);font-size:var(--text-sm);">${(c.extracto||'').slice(0,100)}…</p>
                </div>
              </a>`).join('')}
          </div>
        </div>
      </section>` : '';

    const redes = [];
    if (cap.facebook)  redes.push(`<a class="cap-social-link" href="${cap.facebook}"  target="_blank" rel="noopener"><i data-lucide="facebook"></i> Facebook</a>`);
    if (cap.instagram) redes.push(`<a class="cap-social-link" href="${cap.instagram}" target="_blank" rel="noopener"><i data-lucide="instagram"></i> Instagram</a>`);
    if (cap.linkedin)  redes.push(`<a class="cap-social-link" href="${cap.linkedin}"  target="_blank" rel="noopener"><i data-lucide="linkedin"></i> LinkedIn</a>`);
    if (cap.email)     redes.push(`<a class="cap-social-link" href="mailto:${cap.email}"><i data-lucide="mail"></i> Email</a>`);

    root.innerHTML = `
      <div class="cap-detail-hero">
        <div class="container">
          ${logoHtml}
          <div class="cap-detail-meta">
            <span class="cap-detail-sigla">${cap.sigla || ''}</span>
            <h1>${cap.nombre || cap.sigla}</h1>
            <p class="cap-detail-desc">${cap.descripcion || ''}</p>
            <div class="cap-detail-actions">
              ${cap.web ? `<a href="${cap.web}" target="_blank" rel="noopener" class="btn btn-primary"><i data-lucide="globe"></i> Sitio web</a>` : ''}
              <a href="/capitulos" class="btn btn-secondary">← Todos los capítulos</a>
            </div>
          </div>
        </div>
      </div>

      <section class="cap-detail-body">
        <div class="container cap-detail-grid">
          <div class="cap-detail-main">
            ${cap.descripcion_larga ? `<h2>Sobre el capítulo</h2><p>${cap.descripcion_larga}</p>` : ''}
            ${cap.mision  ? `<h2>Misión</h2><p>${cap.mision}</p>`  : ''}
            ${cap.vision  ? `<h2>Visión</h2><p>${cap.vision}</p>`  : ''}
            ${renderShareBar(cap.nombre || cap.sigla, window.location.href)}
          </div>
          <aside>
            <div class="cap-sidebar-card">
              <h3>Información</h3>
              ${cap.fundacion ? `<div class="cap-info-row"><strong>Fundación</strong><span>${cap.fundacion}</span></div>` : ''}
              ${cap.email     ? `<div class="cap-info-row"><strong>Email</strong><a href="mailto:${cap.email}" style="color:var(--ieee-blue)">${cap.email}</a></div>` : ''}
              ${cap.miembros  ? `<div class="cap-info-row"><strong>Miembros</strong><span>${cap.miembros}</span></div>` : ''}
            </div>
            ${redes.length ? `<div class="cap-sidebar-card"><h3>Redes sociales</h3><div class="cap-social-links">${redes.join('')}</div></div>` : ''}
          </aside>
        </div>
      </section>
      ${recienteHtml}`;

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    root.innerHTML = `
      <div class="container cap-not-found">
        <h2>Capítulo no encontrado</h2>
        <p>No existe un capítulo con ese identificador o el servidor no está disponible.</p>
        <a href="/capitulos" class="btn btn-primary">← Volver a Capítulos</a>
      </div>`;
  }
}

/** D.2 — Contenido detalle (noticia/proyecto/evento unificado) */
async function loadContenidoDetalle() {
  const root = document.getElementById('contenido-detail-root');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const slug   = params.get('slug');
  if (!slug) {
    root.innerHTML = `<div class="container content-not-found"><h2>Artículo no encontrado</h2><p>No se proporcionó un identificador.</p><a href="/" class="btn btn-primary">← Volver al inicio</a></div>`;
    return;
  }

  const TYPE_LABELS = { noticia: 'Noticia', proyecto: 'Proyecto', evento: 'Evento' };
  const TYPE_ICONS  = { noticia: 'newspaper', proyecto: 'rocket', evento: 'calendar' };
  const backLinks   = { noticia: '/noticias', proyecto: '/proyectos', evento: '/concursos' };

  try {
    const res  = await fetch(`${API_BASE_URL}/contenido/slug/${slug}`);
    if (!res.ok) throw new Error('Not found');
    const art  = await res.json();
    const tipo = art.tipo || 'noticia';
    const url  = window.location.href;
    const imgSrc = art.imagen_path ? `${UPLOADS_BASE_URL}${art.imagen_path}` : null;

    updateOpenGraph({
      title:       art.titulo,
      description: art.extracto || art.descripcion,
      image:       imgSrc,
      url,
    });

    const fecha = art.publicado_at
      ? new Date(art.publicado_at).toLocaleDateString('es-PE', { day:'numeric', month:'long', year:'numeric' })
      : '';

    // Campos extra según tipo
    let extraInfo = '';
    if (tipo === 'evento') {
      if (art.fecha_evento) extraInfo += `<div class="sidebar-info-item"><strong>Fecha</strong><span>${new Date(art.fecha_evento).toLocaleDateString('es-PE')}</span></div>`;
      if (art.lugar)        extraInfo += `<div class="sidebar-info-item"><strong>Lugar</strong><span>${art.lugar}</span></div>`;
      if (art.link)         extraInfo += `<div class="sidebar-info-item"><strong>Inscripción</strong><a href="${art.link}" target="_blank" rel="noopener" style="color:var(--ieee-blue)">Ver enlace</a></div>`;
    }
    if (tipo === 'proyecto' && art.estado_proyecto) {
      extraInfo += `<div class="sidebar-info-item"><strong>Estado</strong><span>${art.estado_proyecto}</span></div>`;
    }

    root.innerHTML = `
      <div class="article-hero" ${imgSrc ? `style="background:var(--ieee-dark);"` : ''}>
        ${imgSrc ? `<div class="article-hero-bg" style="background-image:url('${imgSrc}');"></div>` : ''}
        <div class="container">
          <div class="breadcrumb">
            <a href="/">Inicio</a><span>›</span>
            <a href="${backLinks[tipo] || '/'}">${TYPE_LABELS[tipo] || tipo}s</a><span>›</span>
            <span>${art.titulo}</span>
          </div>
          <div class="article-type-badge type-${tipo}">
            <i data-lucide="${TYPE_ICONS[tipo] || 'file-text'}"></i>
            ${TYPE_LABELS[tipo] || tipo}
          </div>
          <h1>${art.titulo}</h1>
          <div class="article-meta-row">
            ${art.autor_nombre ? `<span class="article-meta-item"><i data-lucide="user"></i> ${art.autor_nombre}</span>` : ''}
            ${fecha             ? `<span class="article-meta-item"><i data-lucide="calendar"></i> ${fecha}</span>` : ''}
            ${art.capitulo      ? `<span class="article-meta-item"><i data-lucide="layers"></i> ${art.capitulo}</span>` : ''}
            ${art.vistas        ? `<span class="article-meta-item"><i data-lucide="eye"></i> ${art.vistas} vistas</span>` : ''}
          </div>
        </div>
      </div>

      <div class="container article-layout">
        <article class="article-body">
          ${imgSrc ? `<img class="article-featured-img" src="${imgSrc}" alt="${art.titulo}" loading="lazy">` : ''}
          ${art.extracto ? `<p style="font-size:var(--text-lg);font-weight:500;color:var(--text-primary);border-left:4px solid var(--ieee-blue);padding-left:var(--space-4);margin-bottom:var(--space-6);">${art.extracto}</p>` : ''}
          <div class="article-content">
            ${art.cuerpo || art.descripcion || '<p>Sin contenido disponible.</p>'}
          </div>
          ${renderShareBar(art.titulo, url)}
        </article>

        <aside class="article-sidebar">
          <div class="sidebar-card">
            <h3>Detalles</h3>
            <div class="sidebar-info-item"><strong>Tipo</strong><span>${TYPE_LABELS[tipo] || tipo}</span></div>
            ${art.capitulo ? `<div class="sidebar-info-item"><strong>Capítulo</strong><span>${art.capitulo}</span></div>` : ''}
            ${art.categoria ? `<div class="sidebar-info-item"><strong>Categoría</strong><span>${art.categoria}</span></div>` : ''}
            ${extraInfo}
          </div>
          <a href="${backLinks[tipo] || '/'}" class="btn btn-secondary" style="width:100%;justify-content:center;">
            <i data-lucide="arrow-left"></i> Volver
          </a>
        </aside>
      </div>`;

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    root.innerHTML = `
      <div class="container content-not-found">
        <h2>Artículo no encontrado</h2>
        <p>El artículo solicitado no existe o no está disponible.</p>
        <a href="/" class="btn btn-primary">← Volver al inicio</a>
      </div>`;
  }
}

  if (page === 'home') {
    initAdvancedCanvas();
    loadCapitulos();
    loadNoticias();
    loadProyectos();
    loadRevistas();
    initGaleria();
  } else if (page === 'capitulos') {
    loadCapitulos();
  } else if (page === 'capitulo-detalle') {
    loadCapituloDetalle();
  } else if (page === 'noticias') {
    loadNoticias();
  } else if (page === 'proyectos') {
    loadProyectos().then(() => {
      initHorizontalScroll();
    });
  } else if (page === 'concursos') {
    loadConcursos();
  } else if (page === 'contenido-detalle') {
    loadContenidoDetalle();
  } else if (page === 'galeria') {
    initGaleria();
  } else if (page === 'revista') {
    loadRevistas();
  } else if (page === 'contacto') {
    initContactForm();
    initFAQ();
  } else if (page === 'resultados') {
    loadResultados();
  } else if (page === 'calendario') {
    initCalendar();
  }

  // Activar Lucide Icons en todo el DOM
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
});
