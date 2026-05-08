# Skill: Backend Architect — IEEE Rama General Web

## Role
Arquitecto backend enfocado en el sistema Express + SQLite para administración de contenido IEEE.

## Stack del backend
- **Runtime:** Node.js con Express 5
- **Base de datos:** SQLite3 (archivo `database.sqlite`)
- **Auth:** JWT (jsonwebtoken) con bcrypt
- **Uploads:** Multer (imágenes ≤5MB)
- **CORS:** Orígenes configurados en `.env`

## Arquitectura actual

```
backend/
├── server.js              ← entrada, middleware, rutas
├── config/db.js           ← conexión SQLite + schema init
├── middleware/auth.js      ← authMiddleware, optionalAuth, roleMiddleware
├── routes/
│   ├── auth.js            ← login, register, users, password
│   ├── contenido.js       ← CRUD noticias/proyectos/eventos
│   └── galeria.js         ← upload/get fotos
├── controllers/
│   ├── authController.js  ← lógica de auth
│   └── contenidoController.js ← lógica de contenido
├── seed.js                ← datos de prueba
├── .env                   ← PORT, JWT_SECRET, DB_PATH
└── uploads/               ← archivos subidos
```

## Schema de base de datos (SQLite)

```sql
usuarios (id, nombre, email, password, rol, capitulo, created_at)
  → rol: 'director_rama' | 'director_capitulo'

contenido (id, tipo, titulo, descripcion, autor_id, capitulo, estado,
           imagen_path, link, categoria, fecha_evento, lugar, created_at, updated_at)
  → tipo: 'noticia' | 'proyecto' | 'evento'
  → estado: 'borrador' | 'pendiente_aprobacion' | 'aprobado' | 'rechazado'

galeria_fotos (id, capitulo, path, evento, created_at)

archivos (id, contenido_id, nombre_original, path, tipo, tamanio, created_at)

aprobaciones (id, contenido_id, aprobado_por, comentario, accion, created_at)
```

## Flujo de autorización
1. **director_capitulo** crea contenido → estado = `pendiente_aprobacion`
2. **director_rama** crea contenido → estado = `aprobado` (directo)
3. **director_rama** aprueba/rechaza contenido pendiente
4. Solo el autor puede editar/eliminar su contenido
5. Visitantes anónimos solo ven contenido `aprobado`

## API Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | ❌ | Login con email/password |
| POST | `/api/auth/register` | 🔒 rama | Crear usuario |
| GET | `/api/auth/users` | 🔒 rama | Listar usuarios |
| PATCH | `/api/auth/users/:id/password` | 🔒 rama | Cambiar contraseña |
| GET | `/api/contenido` | ⭕ optional | Listar contenido (filtros: tipo, estado, capitulo) |
| POST | `/api/contenido` | 🔒 auth | Crear contenido (multipart) |
| PATCH | `/api/contenido/:id` | 🔒 autor | Editar contenido |
| DELETE | `/api/contenido/:id` | 🔒 autor | Eliminar contenido |
| POST | `/api/contenido/:id/aprobar` | 🔒 rama | Aprobar contenido |
| POST | `/api/contenido/:id/rechazar` | 🔒 rama | Rechazar contenido |
| GET | `/api/galeria` | ❌ | Listar fotos |
| POST | `/api/galeria` | 🔒 auth | Subir fotos (max 20) |

## Reglas de seguridad
- JWT_SECRET DEBE cambiarse en producción (middleware lo valida)
- `.env` NUNCA debe subirse al repo
- Uploads: solo `image/*`, máx 5MB, nombres sanitizados
- Paths de upload: usar `path.join(__dirname, ...)`, no relativos al CWD
- `optionalAuthMiddleware`: token inválido → continuar como anónimo (NO 401)
- Validar `tipo` contra valores permitidos ANTES del INSERT

## Reglas de diseño API
- Siempre responder JSON con `{ error: "..." }` o `{ message: "..." }`
- Status codes correctos: 200, 201, 400, 401, 403, 404, 500
- Queries parametrizadas (nunca concatenar SQL)
- `contenido` público: SIEMPRE filtrar `estado = 'aprobado'` para anónimos

## Auto-check
- [ ] ¿Las rutas de uploads usan `path.join(__dirname, ...)`?
- [ ] ¿El middleware optional NO devuelve 401 en tokens inválidos?
- [ ] ¿Se valida `tipo` antes del INSERT?
- [ ] ¿El `.env` está en `.gitignore`?
- [ ] ¿Los errores NO filtran información sensible?