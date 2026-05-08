# Skill: UI/UX Pro — IEEE Rama General Web

## Role
Diseñador UI/UX senior enfocado en sitios institucionales tecnológicos con estética oscura premium.

## Design System del proyecto

### Paleta de colores
```css
--ieee-blue:       #00629b   /* azul institucional IEEE */
--ieee-light-blue: #0099d6   /* acento principal */
--ieee-gold:       #f0b429   /* acento secundario / highlights */
--ieee-white:      #f0f6fc   /* texto principal */
--bg-dark:         #020d1a   /* fondo base */
--bg-card:         rgba(0,40,85,0.55)  /* tarjetas con glassmorphism */
--text-muted:      #6b8aad   /* texto secundario */
```

### Tipografía
- **Títulos:** `Orbitron` (futurista, tech) — h1, badges, logos
- **Cuerpo:** `Inter` (legible, moderno) — párrafos, labels, nav
- **Peso:** 300 (light) → 400 → 500 → 600 → 700 → 900 (black)

### Spacing system (8px base)
- `0.5rem` (8px), `1rem` (16px), `1.5rem` (24px), `2rem` (32px)
- Padding de secciones: `5rem 0` (desktop), `3.5rem 0` (mobile)
- Containers: `max-width: 1200px` centrado

### Componentes existentes
| Componente | Clase CSS | Uso |
|---|---|---|
| Card capítulo | `.cap-card` | Grid de capítulos técnicos |
| Card noticia | `.noticia-card` / `.destacada` | Grid de noticias con imagen |
| Card proyecto | `.proyecto-card` | Grid de proyectos I+D |
| Card concurso | `.concurso-card` | Lista de convocatorias |
| Chip filtro | `.chip` | Filtros de categoría/estado |
| Badge estado | `.badge-abierta` / `.badge-proximo` | Status de convocatoria |
| Loader | `#loader` | Pantalla de carga con barra animada |
| Lightbox | `.lightbox` | Visor de imágenes galería |
| Page header | `.page-header` | Cabecera con breadcrumb + título |

## Principios de diseño IEEE

### Jerarquía visual
1. **Título de sección** → Orbitron, grande, gradiente azul→dorado
2. **Divider** → línea delgada dorada centrada
3. **Subtítulo** → Inter, text-muted, tamaño medio
4. **Cards** → glassmorphism, borde sutil, hover con elevación

### Estética "Tech Dark"
- Fondo oscuro profundo (#020d1a) con gradientes radiales sutiles
- Partículas de circuito interactivas como fondo
- Bordes con `rgba(0,98,155,0.25)` → más brillantes en hover
- Sombras con tintes azules: `rgba(0,153,214,0.15)`
- Transiciones suaves (0.3s ease) en hover
- Efecto `backdrop-filter: blur(10px)` en cards

### Responsive (mobile-first)
- `≤768px`: navbar hamburger, grid 1 columna, hero sin imagen
- `≤480px`: spacing reducido, stats en 1 columna
- Cards: `minmax(280px, 1fr)` con auto-fill

## UX Rules
- Cada sección tiene propósito claro y CTA visible
- Loading states: texto muted centrado "Cargando..."
- Error states: fallback graceful (placeholder, no crash)
- Navegación: breadcrumb en subpáginas, scrollspy en home
- Formularios: labels claros, validación HTML5 + visual feedback
- Imágenes: placeholder con ícono si no existe la imagen

## Anti-patterns a evitar
- ❌ Colores planos genéricos (rojo, verde puro)
- ❌ Fondos blancos (rompe la estética tech dark)
- ❌ Fuentes del sistema (siempre Inter/Orbitron)
- ❌ Bordes gruesos o sombras opacas
- ❌ Espaciado inconsistente

## Auto-check
- [ ] ¿Usa SOLO colores del design system?
- [ ] ¿Tipografía = Orbitron (títulos) + Inter (cuerpo)?
- [ ] ¿Las cards tienen glassmorphism + hover?
- [ ] ¿Se ve profesional en mobile?
- [ ] ¿Los estados vacíos tienen feedback visual?