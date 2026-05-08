# Skill: Admin Panel — IEEE Rama General Web

## Role
Desarrollador del panel de administración con auth JWT y gestión de contenido.

## Stack del admin
- **HTML:** `admin/login.html`, `admin/dashboard.html`
- **CSS:** `admin/admin-styles.css` (design system propio dark)
- **JS:** `admin/admin.js` (auth + helpers), `admin/dashboard.js` (tabs + CRUD)
- **API:** Todos los endpoints en `http://localhost:3000/api/`

## Flujo de autenticación
```
login.html → POST /api/auth/login → JWT token
  ↓
localStorage: { token, user: { id, nombre, email, rol, capitulo } }
  ↓
dashboard.html → verifica token → muestra menú según rol
```

## Roles y permisos

### director_capitulo
- ✅ Crear noticia, proyecto, evento (estado → `pendiente_aprobacion`)
- ✅ Ver "Mi Contenido"
- ✅ Subir fotos a galería
- ❌ Aprobar/rechazar contenido
- ❌ Crear cuentas

### director_rama
- ✅ Crear noticia (estado → `aprobado` directo)
- ✅ Aprobar/rechazar contenido pendiente
- ✅ Ver contenido publicado
- ✅ Crear/gestionar cuentas
- ✅ Subir fotos a galería

## Estructura de tabs del dashboard
| Tab | ID | Visible para |
|---|---|---|
| Inicio | `inicio` | Todos |
| Nueva Noticia | `crear-noticia` | Todos |
| Nuevo Proyecto | `crear-proyecto` | director_capitulo |
| Nuevo Evento | `crear-evento` | director_capitulo |
| Mi Contenido | `mis-contenidos` | director_capitulo |
| Pendientes | `pendientes` | director_rama |
| Contenido Publicado | `contenido-publicado` | director_rama |
| Cuentas | `cuentas` | director_rama |
| Subir Galería | `subir-galeria` | Todos |

## Funciones clave en admin.js
```javascript
getToken()          // Lee JWT de localStorage
getUser()           // Lee datos del usuario
isLoggedIn()        // Verifica si hay sesión válida
showStatus(id, msg, type)  // Muestra feedback (success/error)
                           // Usa classList.add/remove('hidden')
escapeHTML(str)     // Sanitiza output
```

## Funciones clave en dashboard.js
```javascript
initDashboard()        // Configura menús según rol
cargarMisContenidos()  // GET /api/contenido?autor_id=X
cargarPendientes()     // GET /api/contenido?estado=pendiente_aprobacion
cargarPublicado()      // GET /api/contenido?estado=aprobado
cargarUsuarios()       // GET /api/auth/users
handleAprobacion(id)   // POST /api/contenido/:id/aprobar|rechazar
```

## Formularios de creación

### Noticia
Campos: título*, categoría* (select), descripción*, imagen (file), link

### Proyecto
Campos: nombre*, integrantes*, descripción*, imagen (file), link repositorio

### Evento
Campos: título*, fecha* (datetime), lugar*, descripción*, imagen (file), link registro

### Galería
Campos: capítulo (opcional), evento (opcional), fotos* (file multiple, max 20)

## Convenciones CSS del admin
- Clases utilitarias: `.hidden`, `.sidebar-divider`, `.empty-state`, `.error-text`
- Estados: `.status-message.success`, `.status-message.error`
- No usar `style="display:none"` → usar clase `.hidden`
- Toggle: `element.classList.add/remove('hidden')`

## Auto-check
- [ ] ¿Los menús se muestran según el rol correcto?
- [ ] ¿Se usa `classList` en vez de `style.display`?
- [ ] ¿Los formularios envían FormData (para archivos)?
- [ ] ¿Se muestra feedback después de cada acción?
- [ ] ¿El token se envía en header `Authorization: Bearer ...`?
