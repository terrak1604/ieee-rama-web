# IEEE Portal - Fix Images Script
# Run from PowerShell in the project directory:
# cd c:\Users\PC\Desktop\IEEE_Rama_General_Web
# .\fix_portal.ps1

$ErrorActionPreference = "Stop"
$BaseDir = $PSScriptRoot

function Fix-File {
    param([string]$FilePath, [string]$OldText, [string]$NewText, [string]$Desc)
    $content = [System.IO.File]::ReadAllText($FilePath, [System.Text.Encoding]::UTF8)
    if ($content.Contains($OldText)) {
        $newContent = $content.Replace($OldText, $NewText)
        [System.IO.File]::WriteAllText($FilePath, $newContent, [System.Text.Encoding]::UTF8)
        Write-Host "[OK] $Desc" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[SKIP] $Desc - patron no encontrado" -ForegroundColor Yellow
        return $false
    }
}

$mainJs = Join-Path $BaseDir "js\main.js"
$dashJs = Join-Path $BaseDir "admin\dashboard.js"
$styleCss = Join-Path $BaseDir "css\style.css"

Write-Host "=== IEEE Portal Fix Script ===" -ForegroundColor Cyan
Write-Host "Directorio: $BaseDir"
Write-Host ""

# ─── Fix 1: createNoticiaCard ───────────────────────────────────────────────────
$oldNoticia = @"
      `${imgUrl ? ``<img src="`${escapeAttribute(imgUrl)}" alt="`${titulo}" onerror="this.src='`${IEEE_FALLBACK_IMAGE}'">`  : ''}
      <div class="img-placeholder" `${imgUrl ? 'class="img-placeholder img-placeholder-hidden"' : 'class="img-placeholder"'}>
        <span class="img-icon"><i class="ph-fill ph-image"></i></span>
        <span class="img-text">`${titulo}</span>
      </div>
"@

$newNoticia = @"
      `${imgUrl ? ``<img src="`${escapeAttribute(imgUrl)}" alt="`${titulo}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`  : ''}
      <div class="img-placeholder" style="`${imgUrl ? 'display:none' : ''}">
        <span class="img-icon"><i class="ph-fill ph-image"></i></span>
        <span class="img-text">`${titulo}</span>
      </div>
"@

Fix-File $mainJs $oldNoticia $newNoticia "Fix noticia card img-placeholder"

# ─── Fix 2: createProyectoCard ─────────────────────────────────────────────────
$oldProy = @"
      `${imgUrl ? ``<img src="`${escapeAttribute(imgUrl)}" alt="`${titulo}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`  : ''}
      <div class="img-placeholder" style="`${imgUrl ? 'display:none' : ''}">
"@

$alreadyFixed = [System.IO.File]::ReadAllText($mainJs, [System.Text.Encoding]::UTF8).Contains($oldProy)
if ($alreadyFixed) {
    Write-Host "[OK] createProyectoCard ya arreglado" -ForegroundColor Green
} else {
    $oldProy2 = @"
      `${imgUrl ? ``<img src="`${escapeAttribute(imgUrl)}" alt="`${titulo}" onerror="this.src='`${IEEE_FALLBACK_IMAGE}'">`  : ''}
      <div class="img-placeholder" `${imgUrl ? 'class="img-placeholder img-placeholder-hidden"' : 'class="img-placeholder"'}>
"@
    $newProy2 = @"
      `${imgUrl ? ``<img src="`${escapeAttribute(imgUrl)}" alt="`${titulo}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`  : ''}
      <div class="img-placeholder" style="`${imgUrl ? 'display:none' : ''}">
"@
    Fix-File $mainJs $oldProy2 $newProy2 "Fix proyecto card img-placeholder"
}

# ─── Fix 3: createCapituloCard — show logo_path ─────────────────────────────────
$oldCap = @"
      <div class="cap-placeholder" style="background: linear-gradient(135deg, rgba(0,20,45,0.9), `${color}18)">
        <span class="cap-icon">`${icono}</span>
        <span class="cap-placeholder-text">Agregar imagen en images/capitulos/`${id}.jpg</span>
      </div>
      <span class="cap-siglas-badge" style="border-color:`${color};color:`${color}">`${siglas}</span>
"@

$newCap = @"
      `${logoUrl
        ? ``<img src="`${escapeAttribute(logoUrl)}" alt="Logo `${siglas}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="cap-placeholder" style="display:none;background:linear-gradient(135deg,rgba(0,20,45,0.9),`${color}18)"><span class="cap-icon">`${icono}</span></div>``
        : ``<div class="cap-placeholder" style="background:linear-gradient(135deg,rgba(0,20,45,0.9),`${color}18)"><span class="cap-icon">`${icono}</span></div>``}
      <span class="cap-siglas-badge" style="border-color:`${color};color:`${color}">`${siglas}</span>
"@

Fix-File $mainJs $oldCap $newCap "Fix capitulo card logo_path"

# ─── Fix 4: handleResetPassword — replace prompt() ──────────────────────────────
$oldPwd = @"
async function handleResetPassword(usuarioId) {
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
    toast(`Error: `${err.message}`, 'error');
  }
}
"@

$newPwd = @"
async function handleResetPassword(usuarioId) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmModalTitle');
    const msgEl = document.getElementById('confirmModalMessage');
    const acceptBtn = document.getElementById('confirmModalAcceptBtn');
    const cancelBtn = document.getElementById('confirmModalCancelBtn');
    titleEl.textContent = 'Cambiar Contrase\u00f1a';
    msgEl.innerHTML = '<div style="text-align:left;margin-bottom:8px;"><label for="_pwdInput" style="display:block;margin-bottom:6px;font-size:0.85rem;font-weight:600;">Nueva contrase\u00f1a (m\u00edn. 6 caracteres)</label><input id="_pwdInput" type="password" style="width:100%;padding:8px 12px;border:1px solid var(--border-card);border-radius:6px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;" placeholder="Nueva contrase\u00f1a" autocomplete="new-password"></div>';
    acceptBtn.textContent = 'Cambiar clave';
    acceptBtn.className = 'btn-primary';
    modal.classList.remove('hidden');
    setTimeout(() => { const el = document.getElementById('_pwdInput'); if (el) el.focus(); }, 80);
    const cleanup = () => {
      modal.classList.add('hidden');
      msgEl.textContent = '\u00bfEst\u00e1s seguro?';
      titleEl.textContent = 'Confirmar Acci\u00f3n';
      acceptBtn.textContent = 'Aceptar';
      acceptBtn.className = 'btn-primary danger';
      acceptBtn.onclick = null;
      cancelBtn.onclick = null;
    };
    acceptBtn.onclick = async () => {
      const el = document.getElementById('_pwdInput');
      const pwd = el ? el.value : '';
      if (pwd.length < 6) { toast('La contrase\u00f1a debe tener al menos 6 caracteres.', 'error'); return; }
      cleanup();
      try {
        await updateUsuarioPassword(usuarioId, pwd);
        toast('Contrase\u00f1a actualizada correctamente', 'success');
      } catch (err) { toast('Error: ' + err.message, 'error'); }
      resolve();
    };
    cancelBtn.onclick = () => { cleanup(); resolve(); };
  });
}
"@

Fix-File $dashJs $oldPwd $newPwd "Fix handleResetPassword (modal instead of prompt)"

# ─── Fix 5: CSS overflow fixes ──────────────────────────────────────────────────
$cssContent = [System.IO.File]::ReadAllText($styleCss, [System.Text.Encoding]::UTF8)

if (-not $cssContent.Contains("Overflow / text containment fixes")) {
    $overflowFix = @"

/* ── Overflow / text containment fixes ── */
.noticia-titulo, .proyecto-titulo, .cap-nombre, .concurso-titulo {
  overflow-wrap: break-word;
  word-break: break-word;
}
.noticia-desc, .proyecto-desc, .cap-desc, .concurso-desc {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.noticia-card.destacada .noticia-desc { -webkit-line-clamp: 4; }
.article-body, .article-content {
  overflow-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
  box-sizing: border-box;
}
.article-content img { max-width: 100%; height: auto; }
.article-content pre, .article-content code {
  white-space: pre-wrap; word-break: break-all; max-width: 100%; overflow-x: auto;
}
#dropAdjuntos { margin-top: 1.5rem; clear: both; position: relative; z-index: 1; }
.faq-answer a { color: var(--ieee-light-blue); text-decoration: underline; }
"@
    $cssContent += $overflowFix
    [System.IO.File]::WriteAllText($styleCss, $cssContent, [System.Text.Encoding]::UTF8)
    Write-Host "[OK] CSS overflow fixes added" -ForegroundColor Green
} else {
    Write-Host "[SKIP] CSS overflow fixes already present" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Fix completado ===" -ForegroundColor Cyan
Write-Host "Recarga el navegador para ver los cambios." -ForegroundColor White
