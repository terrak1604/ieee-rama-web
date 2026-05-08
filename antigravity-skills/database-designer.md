# Skill: Database Designer — IEEE Rama General Web

## Role
Diseñador de datos para sistema de gestión de contenido IEEE con SQLite.

## Motor
- **SQLite 3** — archivo local `database.sqlite`
- Driver: `sqlite3` para Node.js
- Inicialización automática en `config/db.js` con `CREATE TABLE IF NOT EXISTS`

## Schema actual

### `usuarios`
```sql
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,                -- bcrypt hash
  rol TEXT NOT NULL CHECK(rol IN ('director_rama', 'director_capitulo')),
  capitulo TEXT,                         -- NULL para director_rama
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `contenido`
```sql
CREATE TABLE IF NOT EXISTS contenido (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK(tipo IN ('noticia', 'proyecto', 'evento')),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  autor_id INTEGER NOT NULL,
  capitulo TEXT,
  estado TEXT DEFAULT 'borrador'
    CHECK(estado IN ('borrador', 'pendiente_aprobacion', 'aprobado', 'rechazado')),
  imagen_path TEXT,
  link TEXT,
  categoria TEXT,
  fecha_evento DATETIME,
  lugar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(autor_id) REFERENCES usuarios(id)
);
```

### `galeria_fotos`
```sql
CREATE TABLE IF NOT EXISTS galeria_fotos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  capitulo TEXT,
  path TEXT NOT NULL,
  evento TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `aprobaciones`
```sql
CREATE TABLE IF NOT EXISTS aprobaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contenido_id INTEGER NOT NULL,
  aprobado_por INTEGER NOT NULL,
  comentario TEXT,
  accion TEXT CHECK(accion IN ('aprobado', 'rechazado')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(contenido_id) REFERENCES contenido(id),
  FOREIGN KEY(aprobado_por) REFERENCES usuarios(id)
);
```

## Relaciones
```
usuarios 1──N contenido    (autor_id → usuarios.id)
usuarios 1──N aprobaciones (aprobado_por → usuarios.id)
contenido 1──N aprobaciones (contenido_id → contenido.id)
contenido 1──N archivos    (contenido_id → contenido.id)
```

## Reglas de integridad
- `email` es UNIQUE en usuarios
- `rol` y `tipo` usan CHECK constraints
- `estado` tiene 4 valores válidos con default `borrador`
- Claves foráneas definidas pero SQLite NO las enforce por defecto
  → Ejecutar `PRAGMA foreign_keys = ON;` al conectar

## Queries frecuentes

### Contenido público (visitantes)
```sql
SELECT c.*, u.nombre as autor_nombre
FROM contenido c JOIN usuarios u ON c.autor_id = u.id
WHERE c.estado = 'aprobado'
ORDER BY c.created_at DESC;
```

### Contenido por tipo
```sql
-- Noticias
WHERE c.tipo = 'noticia' AND c.estado = 'aprobado'
-- Eventos/concursos
WHERE c.tipo = 'evento' AND c.estado = 'aprobado'
-- Proyectos
WHERE c.tipo = 'proyecto' AND c.estado = 'aprobado'
```

### Pendientes de aprobación
```sql
WHERE c.estado = 'pendiente_aprobacion'
ORDER BY c.created_at ASC;
```

## Mejoras pendientes
- [ ] Agregar `PRAGMA foreign_keys = ON;` en `db.js`
- [ ] Agregar índice en `contenido(tipo, estado)` para queries frecuentes
- [ ] Considerar tabla `capitulos` normalizada (actualmente es TEXT libre)
- [ ] Agregar `ON DELETE CASCADE` en `aprobaciones` → `contenido`

## Auto-check
- [ ] ¿Todas las FK tienen referencia válida?
- [ ] ¿Los CHECK constraints cubren todos los valores posibles?
- [ ] ¿Se usa parametrización (?) en todas las queries?
- [ ] ¿PRAGMA foreign_keys está habilitado?