# Contexto del Proyecto - IEEE Rama Estudiantil UNMSM

Última actualización: 2026-05-24

Este es el único documento vivo de contexto del proyecto. Consolida lo que antes estaba repartido en `README.md`, `PLAN_INTEGRACION.md`, `DEPLOY_PRODUCCION.md` y `changelog.md`.

## 1. Resumen

Portal web de la Rama Estudiantil IEEE UNMSM con frontend multi-página, backend Express/SQLite, panel administrativo con roles JWT, editor Quill, gestión por capítulos, galería con álbumes, calendario dinámico, feed RSS y preparación completa para despliegue Docker + Nginx.

Arquitectura:
- **Desarrollo local**: Express sirve frontend, admin, uploads y API desde el origin actual (soporta localhost y túneles).
- **Producción (Render)**: Despliegue automatizado como Web Service (`render.yaml`) con Node 20 y SQLite compilado nativamente. (Nota: Base de datos efímera en capa gratuita).
- **Producción (VPS/Docker)**: Nginx público en `:80/:443`, backend Node interno en Docker, SQLite y uploads en volúmenes persistentes.

---

## 2. Estado Actual (auditado 2026-05-16)

### 2.1 Frontend público — Completo

- **13 páginas HTML**: `index.html`, `capitulos.html`, `noticias.html`, `proyectos.html`, `concursos.html`, `galeria.html`, `contacto.html`, `calendario.html`, `revista.html`, `resultados.html`, `capitulo-detalle.html`, `contenido-detalle.html`, `maintenance.html`.
- Carga dinámica de datos desde API en todas las secciones.
- Skeleton loaders mientras se espera respuesta.
- Modo oscuro/claro persistente (`localStorage.theme`).
- Particles.js + canvas animado con nodos, líneas de circuito y sparks al clic.
- Responsive mobile con hamburger menu.
- Open Graph y barra de compartir en páginas de detalle.
- FAQ interactivo en `contacto.html`.
- Formulario de contacto con validación cliente y toast de resultado.
- Mapa Google Maps embebido en contacto.
- `prefers-reduced-motion` respetado en canvas.
- Breadcrumbs en páginas internas.
- **Stats "Sobre la Rama"** entre hero y capítulos en `index.html` (capítulos dinámicos desde API).
- **Paginación** en noticias (8/pág) y concursos (8/pág), compatible con filtros activos.
- **Búsqueda + filtro por capítulo** en `proyectos.html` con chips dinámicos por datos reales.
- **Calendario** con día actual resaltado, navegación prev/next y sección "Próximos Eventos" con tarjetas fecha+lugar.
- **Galería por álbumes**: chips de filtro generados automáticamente por campo `evento` si hay múltiples álbumes.
- **Feed RSS** disponible en `/api/rss`; `<link rel="alternate">` declarado en `index.html`.
- Links de redes sociales en navbar/footer cargados dinámicamente desde `site_settings` (no hardcodeados).

### 2.2 Backend / API — Completo

| Endpoint | Método | Estado |
|----------|--------|--------|
| `/api/health` | GET | ✅ Completo |
| `/api/auth/login` | POST | ✅ Completo |
| `/api/auth/register` | POST | ✅ Completo |
| `/api/auth/users` | GET | ✅ Completo |
| `/api/auth/users/:id` | PUT / DELETE | ✅ Completo |
| `/api/auth/users/:id/password` | PATCH | ✅ Completo |
| `/api/contenido` | GET/POST/PATCH/DELETE | ✅ Completo |
| `/api/contenido/:id/aprobar` | POST | ✅ Completo |
| `/api/contenido/:id/rechazar` | POST | ✅ Completo |
| `/api/contenido/:id/archivos` | POST/DELETE | ✅ Completo (captions y orden persistidos) |
| `/api/capitulos` | GET/PATCH | ✅ Completo |
| `/api/galeria` | GET/POST/DELETE | ✅ Completo |
| `/api/site-images` | GET/POST | ✅ Completo |
| `/api/site-settings` | GET/PUT | ✅ Completo (incluye maintenance, footer, hero, redes) |
| `/api/revistas` | GET/POST/PUT/DELETE | ✅ Completo |
| `/api/contacto` | POST | ✅ Completo (simulación si no hay SMTP; real con EMAIL_USER/PASS) |
| `/api/rss` | GET | ✅ Completo — RSS 2.0 de contenido aprobado con caché 15 min |

Seguridad:
- JWT con roles `director_rama` / `director_capitulo`.
- Helmet, Rate limit 200 req/15 min en `/api`.
- CORS configurable por `CORS_ORIGIN`.
- Bloqueo de rutas sensibles: `/.env`, `/database.sqlite`, `/.git`, `/backend/`.
- `director_capitulo` no puede falsificar `req.body.capitulo`.
- Limpieza de archivos huérfanos al eliminar contenido.
- **Modo mantenimiento**: middleware en `server.js` que sirve `maintenance.html` (503) cuando `site_settings.maintenance = 'true'`. Exime `/api/` y `/admin`.

Tests: **12/12 passing** (Jest + Supertest).

### 2.3 Panel admin — Completo

| Área | Estado |
|------|--------|
| Login JWT + sesión `localStorage` | ✅ Completo |
| Dashboard: stats cards + Chart.js publicaciones/mes | ✅ Completo |
| Crear noticia / proyecto / evento | ✅ Completo |
| Editor enriquecido Quill con adjuntos + autosave | ✅ Completo |
| Editar contenido existente | ✅ Completo |
| Eliminar contenido | ✅ Completo |
| Workflow aprobación: filtros + preview + comentario | ✅ Completo |
| Editor de capítulo con tabs info/imágenes/redes | ✅ Completo |
| Subir / listar / eliminar fotos de galería | ✅ Completo |
| Crear / editar / eliminar revistas | ✅ Completo |
| Gestión completa de usuarios (crear/editar/eliminar/cambiar password) | ✅ Completo |
| Configuración global: redes, email, hero text, dirección, Twitter | ✅ Completo |
| Toggle modo mantenimiento | ✅ Completo |
| Métricas de vistas por contenido en listas admin | ✅ Completo |
| Toggle de tema persistente | ✅ Completo |
| Sistema de toasts globales | ✅ Completo |

### 2.4 Datos reales — Pendientes (acción del usuario)

Los siguientes items requieren que el **usuario** los configure desde el panel admin o el servidor:

- **Redes sociales**: rellenar URLs reales en Admin → Configuración del Sitio.
- **Email institucional**: rellenar en Admin → Configuración del Sitio.
- **SMTP**: configurar `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_DIRECTOR` en `.env` (ver sección 5).
- **Favicon y logo**: reemplazar `images/favicon.png` e `images/logo-ieee.png` con archivos oficiales.
- **Dominio y VPS**: confirmar dominio final y proveedor VPS para producción.

### 2.5 Docker / Nginx — Preparado, sin verificar localmente

Docker Desktop no está instalado en el entorno local. La configuración está lista para producción pero no ha sido probada end-to-end en Docker. Pasos de verificación pendientes para el usuario:
```bash
docker compose config
docker compose up -d --build
docker compose ps
curl -i http://localhost/api/health
```

---

## 3. Estructura del Proyecto

```txt
IEEE_Rama_General_Web/
├── index.html
├── capitulos.html
├── noticias.html
├── proyectos.html
├── concursos.html
├── galeria.html
├── contacto.html
├── calendario.html
├── revista.html
├── resultados.html
├── capitulo-detalle.html
├── contenido-detalle.html
├── maintenance.html           ← página de modo mantenimiento
├── CONTEXTO_PROYECTO.md
├── .env.example               ← plantilla de variables de entorno
├── docker-compose.yml
├── nginx.conf
├── css/
│   └── style.css
├── js/
│   └── main.js
├── images/                    ← favicon.png y logo-ieee.png son placeholders
├── data/
├── scripts/
│   ├── backup.sh              ← backup SQLite + uploads con limpieza automática
│   └── deploy.sh              ← deploy automatizado: backup → pull → docker rebuild
├── admin/
│   ├── login.html
│   ├── dashboard.html
│   ├── admin.js
│   ├── dashboard.js
│   ├── admin-styles.css
│   └── js/
│       ├── admin-dashboard.js
│       └── admin-editor.js
├── backend/
│   ├── server.js
│   ├── Dockerfile
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── contenidoController.js
│   │   └── archivoController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── contenido.js
│   │   ├── capitulos.js
│   │   ├── galeria.js
│   │   ├── revistas.js
│   │   ├── siteImages.js
│   │   ├── siteSettings.js
│   │   ├── contacto.js
│   │   └── rss.js             ← feed RSS 2.0 público
│   ├── utils/
│   │   ├── editorial.js
│   │   └── mailer.js
│   ├── tests/
│   │   └── api.test.js        ← 12/12 passing
│   └── package.json
├── render.yaml                ← Configuración IaC para despliegue automático en Render
└── ssl/                       ← ignorado por git, para certificados Certbot
```

---

## 4. Comandos de Trabajo

### Desarrollo local

Windows:
```bat
start.bat
```

Unix/Mac:
```bash
./start.sh
```

Alternativa directa:
```bash
node backend/server.js
```

URLs:
```
http://localhost:3000
http://localhost:3000/admin/login.html
http://localhost:3000/api/health
http://localhost:3000/api/rss
```

Credenciales de desarrollo por defecto (seeded en BD vacía):
```
email:    admin@ieee-unmsm.org
password: admin123
rol:      director_rama
```

### Backend — Tests
```bash
cd backend
npm install
npm test -- --runInBand
```

### Docker local/staging
```bash
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs --tail=80 backend
```

---

## 5. Variables de Entorno

Copiar `.env.example` como `.env` en la raíz del proyecto y rellenar:

```env
# Seguridad
JWT_SECRET=clave-larga-aleatoria-minimo-32-chars

# Base de datos
DB_PATH=./backend/database.sqlite   # en Docker: /data/database.sqlite

# Servidor
PORT=3000
NODE_ENV=production
SITE_URL=https://ieee-unmsm.org
CORS_ORIGIN=https://ieee-unmsm.org

# Email (dejar vacío para modo simulación)
EMAIL_USER=ieee@unmsm.edu.pe
EMAIL_PASS=contrasena-de-aplicacion-gmail
EMAIL_DIRECTOR=director@unmsm.edu.pe
```

Generar JWT_SECRET:
```bash
openssl rand -base64 64
```

---

## 6. Historial de Bloques

| Bloque | Descripción | Estado |
|--------|-------------|--------|
| A | Fundación local: Express, start scripts, rutas, bloqueos sensibles | ✅ Completo |
| A.5 | Infra Docker/Nginx: nginx.conf, docker-compose, Dockerfile multi-stage | ✅ Completo |
| B | Fixes backend: autorización capítulo, limpieza huérfanos, CORS, tests Jest | ✅ Completo |
| C | Pulido visual: tokens CSS, Lucide Icons, skeleton loaders, cards 3D | ✅ Completo |
| D | Páginas de detalle: capitulo-detalle, contenido-detalle, Open Graph, compartir | ✅ Completo |
| E | Editor admin Quill: adjuntos drag-and-drop, captions, autosave | ✅ Completo |
| F | Editor capítulos: schema, PATCH, tabs info/imágenes/redes, permisos | ✅ Completo |
| G | Toasts, tema, stats dashboard, workflow aprobaciones Chart.js | ✅ Completo |
| H1 | Control total admin: editar/eliminar contenido, revistas, galería, usuarios | ✅ Completo |
| H2 | Datos reales: site_settings dinámicos (redes, email, hero, mantenimiento) | ✅ Completo |
| H3 | UX frontend: búsqueda proyectos, paginación noticias/concursos, stats Rama, calendario dinámico | ✅ Completo |
| H4 | QA: 12/12 tests, docker-compose con email vars, .env.example | ✅ Completo |
| H5 | Producción: scripts/backup.sh, scripts/deploy.sh, docker-compose actualizado | ✅ Completo |
| H6 | Fase 2: galería por álbumes, métricas vistas admin, modo mantenimiento, RSS | ✅ Completo |
| H7 | Despliegue PaaS: Configuración `render.yaml`, Node v20, UI animada en inicio, URLs dinámicas | ✅ Completo |

---

## 7. Deploy a Producción

El proyecto ofrece dos vías principales de despliegue:

### Vía 1: Render (PaaS Gratuito/Pago)
Ideal para pruebas iniciales o producción sin gestionar servidores.
- Conectar repositorio a **Render** como *Web Service*.
- El archivo `render.yaml` pre-configura todo: `NODE_VERSION=20`, `--build-from-source=sqlite3` (para arreglar incompatibilidad GLIBC), y lanza `node reset-admin.js` automáticamente.
- **Advertencia en Free Tier**: El disco es efímero. SQLite se borrará al reiniciar. Usar capa de pago (Disk) o DB externa para permanencia.
- Definir entorno: `JWT_SECRET` manualmente en el dashboard.

### Vía 2: VPS Propio con Docker (Recomendado para datos locales)
### Requisitos
- VPS Ubuntu 22.04/24.04, mínimo 1 GB RAM.
- Docker y Docker Compose instalados.
- Dominio con acceso DNS.
- Puertos `80` y `443` abiertos.

### Pasos completos

**1. Preparar VPS**
```bash
sudo apt update && sudo apt install -y ca-certificates curl git ufw
# Instalar Docker (ver docs.docker.com)
sudo usermod -aG docker $USER
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw --force enable
```

**2. Clonar y configurar**
```bash
git clone <URL_DEL_REPO> && cd IEEE_Rama_General_Web
cp .env.example .env
nano .env  # Rellenar JWT_SECRET, CORS_ORIGIN, emails, etc.
```

**3. Primer deploy**
```bash
./scripts/deploy.sh
```
O manualmente:
```bash
docker compose up -d --build
```

**4. HTTPS con Certbot**
```bash
sudo apt install -y certbot
docker compose stop frontend
sudo certbot certonly --standalone -d ieee-unmsm.org -d www.ieee-unmsm.org
sudo mkdir -p ssl
sudo cp -L /etc/letsencrypt/live/ieee-unmsm.org/fullchain.pem ssl/fullchain.pem
sudo cp -L /etc/letsencrypt/live/ieee-unmsm.org/privkey.pem ssl/privkey.pem
sudo chown -R "$USER":"$USER" ssl
docker compose up -d
```
Después activar bloque `443` y redirect `80 → 443` en `nginx.conf`.

**5. Backups automáticos (cron diario a las 3:20 AM)**
```bash
chmod +x scripts/backup.sh
(crontab -l 2>/dev/null; echo "20 3 * * * cd $(pwd) && ./scripts/backup.sh >> ./backups/backup.log 2>&1") | crontab -
```

**6. Monitoreo**
- Configurar UptimeRobot o similar apuntando a `https://ieee-unmsm.org/api/health`.
- Keyword esperada: `"status"`.

**7. Deploys posteriores**
```bash
./scripts/deploy.sh
```
El script hace backup → git pull → docker rebuild → healthcheck automático.

---

## 8. Decisiones Técnicas

| Decisión | Elección | Razón |
|----------|----------|-------|
| Servidor producción | Nginx + Node en Docker | Separación de responsabilidades, escalabilidad |
| Servidor desarrollo | Express unificado `:3000` | Simplicidad de arranque |
| WYSIWYG | Quill | Ligero, extensible, sin dependencias pesadas |
| Iconografía | Lucide Icons CDN + Phosphor Icons | Libre, SVG puro, fácil de reemplazar |
| Base de datos | SQLite | Suficiente para el volumen esperado; sin coste de servidor |
| Configuración global | Tabla `site_settings` clave/valor en SQLite | Editable desde admin sin tocar HTML |
| Autenticación | JWT + localStorage | Simple, sin cookies, roles nativos |
| Búsqueda | Filtrado client-side | Los datasets son pequeños; sin coste de endpoint extra |
| Paginación | Client-side (8/pág) | Consistente con el filtrado client-side ya implementado |
| RSS | Endpoint Express propio | Sin dependencias extra; cacheable con headers HTTP |
| Modo mantenimiento | Middleware Express + página HTML estática | Activa/desactiva desde admin sin reiniciar el servidor |
| Galería álbumes | Agrupación por campo `evento` | Sin migración de BD; retrocompatible con datos existentes |
| SMTP | Nodemailer + Gmail App Password | Cero coste; modo simulación si no está configurado |

---

## 9. Pendiente solo para el usuario

El portal está **feature-complete**. Lo único que queda es configuración y datos reales:

1. **Rellenar datos en panel admin** (`/admin/login.html`):
   - Redes sociales (Facebook, Instagram, LinkedIn, Twitter, WhatsApp)
   - Email institucional y dirección postal
   - Texto principal del hero
   - Subir imágenes del hero y logo oficial

2. **Configurar SMTP** en `.env` (EMAIL_USER, EMAIL_PASS, EMAIL_DIRECTOR) para que el formulario de contacto envíe correos reales.

3. **Reemplazar imágenes placeholder**:
   - `images/favicon.png` → logo IEEE real
   - `images/logo-ieee.png` → logo oficial para navbar

4. **Deploy a producción** siguiendo los pasos de la sección 7.

5. **Verificar Docker end-to-end** (requiere Docker instalado en la máquina de trabajo o en VPS):
   ```bash
   docker compose config
   docker compose up -d --build
   curl -i http://localhost/api/health
   ```
