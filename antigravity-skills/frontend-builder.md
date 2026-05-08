# Skill: Frontend Builder — IEEE Rama General Web

## Role
Ingeniero frontend especializado en sitios multi-página vanilla (sin frameworks).

## Stack del proyecto
- **Estructura:** 7 páginas HTML (index, capitulos, noticias, proyectos, concursos, galeria, contacto)
- **Estilos:** CSS vanilla con variables CSS custom (`--ieee-blue`, `--ieee-gold`, etc.)
- **Lógica:** Un solo `js/main.js` centralizado (1050+ líneas)
- **Datos:** Archivos JSON en `data/` + fallback API REST
- **Efectos:** particles.js (CDN) + canvas custom

## Arquitectura de archivos

```
├── index.html          ← página principal (data-page="home")
├── capitulos.html      ← data-page="capitulos"
├── noticias.html       ← data-page="noticias"
├── proyectos.html      ← data-page="proyectos"
├── concursos.html      ← data-page="concursos"
├── galeria.html        ← data-page="galeria"
├── contacto.html       ← data-page="contacto"
├── css/style.css       ← design system completo
├── js/main.js          ← toda la lógica (partículas, carga, render, filtros)
└── data/               ← JSON de contenido
```

## Reglas de código

### HTML
- Cada página tiene `data-page="X"` en `<body>` para routing de JS
- Navbar y footer se repiten en cada HTML (no hay componentes)
- Cambios de navegación → editar las 7 páginas
- Semántica: `<nav>`, `<section>`, `<header>`, `<footer>`, `<main>`
- IDs únicos para containers: `capitulos-container`, `noticias-container`, etc.
- Atributo `data-mode="preview|full"` controla cuántos items mostrar

### CSS
- NUNCA usar `style=` inline → siempre clases del design system
- Variables globales en `:root` del `style.css`
- Clases utilitarias: `.loading-text`, `.link-highlight`, `.edit-hint`, `.hidden`
- Responsive: breakpoints en `768px` y `480px`
- `pointer-events: none` en `<section>` + `auto` en hijos (para partículas)
- Z-index layers: partículas(1) → contenido(2) → navbar(1000) → loader(9999)

### JavaScript (main.js)
- Patrón de carga: `try API → catch → fallback JSON local`
- Funciones de renderizado: `createCapituloCard()`, `createNoticiaCard()`, etc.
- SIEMPRE escapar datos: `escapeHTML()`, `escapeAttribute()`, `sanitizeColor()`
- Fechas: usar `safeParseDate()` (maneja ISO y timestamps con espacio)
- Imágenes: usar `resolveImageUrl()` (maneja `/uploads/` API y rutas locales)
- Partículas: `initAdvancedCanvas()` con resize handler que recalcula NODE_COUNT
- Filtros: `initNoticiasFilters()`, `initConcursosFilters()` con chips

### Agregar una nueva sección
1. Crear `nueva-seccion.html` con navbar/footer copiado
2. Agregar `<li><a href="nueva-seccion.html">` en las 7 páginas
3. Agregar función `loadNuevaSeccion()` en `main.js`
4. Llamar desde el bloque `DOMContentLoaded`
5. Crear `data/nueva-seccion.json` si aplica

## Performance
- Scripts con `defer` para no bloquear render
- Animaciones via `requestAnimationFrame` (canvas)
- `IntersectionObserver` implícito en scroll listeners
- Imágenes con `onerror` fallback para degradar graceful

## Auto-validación
Antes de entregar código frontend:
- [ ] ¿El navbar tiene los mismos links en TODAS las páginas?
- [ ] ¿Los datos se escapan con `escapeHTML()`?
- [ ] ¿Se usa `class=` en vez de `style=`?
- [ ] ¿Funciona sin la API (fallback a JSON)?
- [ ] ¿El loader desaparece después de cargar?