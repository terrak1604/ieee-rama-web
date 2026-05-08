# Skill: Deploy & DevOps — IEEE Rama General Web

## Role
Ingeniero DevOps enfocado en despliegue de sitios estáticos con backend Node.js ligero.

## Entorno de desarrollo

### Frontend (servidor estático)
```bash
cd IEEE_Rama_General_Web
python -m http.server 8765
# → http://localhost:8765
```

### Backend (API + admin)
```bash
cd IEEE_Rama_General_Web/backend
npm install
node server.js
# → http://localhost:3000
```

### Variables de entorno (`backend/.env`)
```env
PORT=3000
JWT_SECRET=cambiar_en_produccion_AHORA
DB_PATH=./database.sqlite
```

## Checklist pre-deploy

### Seguridad
- [ ] Cambiar `JWT_SECRET` a un valor aleatorio fuerte (32+ chars)
- [ ] Verificar que `.env` esté en `.gitignore`
- [ ] Verificar que `database.sqlite` esté en `.gitignore`
- [ ] Verificar que `uploads/` no tenga archivos sensibles
- [ ] Remover hints de desarrollo ("Editar en data/...", "Editar contenido en...")

### Configuración
- [ ] Actualizar `API_BASE_URL` en `main.js` al dominio real
- [ ] Actualizar `UPLOADS_BASE_URL` (se auto-deriva de API_BASE_URL)
- [ ] Configurar CORS en `server.js` para el dominio real
- [ ] Configurar Formspree ID real en `contacto.html`

### Contenido real
- [ ] Reemplazar logo texto por imagen real (`images/logo-ieee.png`)
- [ ] Actualizar links de redes sociales (Facebook, Instagram, LinkedIn)
- [ ] Actualizar email de contacto en footer
- [ ] Reemplazar datos de ejemplo en JSONs por info real
- [ ] Subir fotos reales a galería

### Backend
- [ ] Ejecutar `node seed.js` solo si necesitas datos de prueba
- [ ] Crear usuario director_rama real
- [ ] Backup de `database.sqlite` antes de deploy

## Opciones de hosting

### Frontend estático
| Servicio | Gratis | Custom domain | HTTPS |
|---|---|---|---|
| GitHub Pages | ✅ | ✅ | ✅ |
| Netlify | ✅ | ✅ | ✅ |
| Vercel | ✅ | ✅ | ✅ |

### Backend (Node.js)
| Servicio | Gratis | Persistencia |
|---|---|---|
| Railway | ✅ (trial) | SQLite persiste |
| Render | ✅ (500h/mes) | Disco efímero ⚠️ |
| Fly.io | ✅ (limitado) | Volúmenes |
| VPS (DigitalOcean) | ~$5/mes | Total control |

> ⚠️ SQLite en Render pierde datos en cada deploy. Para producción real,
> migrar a PostgreSQL o usar Railway/Fly.io con volumen persistente.

## Estructura para deploy en GitHub Pages (solo frontend)
```bash
# El frontend es estático, funciona sin backend
# Los datos se cargan desde data/*.json como fallback
git init
git add .
git commit -m "Deploy IEEE Rama Web"
git remote add origin https://github.com/tu-org/ieee-rama-web.git
git push -u origin main
# Activar GitHub Pages en Settings → Pages → main branch
```

## Auto-check
- [ ] ¿El sitio funciona SIN el backend (fallback JSON)?
- [ ] ¿Las URLs de API apuntan al servidor correcto?
- [ ] ¿Los uploads persisten entre deploys?
- [ ] ¿Se cambió el JWT_SECRET?
