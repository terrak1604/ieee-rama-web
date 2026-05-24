/**
 * Fix script for IEEE UNMSM Portal image rendering bugs
 * Run with: node fix_images.js
 */
const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, 'js', 'main.js');
const dashboardJsPath = path.join(__dirname, 'admin', 'dashboard.js');
const dashboardHtmlPath = path.join(__dirname, 'admin', 'dashboard.html');
const styleCssPath = path.join(__dirname, 'css', 'style.css');

// ─── Fix 1: main.js — createCapituloCard show logo ───────────────────────────
let mainJs = fs.readFileSync(mainJsPath, 'utf8');

// Replace old placeholder-only cap card with logo-aware version
const oldCapCard = `  return \`
  <div class="capitulo-card" data-cap="\${id}">
    <div class="cap-img-wrapper" style="border-top: 3px solid \${color}">
      <div class="cap-placeholder" style="background: linear-gradient(135deg, rgba(0,20,45,0.9), \${color}18)">
        <span class="cap-icon">\${icono}</span>
        <span class="cap-placeholder-text">Agregar imagen en images/capitulos/\${id}.jpg</span>
      </div>
      <span class="cap-siglas-badge" style="border-color:\${color};color:\${color}">\${siglas}</span>
    </div>
    <div class="cap-body">
      <h3 class="cap-nombre">\${nombre}</h3>
      <p class="cap-desc">\${descripcion}</p>
      <a href="\${link}" class="cap-link">
        M\\u00e1s informaci\\u00f3n <span>\\u2192</span>
      </a>
    </div>
  </div>\`;
}`;

const newCapCard = `  const imgHtml = logoUrl
    ? '<img src="' + escapeAttribute(logoUrl) + '" alt="Logo ' + siglas + '" loading="lazy" onerror="this.style.display=\\'none\\';this.nextElementSibling.style.display=\\'flex\\'">' +
      '<div class="cap-placeholder" style="display:none;background:linear-gradient(135deg,rgba(0,20,45,0.9),' + color + '18)"><span class="cap-icon">' + icono + '</span></div>'
    : '<div class="cap-placeholder" style="background:linear-gradient(135deg,rgba(0,20,45,0.9),' + color + '18)"><span class="cap-icon">' + icono + '</span></div>';

  return '<div class="capitulo-card" data-cap="' + id + '">' +
    '<div class="cap-img-wrapper" style="border-top:3px solid ' + color + '">' +
      imgHtml +
      '<span class="cap-siglas-badge" style="border-color:' + color + ';color:' + color + '">' + siglas + '</span>' +
    '</div>' +
    '<div class="cap-body">' +
      '<h3 class="cap-nombre">' + nombre + '</h3>' +
      '<p class="cap-desc">' + descripcion + '</p>' +
      '<a href="' + link + '" class="cap-link">M\\u00e1s informaci\\u00f3n <span>\\u2192</span></a>' +
    '</div>' +
  '</div>';
}`;

if (mainJs.includes(oldCapCard)) {
  mainJs = mainJs.replace(oldCapCard, newCapCard);
  console.log('✅ Fixed createCapituloCard');
} else {
  console.log('⚠️  createCapituloCard old pattern not found — may already be fixed or different whitespace');
}

// ─── Fix 2: main.js — createProyectoCard img placeholder ──────────────────────
const oldProyImg = `      \${imgUrl ? \`<img src="\${escapeAttribute(imgUrl)}" alt="\${titulo}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">\` : ''}
      <div class="img-placeholder" style="\${imgUrl ? 'display:none' : ''}">
        <span class="img-icon"><i class="ph-fill ph-rocket-launch"></i></span>
        <span class="img-text">Proyecto: \${titulo}</span>
      </div>`;

// If not already fixed, fix old double-class version
const oldProyImgV1 = `      \${imgUrl ? \`<img src="\${escapeAttribute(imgUrl)}" alt="\${titulo}" onerror="this.src='\${IEEE_FALLBACK_IMAGE}'">\` : ''}
      <div class="img-placeholder" \${imgUrl ? 'class="img-placeholder img-placeholder-hidden"' : 'class="img-placeholder"'}>
        <span class="img-icon"><i class="ph-fill ph-rocket-launch"></i></span>
        <span class="img-text">Proyecto: \${titulo}</span>
      </div>`;

if (!mainJs.includes(oldProyImg) && mainJs.includes(oldProyImgV1)) {
  mainJs = mainJs.replace(oldProyImgV1, oldProyImg);
  console.log('✅ Fixed createProyectoCard image placeholder');
} else if (mainJs.includes(oldProyImg)) {
  console.log('✅ createProyectoCard already fixed');
} else {
  console.log('⚠️  createProyectoCard pattern not found');
}

// ─── Fix 3: main.js — createNoticiaCard img placeholder ───────────────────────
const oldNoticiaImg = `      \${imgUrl ? \`<img src="\${escapeAttribute(imgUrl)}" alt="\${titulo}" onerror="this.src='\${IEEE_FALLBACK_IMAGE}'">\` : ''}
      <div class="img-placeholder" \${imgUrl ? 'class="img-placeholder img-placeholder-hidden"' : 'class="img-placeholder"'}>
        <span class="img-icon"><i class="ph-fill ph-image"></i></span>
        <span class="img-text">\${titulo}</span>
      </div>`;

const newNoticiaImg = `      \${imgUrl ? \`<img src="\${escapeAttribute(imgUrl)}" alt="\${titulo}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">\` : ''}
      <div class="img-placeholder" style="\${imgUrl ? 'display:none' : ''}">
        <span class="img-icon"><i class="ph-fill ph-image"></i></span>
        <span class="img-text">\${titulo}</span>
      </div>`;

if (mainJs.includes(oldNoticiaImg)) {
  mainJs = mainJs.replace(oldNoticiaImg, newNoticiaImg);
  console.log('✅ Fixed createNoticiaCard image placeholder');
} else {
  console.log('⚠️  createNoticiaCard pattern not found — check manually');
}

fs.writeFileSync(mainJsPath, mainJs, 'utf8');
console.log('✅ main.js saved');

// ─── Fix 4: dashboard.js — Replace prompt() with modal for password ────────────
let dashJs = fs.readFileSync(dashboardJsPath, 'utf8');

const oldPwd = `async function handleResetPassword(usuarioId) {
  const password = prompt('Nueva contraseña para este usuario (mínimo 6 caracteres):');

  if (password === null) return;
  if (password.length < 6) {
    toast('La contraseña debe tener al menos 6 caracteres.', 'error');
    return;
  }

  try {
    await updateUsuarioPassword(usuarioId, password);
    toast('Contraseña actualizada correctamente', 'success');
  } catch (err) {
    toast(\`Error: \${err.message}\`, 'error');
  }
}`;

const newPwd = `async function handleResetPassword(usuarioId) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmModalTitle');
    const msgEl = document.getElementById('confirmModalMessage');
    const acceptBtn = document.getElementById('confirmModalAcceptBtn');
    const cancelBtn = document.getElementById('confirmModalCancelBtn');

    titleEl.textContent = 'Cambiar Contraseña';
    msgEl.innerHTML =
      '<div style="text-align:left;margin-bottom:8px;">' +
        '<label for="_pwdInput" style="display:block;margin-bottom:6px;font-size:0.85rem;font-weight:600;">Nueva contraseña (mín. 6 caracteres)</label>' +
        '<input id="_pwdInput" type="password" style="width:100%;padding:8px 12px;border:1px solid var(--border-card);border-radius:6px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;" placeholder="Nueva contraseña" autocomplete="new-password">' +
      '</div>';
    acceptBtn.textContent = 'Cambiar clave';
    acceptBtn.className = 'btn-primary';

    modal.classList.remove('hidden');
    setTimeout(() => { const el = document.getElementById('_pwdInput'); if (el) el.focus(); }, 80);

    const cleanup = () => {
      modal.classList.add('hidden');
      msgEl.textContent = '¿Estás seguro?';
      titleEl.textContent = 'Confirmar Acción';
      acceptBtn.textContent = 'Aceptar';
      acceptBtn.className = 'btn-primary danger';
      acceptBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    acceptBtn.onclick = async () => {
      const el = document.getElementById('_pwdInput');
      const pwd = el ? el.value : '';
      if (pwd.length < 6) {
        toast('La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
      }
      cleanup();
      try {
        await updateUsuarioPassword(usuarioId, pwd);
        toast('Contraseña actualizada correctamente', 'success');
      } catch (err) {
        toast(\`Error: \${err.message}\`, 'error');
      }
      resolve();
    };
    cancelBtn.onclick = () => { cleanup(); resolve(); };
  });
}`;

if (dashJs.includes(oldPwd)) {
  dashJs = dashJs.replace(oldPwd, newPwd);
  console.log('✅ Fixed handleResetPassword (no more prompt)');
} else {
  console.log('⚠️  handleResetPassword old pattern not found');
}

// ─── Fix 5: dashboard.js — handleEditUsuario button setup ─────────────────────
// The edit button works via onclick attribute in the HTML, setupUserEditModal handles submit.
// Check if setupUserEditModal is called properly (it should be in init)
if (!dashJs.includes('setupUserEditModal()')) {
  // Add call to setupUserEditModal in the init section
  dashJs = dashJs.replace(
    'setupApprovalModal();',
    'setupApprovalModal();\n  setupUserEditModal();'
  );
  console.log('✅ Added setupUserEditModal() call to init');
} else {
  console.log('✅ setupUserEditModal already called');
}

fs.writeFileSync(dashboardJsPath, dashJs, 'utf8');
console.log('✅ dashboard.js saved');

// ─── Fix 6: style.css — content overflow fixes ─────────────────────────────────
let css = fs.readFileSync(styleCssPath, 'utf8');

const overflowFixes = `
/* ── Overflow / text containment fixes ── */
.noticia-titulo,
.proyecto-titulo,
.cap-nombre,
.concurso-titulo {
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}
.noticia-desc,
.proyecto-desc,
.cap-desc,
.concurso-desc {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.noticia-card.destacada .noticia-desc {
  -webkit-line-clamp: 4;
}
/* Article content stays within container */
.article-body,
.article-content {
  overflow-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
  box-sizing: border-box;
}
.article-content img {
  max-width: 100%;
  height: auto;
}
.article-content pre,
.article-content code {
  white-space: pre-wrap;
  word-break: break-all;
  max-width: 100%;
  overflow-x: auto;
}
/* Editor adjuntos zone — no overlap */
#dropAdjuntos {
  margin-top: 1.5rem;
  clear: both;
  position: relative;
  z-index: 1;
}
/* FAQ answer links */
.faq-answer a {
  color: var(--ieee-light-blue);
  text-decoration: underline;
}
`;

if (!css.includes('Overflow / text containment fixes')) {
  css += overflowFixes;
  console.log('✅ Added overflow/containment CSS fixes');
} else {
  console.log('✅ Overflow fixes already present');
}

fs.writeFileSync(styleCssPath, css, 'utf8');
console.log('✅ style.css saved');

console.log('\n🎉 All fixes applied successfully!');
