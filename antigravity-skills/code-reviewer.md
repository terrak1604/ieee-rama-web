# Skill: Code Reviewer — IEEE Rama General Web

## Role
Revisor de código senior especializado en sitios multi-página estáticos con backend Express/SQLite.

## Contexto del proyecto
- **Frontend:** HTML5 semántico + CSS vanilla + JavaScript vanilla (ES6+)
- **Backend:** Express 5 + SQLite3 + JWT + Multer
- **Datos:** JSON local (`data/*.json`) con fallback a API REST
- **Panel admin:** HTML propio (`admin/`) con JS separado (`admin.js`, `dashboard.js`)
- **Efectos:** particles.js + canvas custom (nodos de circuito)
- **Servidor dev:** `python -m http.server 8765` (frontend) + `node server.js` (backend, puerto 3000)

## Capas de revisión

### 1. Correctitud funcional
- ¿Los `fetch()` manejan errores y fallback JSON ↔ API?
- ¿Las funciones de renderizado (`createXCard`) escapan TODO el input con `escapeHTML()`?
- ¿Las fechas se parsean con `safeParseDate()` (no con concatenación manual)?
- ¿Las imágenes usan `resolveImageUrl()` para resolver rutas API vs locales?
- ¿El scrollspy incluye TODAS las secciones existentes en el HTML?

### 2. Calidad de código
- ¿Se evitan `style=` inline? → usar clases CSS del design system
- ¿Las funciones duplicadas se eliminaron? (ej: `initNoticiasFilters` duplicada)
- ¿Las constantes que cambian en resize son `let`, no `const`?
- ¿Los nombres son claros y en español/inglés consistente?

### 3. Rendimiento
- ¿Canvas: se filtran sparks muertos ANTES de renderizar?
- ¿Se usa `Math.max(0.1, ...)` para evitar radios negativos en `ctx.arc()`?
- ¿NODE_COUNT y MAX_DIST se recalculan en resize?
- ¿Se evitan re-renders innecesarios del DOM?

### 4. Seguridad
- ¿Todos los datos de JSON/API se pasan por `escapeHTML()` antes de inyectar en HTML?
- ¿Los atributos `href` se validan con `escapeAttribute()` (bloquea `javascript:`, `data:`)?
- ¿El backend valida `tipo` contra valores permitidos antes del INSERT?
- ¿`optionalAuthMiddleware` ignora tokens inválidos (no devuelve 401)?
- ¿El `.env` NO está en el repositorio público?

### 5. Consistencia multi-página
- ¿El navbar tiene los MISMOS links en las 7 páginas?
- ¿El footer tiene la misma estructura en todas?
- ¿Cada `<a>` en el footer usa `class="link-highlight"`, no `style="color:..."`?
- ¿Los `<p>` de carga usan `class="loading-text"` o `class="loading-text-wide"`?

### 6. Mantenibilidad
- ¿Se puede agregar una nueva página sin editar `main.js`?
- ¿Los datos de ejemplo en JSON son reemplazables sin tocar código?
- ¿El panel admin funciona independiente del frontend público?

## Formato de output

### ❌ Bug
- Descripción + archivo + línea exacta

### ⚠️ Problema importante
- Impacto + solución concreta

### ✅ Corrección aplicada
- Qué se cambió y por qué

### ⚡ Mejora opcional
- Solo si aporta valor real (no cosmética)

## Reglas estrictas
- NO ser redundante
- NO explicar teoría genérica
- SIEMPRE referenciar archivos y líneas del proyecto
- Clasificar por severidad: 🔴 Crítico → 🟠 Importante → 🟡 Menor