// ==================== API CONFIG ====================
const API_BASE_URL = window.API_BASE_URL || window.location.origin + '/api';

// ==================== AUTH UTILITIES ====================
function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

function isAuthenticated() {
  return !!getToken();
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
}

// ==================== API CALLS ====================
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();
    throw new Error('Session expired');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API Error');
  }

  return data;
}

// POST - crear contenido
async function createContenido(formData) {
  const url = `${API_BASE_URL}/contenido`;
  const token = getToken();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (response.status === 401) {
    logout();
    throw new Error('Session expired');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error creating content');
  }

  return data;
}

async function getContenidoAdmin(id) {
  return apiCall(`/contenido/admin/${encodeURIComponent(id)}`);
}

async function updateContenidoAdmin(id, formData) {
  const response = await fetch(`${API_BASE_URL}/contenido/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });

  if (response.status === 401) {
    logout();
    throw new Error('Session expired');
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error updating content');
  return data;
}

async function deleteContenidoAdmin(id) {
  return apiCall(`/contenido/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// GET - obtener contenido
async function getContenido(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/contenido?${query}`);
}

// GET - mi contenido
async function getMisContenidos(autorId) {
  return apiCall(`/contenido/mis-contenidos/${autorId}`);
}

// GET - pendientes aprobacion
async function getPendientes() {
  return apiCall('/contenido/pendientes');
}

// POST - aprobar contenido
async function aprobarContenido(id, comentario = '') {
  return apiCall(`/contenido/${id}/aprobar`, {
    method: 'POST',
    body: JSON.stringify({ comentario }),
  });
}

// POST - rechazar contenido
async function rechazarContenido(id, comentario = '') {
  return apiCall(`/contenido/${id}/rechazar`, {
    method: 'POST',
    body: JSON.stringify({ comentario }),
  });
}

// GET - galeria
async function getGaleria(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/galeria?${query}`);
}

// POST - subir fotos galeria
async function uploadGaleria(formData) {
  const url = `${API_BASE_URL}/galeria`;
  const token = getToken();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (response.status === 401) {
    logout();
    throw new Error('Session expired');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error uploading gallery');
  }

  return data;
}

async function deleteGaleria(id) {
  return apiCall(`/galeria/${id}`, { method: 'DELETE' });
}

async function getRevistas() {
  return apiCall('/revistas');
}

async function deleteRevista(id) {
  return apiCall(`/revistas/${id}`, { method: 'DELETE' });
}

async function uploadContenidoArchivos(contenidoId, formData) {
  const response = await fetch(`${API_BASE_URL}/contenido/${contenidoId}/archivos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error uploading files');
  return data;
}

async function deleteContenidoArchivo(contenidoId, archivoId) {
  return apiCall(`/contenido/${encodeURIComponent(contenidoId)}/archivos/${encodeURIComponent(archivoId)}`, {
    method: 'DELETE',
  });
}

async function getCapitulos() {
  return apiCall('/capitulos');
}

// Admin version: returns ALL chapters including hidden/inactive
async function getCapitulosAdmin() {
  return apiCall('/capitulos?all=1');
}

async function getCapitulo(slug) {
  return apiCall(`/capitulos/${encodeURIComponent(slug)}`);
}

async function updateCapitulo(slug, payload) {
  return apiCall(`/capitulos/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

async function uploadCapituloArchivo(slug, formData) {
  const response = await fetch(`${API_BASE_URL}/capitulos/${encodeURIComponent(slug)}/archivos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error uploading chapter file');
  return data;
}

async function getUsuarios() {
  return apiCall('/auth/users');
}

async function createUsuario(payload) {
  return apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function updateUsuarioPassword(id, password) {
  return apiCall(`/auth/users/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
}

async function deleteUsuario(id) {
  return apiCall(`/auth/users/${id}`, { method: 'DELETE' });
}

async function updateUsuario(id, payload) {
  return apiCall(`/auth/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

async function getSiteSettings() {
  return apiCall('/site-settings');
}

async function updateSiteSettings(settings) {
  return apiCall('/site-settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

// ==================== FAQ API ====================
async function getFaqAdmin() {
  return apiCall('/faq/admin');
}

async function createFaq(payload) {
  return apiCall('/faq', { method: 'POST', body: JSON.stringify(payload) });
}

async function updateFaq(id, payload) {
  return apiCall(`/faq/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

async function deleteFaq(id) {
  return apiCall(`/faq/${id}`, { method: 'DELETE' });
}

// ==================== UTILITY FUNCTIONS ====================
function showStatus(elementId, message, type = 'success') {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = message;
  element.className = `status-message ${type}`;
  element.classList.remove('hidden');

  if (type === 'success') {
    setTimeout(() => {
      element.classList.add('hidden');
    }, 3000);
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

// ==================== TOAST NOTIFICATIONS ====================
function toast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '\u2713', error: '\u2715', info: '\u2139' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML =
    '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' +
    '<span class="toast-msg">' + escapeHTML(message) + '</span>' +
    '<button class="toast-close" onclick="this.parentElement.remove()">\u00d7</button>';
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('toast-visible'));
  setTimeout(() => {
    t.classList.remove('toast-visible');
    setTimeout(() => t.remove(), 300);
  }, duration);
}

function showConfirm(message, title = 'Confirmar Acci\u00f3n') {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    if (!modal) return resolve(confirm(message));

    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').textContent = message;

    const btnCancel = document.getElementById('confirmModalCancelBtn');
    const btnAccept = document.getElementById('confirmModalAcceptBtn');

    const cleanup = () => {
      modal.classList.add('hidden');
      btnCancel.onclick = null;
      btnAccept.onclick = null;
    };

    btnCancel.onclick = (e) => {
      e.preventDefault();
      cleanup();
      resolve(false);
    };

    btnAccept.onclick = (e) => {
      e.preventDefault();
      cleanup();
      resolve(true);
    };

    modal.classList.remove('hidden');
  });
}

// ==================== PATCH: handleResetPassword modal ====================
// Override the native prompt() based password reset with an in-page modal.
// This is loaded before dashboard.js so window.handleResetPassword will be
// redefined after dashboard.js loads. We use a DOMContentLoaded hook to
// ensure the override fires after dashboard.js has set up its version.
document.addEventListener('DOMContentLoaded', function() {
  window.handleResetPassword = async function(usuarioId) {
    return new Promise(function(resolve) {
      var modal     = document.getElementById('confirmModal');
      var titleEl   = document.getElementById('confirmModalTitle');
      var msgEl     = document.getElementById('confirmModalMessage');
      var acceptBtn = document.getElementById('confirmModalAcceptBtn');
      var cancelBtn = document.getElementById('confirmModalCancelBtn');

      if (!modal) {
        var pwd = prompt('Nueva contrase\u00f1a (m\u00edn. 6 caracteres):');
        if (!pwd || pwd.length < 6) { resolve(); return; }
        updateUsuarioPassword(usuarioId, pwd)
          .then(function() { toast('Contrase\u00f1a actualizada', 'success'); })
          .catch(function(e) { toast('Error: ' + e.message, 'error'); });
        resolve(); return;
      }

      titleEl.textContent = 'Cambiar Contrase\u00f1a';
      msgEl.innerHTML =
        '<div style="text-align:left;">' +
          '<label style="display:block;margin-bottom:8px;font-size:.85rem;font-weight:600;">Nueva contrase\u00f1a (m\u00edn. 6 caracteres)</label>' +
          '<input id="_pwdInput" type="password" autocomplete="new-password" ' +
            'style="width:100%;padding:9px 12px;border:1px solid var(--border-card);border-radius:6px;background:var(--bg-card);color:var(--text-primary);font-size:.9rem;" ' +
            'placeholder="Nueva contrase\u00f1a">' +
        '</div>';
      acceptBtn.textContent = 'Cambiar clave';
      acceptBtn.className   = 'btn-primary';
      modal.classList.remove('hidden');
      setTimeout(function() { var el = document.getElementById('_pwdInput'); if (el) el.focus(); }, 80);

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
        if (pwd.length < 6) { toast('La contrase\u00f1a debe tener al menos 6 caracteres.', 'error'); return; }
        cleanup();
        try {
          await updateUsuarioPassword(usuarioId, pwd);
          toast('Contrase\u00f1a actualizada correctamente', 'success');
        } catch (err) { toast('Error: ' + err.message, 'error'); }
        resolve();
      };
      cancelBtn.onclick = function() { cleanup(); resolve(); };
    });
  };
}, { once: true });
