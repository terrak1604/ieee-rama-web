# Contexto Completo del Proyecto IEEE Rama General Web

## Fecha Actual
May 7, 2026

## Estado del Repositorio
- **Git Status**: No hay repositorio Git inicializado (fatal: not a git repository). Se recomienda inicializar con `git init` antes de cambios.

## Estructura del Workspace
```
capitulos.html
changelog.md
concursos.html
contacto.html
galeria.html
index.html
noticias.html
proyectos.html
README.md
realimentacion.txt
revista.html
skills-lock.json
admin/
	admin-styles.css
	admin.js
	dashboard.html
	dashboard.js
	login.html
antigravity-skills/
	admin-panel.md
	backend-architect.md
	code-reviewer.md
	database-designer.md
	deploy-devops.md
	frontend-builder.md
	ui-ux-pro.md
backend/
	package.json
	seed.js
	server.js
	config/
		db.js
	controllers/
		authController.js
		contenidoController.js
	middleware/
		auth.js
	routes/
		auth.js
		contenido.js
		galeria.js
		revistas.js
		siteImages.js
	uploads/
		1777774312234-images.jfif
		galeria/
			1777774447637-images.jfif
			1777774523956-images.jfif
		revistas/
css/
	style.css
data/
	capitulos.json
	concursos.json
	noticias.json
	revistas.json
images/
	capitulos/
	galeria/
	hero/
	noticias/
	revistas/
js/
	main.js
uploads/
	galeria/
```

## Contexto del Proyecto
Trabajo en un sitio multi-página estático (HTML/CSS/JS) con backend Node.js/Express/SQLite + JWT/Multer y un panel de administración separado en /admin/. Estructura actual:
- Frontend público: index.html, capitulos.html, noticias.html, proyectos.html, concursos.html, galeria.html, contacto.html
- Datos: data/capitulos.json (16 capítulos IEEE: WIE, RAS, EMBS, etc.), data/noticias.json, data/concursos.json
- Backend: backend/server.js, backend/routes/{auth,contenido,galeria,siteImages,revistas}.js, backend/controllers/, backend/middleware/auth.js, backend/config/db.js
- Admin: admin/login.html, admin/dashboard.html, admin/admin.js
- Tabla principal: contenido (id, tipo[noticia|proyecto|evento], titulo, descripcion, imagen_path, autor_id, capitulo, estado[borrador|pendiente_aprobacion|aprobado|rechazado])
- Roles: director_rama (super-admin que aprueba) y director_capitulo (crea contenido, scoped a su capítulo)

## Objetivo General
Convertir el sitio en una plataforma editorial completa donde:
1) Cada capítulo tenga su propia página de detalle editable (con logo, descripción, redes, miembros) que muestre todo el contenido (noticias/proyectos/eventos) asociado a ese capítulo.
2) Cada noticia, proyecto y evento tenga una página de detalle individual estilo "artículo de periódico" con cuerpo enriquecido, galería de imágenes y documentos descargables.
3) El panel admin permita: editar la info del capítulo, subir/cambiar el logo del capítulo, crear contenido tipo artículo con múltiples imágenes y documentos adjuntos.

## Prompt Generado Anteriormente para el Agente de VS Code
Implementa los cambios en el orden especificado a continuación. Antes de cualquier cambio, verifica el estado del repositorio con `git status` (si no hay git, inicialízalo con `git init` y confirma que esté limpio). Abre un commit por bloque. No toques el sistema de partículas ni los estilos globales del tema. Corrige el bug de autorización en createContenido: NO confiar en req.body.capitulo; forzar contenido.capitulo = req.user.capitulo si req.user.rol === 'director_capitulo'.

### Bloque 1 — Base de Datos (backend/config/db.js)
- Añade/modifica tablas como se detalla:
  1. Nueva tabla `capitulo_detalle` con campos: id, slug, nombre, siglas, descripcion_corta, descripcion_larga, logo_path, imagen_portada_path, color, email_contacto, link_externo, redes_json, director_id, mision, vision, fecha_fundacion, activo, updated_at.
  2. Modifica tabla `contenido`: añade slug, cuerpo, extracto, fecha_evento, lugar, autor_nombre, vistas, publicado_at.
  3. Nueva tabla `contenido_archivos`: id, contenido_id, tipo, archivo_path, nombre_original, mime_type, tamaño_bytes, orden, caption, created_at.
- Crea script de migración: backend/migrations/seed-capitulos.js para poblar capitulo_detalle desde data/capitulos.json. Ejecuta con `node backend/migrations/seed-capitulos.js`.

### Bloque 2 — API REST (backend/routes/ + controllers/)
- Crea endpoints públicos (sin auth):
  - GET /api/capitulos → lista resumen capítulos activos.
  - GET /api/capitulos/:slug → detalle capítulo + contenidos aprobados.
  - GET /api/capitulos/:slug/contenido → contenido del capítulo (filtrable por ?tipo=).
  - GET /api/contenido/:slug → detalle artículo + archivos.
  - GET /api/contenido/:slug/archivos → archivos de un contenido.
- Crea endpoints protegidos (auth + role checks):
  - PATCH /api/capitulos/:slug → editar info capítulo (director_rama: cualquier; director_capitulo: solo suyo).
  - POST /api/capitulos/:slug/logo → subir logo (multer single).
  - POST /api/capitulos/:slug/portada → subir portada.
  - POST /api/contenido/:id/archivos → subir múltiples archivos (multer.array, max 10, 10MB c/u).
  - DELETE /api/contenido/:id/archivos/:archivoId → borrar archivo.
  - PATCH /api/contenido/:id/archivos/:archivoId → editar caption/orden.
- Reglas de autorización: En createContenido y updateContenido, forzar contenido.capitulo = req.user.capitulo si rol === 'director_capitulo'.
- Validación archivos: Imágenes (jpg, jpeg, png, webp, gif, max 5MB); documentos (pdf, docx, xlsx, pptx, max 10MB). Sanitiza nombres con path.basename() y reemplaza caracteres no [a-zA-Z0-9._-]. Genera slug único en createContenido (slugify + suffix numérico).

### Bloque 3 — Páginas Públicas Nuevas
- Crea capitulo-detalle.html: URL /capitulo-detalle.html?slug=wie. Lee ?slug=, llama GET /api/capitulos/:slug. Layout: Hero con portada/logo/nombre/siglas; "Sobre nosotros" (descripcion_larga); Tabs: Noticias/Proyectos/Eventos; Sidebar: misión/visión/redes/contacto/director. Cards linkean a contenido-detalle.html?slug=xxx. Botón "Editar" si permisos.
- Crea contenido-detalle.html: URL /contenido-detalle.html?slug=primer-evento-2026. Llama GET /api/contenido/:slug. Layout: Breadcrumb; Header con badges/tipo/capitúlo/fecha/autor; Imagen destacada; Cuerpo (HTML sanitizado); Galería imágenes (lightbox); Documentos adjuntos; Para eventos: fecha/lugar/botón ICS. Botón compartir; Incrementa vistas.
- Modifica capitulos.html: Botón "Más información" → capitulo-detalle.html?slug=<slug>; Botón "Editar" si autenticado.
- Modifica noticias.html, proyectos.html, concursos.html: Cards linkean a contenido-detalle.html?slug=<slug>; Muestra extracto en card, cuerpo en detalle.

### Bloque 4 — Panel Admin
- Modifica admin/dashboard.html y admin/admin.js: Nueva sección "Mis Capítulos"/"Capítulos". Modal con formulario: nombre/siglas/descripciones/color/email/mision/vision/fecha/redes; File pickers para logo/portada; PATCH /api/capitulos/:slug + POST logo/portada.
- Editor de artículos: Layout 2 columnas. Izq: Tipo/título/slug/capitúlo/extracto/fecha/imagen destacada (para eventos: fecha_evento/lugar). Der: Editor WYSIWYG (TinyMCE/Quill/EasyMDE). Abajo: Drag-and-drop adjuntos (imágenes/PDFs); Lista con thumbnail/caption/reordenar/eliminar. Botones: Guardar borrador/Enviar revisión/Publicar.
- Vista aprobaciones: Abre editor en modo read-only; Botones aprobar/rechazar con comentario.

### Bloque 5 — Ruteo y Navegación
- Usa query params (?slug=xxx) para simplicidad. Actualiza enlaces en index.html, capitulos.html, etc., para apuntar a nuevos detalles. Nota TODO para URLs limpias (/capitulos/wie) si se añade servidor.

### Bloque 6 — Dependencias
- Añade a backend/package.json: slugify, dompurify + jsdom, marked.
- Frontend (CDN): DOMPurify, Quill/EasyMDE. Sin bundlers.

### Bloque 7 — UX y Detalles
- Mantén paleta azul IEEE + blanco. Hereda variables CSS :root.
- Archivos subidos: backend/uploads/capitulos/logos/, uploads/capitulos/portadas/, uploads/contenido/<id>/imagenes/, uploads/contenido/<id>/documentos/.
- Lazy-load imágenes; Skeleton loaders; Manejo errores 404; No duplicar imagen destacada en galería.

### Entregables
Implementa en orden, commit por bloque. Smoke test: Crear capítulo desde admin → Crear noticia con 3 imágenes + 1 PDF → Ver en frontend → Aprobar → Confirmar en página capítulo. Si hay conflictos con bug autorización, corrígelo en Bloque 2.

## Estado Actual del Proyecto
- Terminales activos: pwsh en backend/, Cline en raíz.
- Último comando: git status (falló por no tener repo git).
- Servidor corriendo en http://127.0.0.1:8000/admin/login.html.
- No se han implementado cambios aún; esperando implementación paso a paso.

## Memoria del Usuario y Sesión
- No hay memoria de usuario guardada.
- Memoria de sesión vacía.
- Memoria de repo vacía.

Este archivo contiene el contexto completo para continuar con el desarrollo. Usa este documento como referencia para implementar los bloques en orden.