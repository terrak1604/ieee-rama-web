// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  initDashboard();
});

function initDashboard() {
  const user = getUser();
  const rol = user?.rol;

  // Mostrar información del usuario
  document.getElementById('userName').textContent = user?.nombre || 'Usuario';
  document.getElementById('userRole').textContent = 
    rol === 'director_rama' ? 'Director de Rama' : 'Director de Capítulo';

  // Mostrar/ocultar menús según rol
  if (rol === 'director_rama') {
    document.getElementById('directorMenu').classList.add('hidden');
    document.getElementById('ramaMenu').classList.remove('hidden');
  } else {
    document.getElementById('directorMenu').classList.remove('hidden');
    document.getElementById('ramaMenu').classList.add('hidden');
  }

  // Configurar listeners
  setupMenuListeners();
  setupFormListeners();
  setupLogout();
  
  // Cargar contenido inicial
  loadMisContenidos();
}

// ==================== MENU NAVIGATION ====================
function setupMenuListeners() {
  document.querySelectorAll('.menu-item').forEach((item) => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      if (tab) {
        switchTab(tab);
      }
    });
  });
}

function switchTab(tabName) {
  // Ocultar todas las tabs
  document.querySelectorAll('.tab-content').forEach((tab) => {
    tab.classList.remove('active');
  });

  // Desactivar todos los items del menú
  document.querySelectorAll('.menu-item').forEach((item) => {
    item.classList.remove('active');
  });

  // Mostrar la tab seleccionada
  const tabElement = document.getElementById(tabName);
  if (tabElement) {
    tabElement.classList.add('active');
  }

  // Marcar item del menú como activo
  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

  // Cargar datos específicos según la tab
  if (tabName === 'mis-contenidos') {
    loadMisContenidos();
  } else if (tabName === 'pendientes') {
    loadPendientes();
  } else if (tabName === 'contenido-publicado') {
    loadContenidoPublicado();
  } else if (tabName === 'cuentas') {
    loadUsuarios();
  } else if (tabName === 'site-images') {
    loadSiteImagesAdmin();
  } else if (tabName === 'editar-capitulo') {
    window.AdminCapitulos?.load();
  } else if (tabName === 'editor-articulo') {
    window.AdminEditor?.init();
  }
}

// ==================== FORM HANDLERS ====================
function setupFormListeners() {
  // Noticia
  document.getElementById('formNoticia')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleCrearNoticia();
  });

  // Proyecto
  document.getElementById('formProyecto')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleCrearProyecto();
  });

  // Evento
  document.getElementById('formEvento')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleCrearEvento();
  });

  // Galería
  document.getElementById('formGaleria')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubirGaleria();
  });

  // Usuarios
  document.getElementById('formUsuario')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleCrearUsuario();
  });

  // Revista
  document.getElementById('formRevista')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleCrearRevista();
  });

  // Site Images (hero, logo)
  document.getElementById('formHeroImage')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleUpdateSiteImage('hero', 'heroImagen', 'heroAlt', 'heroStatus');
  });
  document.getElementById('formLogoImage')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleUpdateSiteImage('logo', 'logoImagen', null, 'logoStatus');
  });
}

async function handleCrearNoticia() {
  const user = getUser();
  const formData = new FormData();

  formData.append('tipo', 'noticia');
  formData.append('titulo', document.getElementById('noticiaTitulo').value);
  formData.append('descripcion', document.getElementById('noticiaDesc').value);
  formData.append('categoria', document.getElementById('noticiaCategoria').value);
  formData.append('capitulo', user.capitulo || 'General');
  formData.append('link', document.getElementById('noticiaLink').value);

  const imagen = document.getElementById('noticiaImagen').files[0];
  if (imagen) {
    formData.append('imagen', imagen);
  }

  try {
    await createContenido(formData);
    showStatus('noticiaStatus', '✅ Noticia creada exitosamente', 'success');
    document.getElementById('formNoticia').reset();
    setTimeout(() => {
      if (user.rol === 'director_rama') {
        loadContenidoPublicado();
      } else {
        loadMisContenidos();
      }
    }, 1000);
  } catch (err) {
    showStatus('noticiaStatus', `❌ Error: ${err.message}`, 'error');
  }
}

async function handleCrearProyecto() {
  const user = getUser();
  const formData = new FormData();

  formData.append('tipo', 'proyecto');
  formData.append('titulo', document.getElementById('proyectoTitulo').value);
  formData.append('descripcion', document.getElementById('proyectoDesc').value);
  formData.append('categoria', 'proyecto');
  formData.append('capitulo', user.capitulo || 'General');
  formData.append('link', document.getElementById('proyectoLink').value);

  const imagen = document.getElementById('proyectoImagen').files[0];
  if (imagen) {
    formData.append('imagen', imagen);
  }

  try {
    await createContenido(formData);
    showStatus('proyectoStatus', '✅ Proyecto creado exitosamente', 'success');
    document.getElementById('formProyecto').reset();
    setTimeout(() => loadMisContenidos(), 1000);
  } catch (err) {
    showStatus('proyectoStatus', `❌ Error: ${err.message}`, 'error');
  }
}

async function handleCrearEvento() {
  const user = getUser();
  const formData = new FormData();

  formData.append('tipo', 'evento');
  formData.append('titulo', document.getElementById('eventoTitulo').value);
  formData.append('descripcion', document.getElementById('eventoDesc').value);
  formData.append('categoria', 'evento');
  formData.append('capitulo', user.capitulo || 'General');
  formData.append('fecha_evento', document.getElementById('eventoFecha').value);
  formData.append('lugar', document.getElementById('eventoLugar').value);
  formData.append('link', document.getElementById('eventoLink').value);

  const imagen = document.getElementById('eventoImagen').files[0];
  if (imagen) {
    formData.append('imagen', imagen);
  }

  try {
    await createContenido(formData);
    showStatus('eventoStatus', '✅ Evento creado exitosamente', 'success');
    document.getElementById('formEvento').reset();
    setTimeout(() => loadMisContenidos(), 1000);
  } catch (err) {
    showStatus('eventoStatus', `❌ Error: ${err.message}`, 'error');
  }
}

async function handleSubirGaleria() {
  const formData = new FormData();

  const capitulo = document.getElementById('galeriaCapitulo').value;
  const evento = document.getElementById('galeriaEvento').value;
  const fotos = document.getElementById('galeriaFotos').files;

  if (fotos.length === 0) {
    showStatus('galeriaStatus', '❌ Selecciona al menos una foto', 'error');
    return;
  }

  if (capitulo) formData.append('capitulo', capitulo);
  if (evento) formData.append('evento', evento);

  for (let foto of fotos) {
    formData.append('fotos', foto);
  }

  try {
    await uploadGaleria(formData);
    showStatus('galeriaStatus', `✅ ${fotos.length} fotos subidas exitosamente`, 'success');
    document.getElementById('formGaleria').reset();
  } catch (err) {
    showStatus('galeriaStatus', `❌ Error: ${err.message}`, 'error');
  }
}

async function handleCrearUsuario() {
  const payload = {
    nombre: document.getElementById('usuarioNombre').value.trim(),
    email: document.getElementById('usuarioEmail').value.trim(),
    password: document.getElementById('usuarioPassword').value,
    rol: document.getElementById('usuarioRol').value,
    capitulo: document.getElementById('usuarioCapitulo').value.trim(),
  };

  try {
    await createUsuario(payload);
    showStatus('usuarioStatus', '✅ Cuenta creada exitosamente', 'success');
    document.getElementById('formUsuario').reset();
    loadUsuarios();
  } catch (err) {
    showStatus('usuarioStatus', `❌ Error: ${err.message}`, 'error');
  }
}

// ==================== CONTENT LOADING ====================
async function loadMisContenidos() {
  const user = getUser();
  const container = document.getElementById('misContenidosList');

  try {
    const contenidos = await getMisContenidos(user.id);

    if (contenidos.length === 0) {
      container.innerHTML = '<p class="empty-state">No tienes contenido aún. Crea tu primer artículo.</p>';
      return;
    }

    container.innerHTML = contenidos.map((item) => `
      <div class="content-item">
        <div class="item-info">
          <h4>${escapeHTML(item.titulo)}</h4>
          <p>${escapeHTML(item.tipo).toUpperCase()} &bull; ${formatDate(item.created_at)}</p>
        </div>
        <span class="item-status status-${escapeHTML(item.estado)}">${escapeHTML(item.estado)}</span>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-text">Error: ${err.message}</p>`;
  }
}

async function loadPendientes() {
  const container = document.getElementById('pendientesList');

  try {
    const pendientes = await getPendientes();

    if (pendientes.length === 0) {
      container.innerHTML = '<p class="empty-state">No hay contenido pendiente de aprobación.</p>';
      return;
    }

    container.innerHTML = pendientes.map((item) => `
      <div class="approval-item">
        <div class="item-info">
          <h4>${escapeHTML(item.titulo)}</h4>
          <p>${escapeHTML(item.tipo).toUpperCase()} por ${escapeHTML(item.autor_nombre)} &bull; ${formatDate(item.created_at)}</p>
          <p class="approval-preview">${escapeHTML(item.descripcion).substring(0, 100)}...</p>
        </div>
        <div class="approval-buttons">
          <button class="btn-aprobar" onclick="handleAprobacion(${item.id}, 'aprobar')">✓ Aprobar</button>
          <button class="btn-rechazar" onclick="handleAprobacion(${item.id}, 'rechazar')">✕ Rechazar</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-text">Error: ${err.message}</p>`;
  }
}

async function loadContenidoPublicado() {
  const container = document.getElementById('publicadoList');

  try {
    const publicado = await getContenido({ estado: 'aprobado' });

    if (publicado.length === 0) {
      container.innerHTML = '<p class="empty-state">No hay contenido publicado.</p>';
      return;
    }

    container.innerHTML = publicado.map((item) => `
      <div class="content-item">
        <div class="item-info">
          <h4>${escapeHTML(item.titulo)}</h4>
          <p>${escapeHTML(item.tipo).toUpperCase()} por ${escapeHTML(item.autor_nombre)} &bull; ${formatDate(item.created_at)}</p>
        </div>
        <span class="item-status status-aprobado">✓ Publicado</span>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-text">Error: ${err.message}</p>`;
  }
}

async function loadUsuarios() {
  const container = document.getElementById('usuariosList');
  if (!container) return;

  try {
    const usuarios = await getUsuarios();

    if (usuarios.length === 0) {
      container.innerHTML = '<p class="empty-state">No hay usuarios registrados.</p>';
      return;
    }

    container.innerHTML = usuarios.map((usuario) => `
      <div class="content-item">
        <div class="item-info">
          <h4>${escapeHTML(usuario.nombre)}</h4>
          <p>${escapeHTML(usuario.email)} &bull; ${formatRol(usuario.rol)} &bull; ${escapeHTML(usuario.capitulo || 'Sin capítulo')}</p>
        </div>
        <div class="approval-buttons">
          <button class="btn-aprobar" onclick="handleResetPassword(${usuario.id})">Cambiar clave</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-text">Error: ${escapeHTML(err.message)}</p>`;
  }
}

function formatRol(rol) {
  return rol === 'director_rama' ? 'Director de Rama' : 'Director de Capítulo';
}

// ==================== APPROVAL HANDLERS ====================
async function handleAprobacion(contenidoId, accion) {
  const comentario = prompt(`${accion === 'aprobar' ? 'Aprobar' : 'Rechazar'} contenido. Comentario (opcional):`);
  
  if (comentario === null) return; // Usuario canceló

  try {
    if (accion === 'aprobar') {
      await aprobarContenido(contenidoId, comentario);
      showStatus('pendientesList', '✅ Contenido aprobado', 'success');
    } else {
      await rechazarContenido(contenidoId, comentario);
      showStatus('pendientesList', '✅ Contenido rechazado', 'success');
    }
    loadPendientes();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

async function handleResetPassword(usuarioId) {
  const password = prompt('Nueva contraseña para este usuario (mínimo 6 caracteres):');

  if (password === null) return;
  if (password.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  try {
    await updateUsuarioPassword(usuarioId, password);
    alert('Contraseña actualizada.');
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

// ==================== LOGOUT ====================
function setupLogout() {
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

// ==================== REVISTA HANDLERS ====================
async function handleCrearRevista() {
  const formData = new FormData();
  formData.append('titulo', document.getElementById('revistaTitulo').value);
  formData.append('edicion', document.getElementById('revistaEdicion').value);
  formData.append('fecha', document.getElementById('revistaFecha').value);
  formData.append('descripcion', document.getElementById('revistaDesc').value);

  const portada = document.getElementById('revistaPortada').files[0];
  if (portada) formData.append('portada', portada);

  const pdf = document.getElementById('revistaPdf').files[0];
  if (pdf) formData.append('pdf', pdf);

  try {
    const res = await fetch(`${API_BASE_URL}/revistas`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error creating revista');
    showStatus('revistaStatus', '✅ Revista publicada exitosamente', 'success');
    document.getElementById('formRevista').reset();
  } catch (err) {
    showStatus('revistaStatus', `❌ Error: ${err.message}`, 'error');
  }
}

// ==================== SITE IMAGES HANDLERS ====================
async function loadSiteImagesAdmin() {
  try {
    const res = await fetch(`${API_BASE_URL}/site-images`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) return;
    const images = await res.json();
    images.forEach(img => {
      if (img.clave === 'hero' && img.path) {
        const preview = document.getElementById('heroPreview');
        if (preview) preview.innerHTML = `<img src="${API_BASE_URL.replace('/api','')}${img.path}" alt="Hero actual" class="site-img-thumb">`;
      }
      if (img.clave === 'logo' && img.path) {
        const preview = document.getElementById('logoPreview');
        if (preview) preview.innerHTML = `<img src="${API_BASE_URL.replace('/api','')}${img.path}" alt="Logo actual" class="site-img-thumb">`;
      }
    });
  } catch (e) {
    console.warn('Error loading site images:', e);
  }
}

async function handleUpdateSiteImage(clave, fileInputId, altInputId, statusId) {
  const fileInput = document.getElementById(fileInputId);
  const file = fileInput?.files[0];
  if (!file) {
    showStatus(statusId, '❌ Selecciona una imagen', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('imagen', file);
  if (altInputId) {
    const altText = document.getElementById(altInputId)?.value;
    if (altText) formData.append('alt_text', altText);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/site-images/${clave}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error updating image');
    showStatus(statusId, `✅ Imagen '${clave}' actualizada`, 'success');
    loadSiteImagesAdmin();
  } catch (err) {
    showStatus(statusId, `❌ Error: ${err.message}`, 'error');
  }
}
