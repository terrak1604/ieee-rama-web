# CHANGELOG - IEEE Rama Estudiantil UNMSM
# Registro de cambios del proyecto web
# Formato: [AAAA-MM-DD HH:MM] - Descripción

---

[2026-05-10 16:50]
- Bloque F: Editor de capítulos con tabs.
  F.1 Schema capitulo_detalle ya existía con todos los campos necesarios.
  F.2 Endpoints PATCH /api/capitulos/:slug y POST /api/capitulos/:slug/archivos
  ya implementados con permisos canEditChapter (rol+capitulo).
  F.3 Modal rediseñado con 3 tabs:
  - Tab Información: nombre, sigla, color picker (hex sync), fecha fundación,
    desc corta con contador 300 chars, desc larga, misión, visión.
  - Tab Imágenes: preview de logo circular y portada 16:9, carga con preview
    inmediato antes de enviar, small tips.
  - Tab Contacto y Redes: email, teléfono, web, Facebook, Instagram, LinkedIn,
    YouTube, TikTok con validación de URLs en frontend.
  F.4 Permisos: director_capitulo solo ve y edita su capítulo; director_rama
  ve todos. Backend ya validaba canEditChapter antes de actualizar.

---

[2026-05-10 16:44]
- Bloque E: Editor admin enriquecido.
  E.1 Quill toolbar ampliada: headers 2-4, colores de texto/fondo, código, indent.
  E.2 Endpoint POST /api/contenido/:id/archivos ya existía; integración completa.
  E.3 UI de adjuntos rediseñada: cada archivo muestra thumbnail (imagen) o chip
  PDF, campo de caption editable y handle de reorden drag-and-drop nativo.
  Máximo 10 adjuntos; eliminar archivo no requiere recarga.
  E.4 Autosave de borrador: guarda título, extracto, lugar, fecha, cuerpo Quill
  en localStorage cada 30s de inactividad o al cambiar cualquier campo.
  Badge dorado "Borrador guardado a las HH:MM" visible en la UI.
  Borrador se restaura automáticamente al volver a la pestaña Editor.
  Se borra tras guardar o hacer reset del formulario.

---

[2026-05-10 06:50]
- Bloque D: Páginas de detalle dinámicas.
  capitulo-detalle.html: hero con logo/sigla, descripción, sidebar de info+redes,
  publicaciones recientes del capítulo desde la API, Open Graph dinámico.
  contenido-detalle.html: artículo unificado (noticia/proyecto/evento), hero con
  imagen de fondo, breadcrumb, extracto destacado, sidebar de detalles específicos
  por tipo (fecha_evento, lugar, estado_proyecto), barra de compartir
  (copiar enlace, WhatsApp, Twitter), Open Graph dinámico.
  server.js: rutas /capitulo-detalle y /contenido-detalle añadidas.
  main.js: updateOpenGraph(), renderShareBar(), loadCapituloDetalle(),
  loadContenidoDetalle() implementadas.

---

[2026-05-10 06:45]
- Bloque C: Pulido visual base.
  Tokens CSS: escala de espaciado 8px (--space-1 … --space-9) y tipografía Major Third
  1.25 (--text-xs … --text-4xl). Sombras a 2 niveles (reposo/hover). radius-card → 12px.
  Lucide Icons CDN añadido a las 10 páginas públicas + lucide.createIcons() en main.js.
  Cards: hover 3D tilt (perspective 1000px rotateX 2deg), imagen 16:9 con zoom 1.05.
  Botones: 3 variantes claras (primary, secondary, ghost) + active translateY(1px).
  Inputs/forms: border #d1deeb, focus ring azul IEEE, labels en uppercase xs.
  Skeleton loaders: animación shimmer 1.4s para estados de carga.
  Navbar: backdrop-blur al scrollear, indicador activo con línea inferior animada.
  Hero: min-height 88vh + text-shadow sutil. Secciones: padding var(--space-9)/--space-7.

---

[2026-05-10 06:40]
- Bloque B: Fixes críticos del backend.
  updateContenido ahora borra la imagen anterior al subir una nueva (evita archivos huérfanos).
  Tests Jest+Supertest: 11 tests — health, contenido público, auth (400/401),
  rutas protegidas sin token (401), y bloqueo de paths sensibles (.env, sqlite, /backend/).
  Mocks CJS de jsdom/dompurify para compatibilidad Jest con ESM (sin deps nuevas).
  jest.config.js con moduleNameMapper y forceExit.

---

[2026-05-10 06:00]
- Bloque A: Express ahora sirve frontend, admin y API en :3000 unificado.
  Eliminada dependencia de npx serve. Añadidos start.bat, start.sh, package.json raíz.
  Botón "Admin" añadido al navbar de las 10 páginas públicas.
  Bloqueo explícito de paths sensibles (.env, database.sqlite, /backend/, .git).
- Bloque A.5: Hardening de infra para producción.
  nginx.conf reescrito: gzip, security headers, rate-limit en /api/auth/login,
  routing multi-página correcto (no SPA), bloqueo de archivos sensibles.
  docker-compose.yml: backend ya no expuesto al host, healthchecks, límites de
  RAM/CPU, mounts específicos en lugar de toda la repo, network bridge dedicada.
  Dockerfile: multi-stage build, usuario no-root, npm ci con lockfile.
  Añadidos .dockerignore (raíz y backend/), backend/.env.example.

---

[2026-05-01 15:17]
- Creación inicial del proyecto IEEE_Rama_General_Web
- Estructura de carpetas: css/, js/, data/, images/ (capitulos, hero, noticias, galeria)
- Generado index.html con secciones: Hero, Capítulos, Noticias, Concursos, Galería, Footer
- Creado css/style.css con diseño moderno, modo oscuro, colores IEEE (#00629b, #002855, #0099d6)
- Creado js/main.js con carga dinámica desde JSON, partículas, navbar animada y scroll suave
- Creado data/capitulos.json con los 16 capítulos IEEE activos
- Creado data/noticias.json con sistema de noticias fácilmente editable (5 noticias de ejemplo)
- Creado data/concursos.json con convocatorias editables (3 concursos de ejemplo)
- Implementado fondo animado con particles.js (estilo tech IEEE)
- Tipografías: Inter + Orbitron (Google Fonts)
- Diseño responsive: Desktop, Tablet, Móvil
- Sistema de placeholders claros para imágenes

---

[2026-05-01 15:33]
- Mejora del efecto de partículas de fondo (sistema de doble capa):
  · Capa 1 (particles.js): +35 partículas, formas mixtas (círculo/triángulo/borde),
    animación de tamaño, modo bubble al pasar el cursor + repulse al hacer clic
  · Capa 2 (canvas propio): nodos pulsantes con halos de luz, líneas tipo circuito
    en ángulo recto (estilo PCB/circuito), efecto aurora animada con 3 blobs de
    color IEEE, grid de fondo sutil, nodos dorados (~12%) como acentos decorativos
  · Sin impacto en el rendimiento: baja opacidad y requestAnimationFrame

---

[2026-05-01 18:45]
- Fix bug runtime en canvas (IndexSizeError reportado en consola):
  · drawNodes() podía pasar un radio negativo a createRadialGradient cuando
    n.r era pequeño (~1) y Math.sin(n.pulse) caía cerca de -1, dando
    pulseR ≈ -0.2. Ahora pulseR se clampea a un mínimo de 0.5 antes de
    usarse en el gradient. La animación ya no rompe en mid-frame.

---

[2026-05-01 18:30]
- Fix de carga inestable de páginas (reportado: "a veces no carga bien").
  4 causas identificadas y corregidas:
  · CSS: `.page-header` faltaba z-index → en subpáginas el banner del título
    quedaba debajo de los canvases de partículas (z:1 y z:2). Ahora está
    en z:3, igual que las `<section>`.
  · JS initScrollAnimations: las secciones ya visibles en viewport al
    cargar ahora se muestran de inmediato (sin fade), evitando el flash
    "página invisible". Las que están fuera del viewport siguen animándose
    al hacer scroll. Safety fallback: a los 1.5s se fuerza visibilidad de
    cualquier sección que siga en opacity:0 (por si el observer fallara).
  · JS initLoader: ahora tiene un máximo de 2.5s desde DOMContentLoaded.
    Si el CDN de particles.js va lento o `window.load` no dispara, el
    loader se oculta de todas formas. Doble guardia para evitar
    re-disparos (flag `hidden`).
  · HTML: agregado `defer` a los <script> en las 6 páginas. Ahora un CDN
    lento (jsdelivr de particles.js) no bloquea el parser HTML. La página
    se renderiza primero y los scripts se ejecutan después, en orden, antes
    de DOMContentLoaded.

---

[2026-05-01 17:30]
- Conversión a sitio MULTI-PÁGINA. La home (index.html) se mantiene como
  landing con previews; cada sección principal ahora tiene su propia página.
- Páginas nuevas creadas:
  · capitulos.html — 16 capítulos completos con buscador en vivo (filtra por
    nombre, sigla y descripción).
  · noticias.html — todas las noticias ordenadas por fecha desc., filtros
    por categoría (Todas / Convocatorias / Eventos / Charlas / Programas /
    Actividades) usando chips clickeables.
  · concursos.html — todas las convocatorias con filtros por estado
    (Todas / Abiertas / Próximamente) y vista expandida con requisitos.
  · galeria.html — grid completo (12 placeholders) + lightbox modal con
    soporte de tecla Escape y clic fuera para cerrar.
  · contacto.html — formulario Formspree-ready (modo demo activo hasta
    configurar action), layout 2 columnas con info de contacto, mapa
    embebido de la UNMSM y FAQ accordion con 6 preguntas.
- index.html: navbar reemplaza anchors `#seccion` por links `seccion.html`
  (excepto Inicio que sigue siendo scrollspy local). Cada preview ahora
  tiene un botón "Ver todos →" hacia su página dedicada. Body marcado con
  data-page="home" para que el scrollspy solo opere en la landing.
- css/style.css: añadidos estilos para page-header, breadcrumb, filters-bar
  + chips, search input, lightbox, formulario, FAQ accordion, mapa
  estilizado y tarjetas en modo `.full`.
- js/main.js refactorizado:
  · Loaders detectan `data-mode` del contenedor (preview / full) y aplican
    límites o filtros según corresponda.
  · Nuevas funciones: initCapitulosFilters, initNoticiasFilters,
    initConcursosFilters, initLightbox, initContactForm, initFAQ.
  · updateActiveLink solo actúa como scrollspy si body[data-page="home"];
    en subpáginas el link activo se marca por HTML.
  · Form de contacto usa fetch a Formspree cuando el action contiene
    formspree.io; modo demo en cualquier otro caso.

---

[2026-05-01 16:10]
- Revisión general del código y corrección de bugs detectados:
  · CSS: selector `#hero` corregido a `#inicio` para que el hero reciba sus estilos
    (background gradient, grid de fondo y padding-top). Antes la sección quedaba
    sin formato porque el HTML usa `id="inicio"`.
  · HTML: eliminado `id="contacto"` duplicado en el `<footer>` (HTML inválido).
    El ancla `#contacto` sigue funcionando vía el `<div id="contacto">` interno.
  · CSS: removido `@import` de Google Fonts (ya se carga vía `<link>` en index.html;
    evita doble petición y render-block extra).
  · CSS: eliminadas reglas vacías `#noticias {}` y `#galeria {}`.
  · JS: hamburger ahora actualiza correctamente `aria-expanded` y la clase `.active`
    al abrir/cerrar el menú móvil. También se sincroniza al hacer clic en un link
    del nav (antes quedaba con `aria-expanded="false"` desincronizado).
  · JS: removida variable muerta `const spans` en el handler del hamburger.

---

<!-- INSTRUCCIONES PARA AGREGAR CAMBIOS FUTUROS:

Cada vez que modifiques el sitio, agrega una entrada con este formato:

[AAAA-MM-DD HH:MM]
- Descripción del cambio 1
- Descripción del cambio 2

Ejemplo:
[2026-06-15 10:30]
- Se agregó nueva noticia sobre Congreso IEEE Lima 2026
- Se actualizó email de contacto en el footer
- Se añadió imagen del evento RAS en galería

-->
