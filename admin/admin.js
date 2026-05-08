// ==================== API CONFIG ====================
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api';

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

// Redirigir a login si no está autenticado
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

// GET - obtener contenido
async function getContenido(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/contenido?${query}`);
}

// GET - mi contenido
async function getMisContenidos(autorId) {
  return apiCall(`/contenido/mis-contenidos/${autorId}`);
}

// GET - pendientes aprobación
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

// GET - galería
async function getGaleria(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/galeria?${query}`);
}

// POST - subir fotos galería
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
    hour: '2-digit',
    minute: '2-digit',
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

// ==================== EXPORT ====================
// Las funciones están disponibles globalmente en el scope del navegador
