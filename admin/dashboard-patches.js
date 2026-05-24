/**
 * IEEE Portal - Dashboard Patches
 * Auto-loaded: patches dashboard.js bugs at runtime.
 * 
 * HOW TO USE:
 * Add <script src="dashboard-patches.js"></script> after dashboard.js in dashboard.html
 * OR ensure admin.js auto-loads this file (see bottom of this file).
 */

(function() {
  'use strict';

  // Wait for DOM and other scripts to load
  function applyPatches() {
    // ── PATCH 1: handleResetPassword — replace prompt() with modal ─────────────
    window.handleResetPassword = async function(usuarioId) {
      return new Promise(function(resolve) {
        var modal     = document.getElementById('confirmModal');
        var titleEl   = document.getElementById('confirmModalTitle');
        var msgEl     = document.getElementById('confirmModalMessage');
        var acceptBtn = document.getElementById('confirmModalAcceptBtn');
        var cancelBtn = document.getElementById('confirmModalCancelBtn');

        if (!modal) {
          // Fallback to original behavior if modal not available
          var pwd = prompt('Nueva contrase\u00f1a para este usuario (m\u00ednimo 6 caracteres):');
          if (pwd === null) { resolve(); return; }
          if (pwd.length < 6) {
            if (typeof toast === 'function') toast('La contrase\u00f1a debe tener al menos 6 caracteres.', 'error');
            resolve(); return;
          }
          if (typeof updateUsuarioPassword === 'function') {
            updateUsuarioPassword(usuarioId, pwd)
              .then(function() { if (typeof toast === 'function') toast('Contrase\u00f1a actualizada correctamente', 'success'); })
              .catch(function(e) { if (typeof toast === 'function') toast('Error: ' + e.message, 'error'); });
          }
          resolve(); return;
        }

        titleEl.textContent = 'Cambiar Contrase\u00f1a';
        msgEl.innerHTML =
          '<div style="text-align:left;margin-bottom:4px;">' +
            '<label for="_pwdInput" style="display:block;margin-bottom:8px;font-size:0.85rem;font-weight:600;">Nueva contrase\u00f1a (m\u00edn. 6 caracteres)</label>' +
            '<input id="_pwdInput" type="password" autocomplete="new-password" ' +
              'style="width:100%;padding:9px 12px;border:1px solid var(--border-card);border-radius:6px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;" ' +
              'placeholder="Nueva contrase\u00f1a">' +
          '</div>';
        acceptBtn.textContent = 'Cambiar clave';
        acceptBtn.className   = 'btn-primary';

        modal.classList.remove('hidden');
        setTimeout(function() {
          var el = document.getElementById('_pwdInput');
          if (el) el.focus();
        }, 80);

        function cleanup() {
          modal.classList.add('hidden');
          msgEl.textContent     = '\u00bfEst\u00e1s seguro?';
          titleEl.textContent   = 'Confirmar Acci\u00f3n';
          acceptBtn.textContent = 'Aceptar';
          acceptBtn.className   = 'btn-primary danger';
          acceptBtn.onclick = null;
          cancelBtn.onclick = null;
        }

        acceptBtn.onclick = async function() {
          var el  = document.getElementById('_pwdInput');
          var pwd = el ? el.value : '';
          if (pwd.length < 6) {
            if (typeof toast === 'function') toast('La contrase\u00f1a debe tener al menos 6 caracteres.', 'error');
            return;
          }
          cleanup();
          try {
            if (typeof updateUsuarioPassword === 'function') {
              await updateUsuarioPassword(usuarioId, pwd);
            }
            if (typeof toast === 'function') toast('Contrase\u00f1a actualizada correctamente', 'success');
          } catch (err) {
            if (typeof toast === 'function') toast('Error: ' + err.message, 'error');
          }
          resolve();
        };
        cancelBtn.onclick = function() { cleanup(); resolve(); };
      });
    };

    // ── PATCH 2: Ensure setupUserEditModal is called ───────────────────────────
    if (typeof window.setupUserEditModal === 'function') {
      window.setupUserEditModal();
    }

    console.log('[Dashboard Patches] Applied successfully');
  }

  // Apply after all scripts have loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPatches);
  } else {
    // Use setTimeout to ensure dashboard.js has run first
    setTimeout(applyPatches, 0);
  }
})();
