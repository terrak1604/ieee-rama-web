# IEEE Rama Estudiantil UNMSM – Sitio Web

> Portal oficial de proyectos, capítulos y actividades de la Rama Estudiantil IEEE  
> Universidad Nacional Mayor de San Marcos · Lima, Perú

---

## 📁 Estructura del Proyecto

```
IEEE_Rama_General_Web/
├── index.html              ← Página principal
├── changelog.md            ← Registro de cambios
├── README.md               ← Este archivo
│
├── css/
│   └── style.css           ← Estilos principales (NO modificar a menos que sepas CSS)
│
├── js/
│   └── main.js             ← JavaScript: carga datos JSON, partículas, animaciones
│
├── data/                   ← ⭐ ARCHIVOS QUE EDITARÁS MÁS SEGUIDO
│   ├── capitulos.json      ← Los 16 capítulos IEEE (nombre, descripción, color, etc.)
│   ├── noticias.json       ← Noticias y anuncios (editar aquí para agregar nuevas)
│   └── concursos.json      ← Convocatorias y concursos (editar aquí)
│
└── images/
    ├── logo-ieee.png       ← REEMPLAZAR con el logo oficial IEEE UNMSM
    ├── favicon.png         ← REEMPLAZAR con el favicon
    ├── hero/               ← Imágenes de la sección principal
    │   └── foto-principal.jpg
    ├── capitulos/          ← Una imagen por capítulo (ej: wie.jpg, ras.jpg, cs.jpg...)
    ├── noticias/           ← Imágenes de las noticias
    └── galeria/            ← Fotos para la galería
```

---

## 🚀 Cómo usar el sitio

### Ver el sitio
Abre `index.html` directamente en tu navegador (doble clic).

> **Nota:** Para que las noticias y capítulos carguen correctamente, necesitas un servidor local.  
> Usa la extensión **Live Server** de VS Code, o ejecuta:
> ```
> python -m http.server 8000
> ```
> Luego abre: http://localhost:8000

---

## ✏️ Cómo agregar una noticia

Abre `data/noticias.json` y agrega un nuevo objeto al arreglo:

```json
{
  "id": 6,
  "titulo": "Nombre de tu noticia",
  "fecha": "2026-06-01",
  "categoria": "evento",
  "descripcion": "Descripción breve de la noticia.",
  "imagen": "images/noticias/mi-imagen.jpg",
  "link": "#",
  "destacado": false
}
```

**Categorías disponibles:** `convocatoria`, `evento`, `charla`, `programa`, `actividad`  
**Destacado:** Pon `true` en UNA sola noticia para que aparezca grande.

---

## 🏆 Cómo agregar un concurso

Abre `data/concursos.json` y agrega:

```json
{
  "id": 4,
  "titulo": "Nombre del concurso",
  "convocatoria": "Abierta",
  "fechaLimite": "2026-08-31",
  "descripcion": "Descripción del concurso.",
  "requisitos": "Ser miembro IEEE activo.",
  "link": "https://tu-link.com",
  "bases": "https://bases-del-concurso.com",
  "capitulo": "Rama General"
}
```

---

## 🖼️ Cómo agregar imágenes

| Tipo | Carpeta | Nombre |
|------|---------|--------|
| Logo IEEE | `images/` | `logo-ieee.png` |
| Foto hero | `images/hero/` | `foto-principal.jpg` |
| Foto capítulo WIE | `images/capitulos/` | `wie.jpg` |
| Foto capítulo RAS | `images/capitulos/` | `ras.jpg` |
| Foto capítulo CS | `images/capitulos/` | `cs.jpg` |
| Noticia | `images/noticias/` | `nombre-noticia.jpg` |
| Galería | `images/galeria/` | `foto-evento.jpg` |

Los **IDs de las imágenes de capítulos** son: `wie`, `ras`, `embs`, `pes`, `ias`, `cs`, `comsoc`, `tems`, `aess`, `aps`, `cis`, `npss`, `eds`, `sight`, `sps`, `cas`

---

## 📱 Redes Sociales

Edita los links en **dos lugares** del archivo `index.html`:
1. En el `<nav>` (parte superior)
2. En el `<footer>` (parte inferior)

Busca los comentarios `<!-- edita los href -->` en el HTML.

---

## 🎨 Colores IEEE (referencia)

| Color | Código |
|-------|--------|
| Azul IEEE principal | `#00629b` |
| Azul IEEE oscuro | `#002855` |
| Azul claro / acento | `#0099d6` |
| Dorado IEEE | `#f0b429` |

---

## 📋 Registro de cambios

Ver `changelog.md` para el historial de modificaciones.

---

*Desarrollado para IEEE Rama Estudiantil UNMSM · Lima, Perú · 2026*
