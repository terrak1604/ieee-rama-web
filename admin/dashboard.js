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
  setupAdminTheme();
  setupApprovalModal();
  setupUserEditModal();
  setupImagePreviews();

  // Cargar contenido inicial
  loadStats();
}

// ==================== THEME TOGGLE ====================
function setupAdminTheme() {
  const btn = document.getElementById('adminThemeToggle');
  if (!btn) return;

  const moonSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const sunSVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

  const saved = localStorage.getItem('admin-theme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-admin-theme', 'light');
  }

  function updateButton() {
    const isLight = document.documentElement.getAttribute('data-admin-theme') === 'light';
    btn.innerHTML = isLight ? moonSVG : sunSVG;
    btn.setAttribute('title', isLight ? 'Modo oscuro' : 'Modo claro');
    btn.setAttribute('aria-label', isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
  }

  updateButton();

  btn.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-admin-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-admin-theme');
      localStorage.setItem('admin-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-admin-theme', 'light');
      localStorage.setItem('admin-theme', 'light');
    }
    updateButton();
  });
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
  if (tabName === 'inicio') {
    loadStats();
  } else if (tabName === 'mis-contenidos') {
    loadMisContenidos();
  } else if (tabName === 'pendientes') {
    loadPendientes();
  } else if (tabName === 'contenido-publicado') {
    loadContenidoPublicado();
  } else if (tabName === 'cuentas') {
    loadUsuarios();
  } else if (tabName === 'site-config') {
    loadSiteImagesAdmin();
    loadSiteSettings();
  } else if (tabName === 'editar-capitulo') {
    window.AdminCapitulos?.load();
  } else if (tabName === 'editor-articulo') {
    window.AdminEditor?.init();
  } else if (tabName === 'crear-revista') {
    loadRevistas();
  } else if (tabName === 'subir-galeria') {
    loadGaleriaAdmin();
  } else if (tabName === 'faq') {
    loadFaqAdmin();
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

  setupForm('formRevista', handleCrearRevista, 'revistaStatus');
  setupForm('formGaleria', handleSubirGaleria, 'galeriaStatus');
  setupForm('formSiteSettings', handleSiteSettingsSubmit, 'settingsStatus');

  // Formulario FAQ
  setupFaqModalListeners();

  // Editor: cambio dinámico de campos según tipo
  const editorTipo = document.getElementById('editorTipo');
  if (editorTipo) {
    function syncEditorFields() {
      const tipo = editorTipo.value;
      const fechaGroup = document.getElementById('editorFechaEvento')?.closest('.form-group');
      const lugarGroup = document.getElementById('editorLugar')?.closest('.form-group');
      const fechaLabel = fechaGroup?.querySelector('label');
      const fechaInput = document.getElementById('editorFechaEvento');
      const sectionAcad = document.getElementById('sectionAcademico');
      const sectionNot  = document.getElementById('sectionNoticia');

      if (!fechaGroup) return;

      if (tipo === 'noticia' || tipo === 'proyecto') {
        if (fechaLabel) fechaLabel.textContent = 'Fecha de publicación';
        if (fechaInput) fechaInput.type = 'date';
        if (lugarGroup) lugarGroup.style.display = 'none';
      } else {
        if (fechaLabel) fechaLabel.textContent = 'Fecha del evento';
        if (fechaInput) fechaInput.type = 'datetime-local';
        if (lugarGroup) lugarGroup.style.display = '';
      }

      // Secciones colapsables según tipo
      if (tipo === 'noticia') {
        if (sectionAcad) sectionAcad.style.display = 'none';
        if (sectionNot)  sectionNot.style.display = '';
      } else {
        if (sectionAcad) sectionAcad.style.display = '';
        if (sectionNot)  sectionNot.style.display = 'none';
      }

      // Breaking label toggle al cambiar es_destacada
      const chkDestacada = document.getElementById('editorEsDestacada');
      const breakingGrp  = document.getElementById('breakingLabelGroup');
      if (chkDestacada && breakingGrp) {
        chkDestacada.onchange = () => {
          breakingGrp.style.display = chkDestacada.checked ? 'block' : 'none';
        };
      }
    }
    editorTipo.addEventListener('change', syncEditorFields);
    syncEditorFields(); // Estado inicial
  }

  // Char counters
  setupCharCounter('editorAbstract',    'abstractCount', 800);
  setupCharCounter('editorLeadParagraph','leadCount',     300);
  setupCharCounter('noticiaLead',        'noticiaLeadCount', 300);

  ['hero', 'logo'].forEach((clave) => {
    const formId = clave === 'hero' ? 'formHeroImage' : 'formLogoImage';
    const form = document.getElementById(formId);
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleUpdateSiteImage(
          clave,
          `${clave}Imagen`,
          `${clave}Alt`,
          `${clave}Status`
        );
      });
    }
  });

  // Usuarios
  document.getElementById('formUsuario')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleCrearUsuario();
  });
}

function setupForm(formId, handler, statusId) {
  document.getElementById(formId)?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await handler(e);
    } catch (err) {
      showStatus(statusId, err.message, 'error');
    }
  });
}

function showStatus(id, msg, type = 'success') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `status-msg ${type}`;
  setTimeout(() => el.textContent = '', 5000);
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

  // Nuevos campos inmersivos
  const lead = document.getElementById('noticiaLead')?.value?.trim();
  if (lead) formData.append('lead_paragraph', lead);

  const esDestacada = document.getElementById('noticiaDestacada')?.checked;
  formData.append('es_destacada', esDestacada ? '1' : '0');

  if (esDestacada) {
    const breakingLabel = document.getElementById('noticiaBreakingLabel')?.value?.trim();
    if (breakingLabel) formData.append('breaking_label', breakingLabel);
  }

  const noticiaImagenInput = 'noticiaImagen';
  const imagen = compressedImages.get(noticiaImagenInput) || document.getElementById(noticiaImagenInput).files[0];
  if (imagen) {
    formData.append('imagen', imagen);
  }

  try {
    await createContenido(formData);
    toast('Noticia creada exitosamente', 'success');
    document.getElementById('formNoticia').reset();
    compressedImages.delete(noticiaImagenInput);
    document.getElementById('previewNoticiaImagen').innerHTML = '';
    document.getElementById('noticiaBreakingGroup').style.display = 'none';
    setTimeout(() => {
      if (user.rol === 'director_rama') {
        loadContenidoPublicado();
      } else {
        loadMisContenidos();
      }
    }, 1000);
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
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

  const proyectoImagenInput = 'proyectoImagen';
  const imagen = compressedImages.get(proyectoImagenInput) || document.getElementById(proyectoImagenInput).files[0];
  if (imagen) {
    formData.append('imagen', imagen);
  }

  try {
    await createContenido(formData);
    toast('Proyecto creado exitosamente', 'success');
    document.getElementById('formProyecto').reset();
    compressedImages.delete(proyectoImagenInput);
    document.getElementById('previewProyectoImagen').innerHTML = '';
    setTimeout(() => loadMisContenidos(), 1000);
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
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

  const eventoImagenInput = 'eventoImagen';
  const imagen = compressedImages.get(eventoImagenInput) || document.getElementById(eventoImagenInput).files[0];
  if (imagen) {
    formData.append('imagen', imagen);
  }

  try {
    await createContenido(formData);
    toast('Evento creado exitosamente', 'success');
    document.getElementById('formEvento').reset();
    compressedImages.delete(eventoImagenInput);
    document.getElementById('previewEventoImagen').innerHTML = '';
    setTimeout(() => loadMisContenidos(), 1000);
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
  }
}

async function handleSubirGaleria() {
  const formData = new FormData();
  const capitulo = document.getElementById('galeriaCapitulo').value;
  const evento = document.getElementById('galeriaEvento').value;
  const fotos = document.getElementById('galeriaFotos').files;

  if (fotos.length === 0) {
    toast('Selecciona al menos una foto', 'error');
    return;
  }

  if (capitulo) formData.append('capitulo', capitulo);
  if (evento) formData.append('evento', evento);

  for (let foto of fotos) {
    formData.append('fotos', foto);
  }

  try {
    await uploadGaleria(formData);
    toast(`${fotos.length} fotos subidas exitosamente`, 'success');
    document.getElementById('formGaleria').reset();
    loadGaleriaAdmin();
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
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
    toast('Cuenta creada exitosamente', 'success');
    document.getElementById('formUsuario').reset();
    loadUsuarios();
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
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
          <p>${escapeHTML(item.tipo).toUpperCase()} &bull; ${formatDate(item.created_at)}${item.vistas ? ` &bull; 👁 ${item.vistas} vistas` : ''}</p>
        </div>
        <div class="content-actions">
          <span class="item-status status-${escapeHTML(item.estado)}">${escapeHTML(item.estado)}</span>
          <button class="btn-mini" onclick="handleEditContenido(${item.id})">Editar</button>
          <button class="btn-mini danger" onclick="handleDeleteContenido(${item.id})">Eliminar</button>
        </div>
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
          <p>${escapeHTML(item.tipo).toUpperCase()} por ${escapeHTML(item.autor_nombre)} &bull; ${formatDate(item.created_at)}${item.vistas ? ` &bull; 👁 ${item.vistas} vistas` : ''}</p>
        </div>
        <div class="content-actions">
          <span class="item-status status-aprobado">✓ Publicado</span>
          <button class="btn-mini" onclick="handleEditContenido(${item.id})">Editar</button>
          <button class="btn-mini danger" onclick="handleDeleteContenido(${item.id})">Eliminar</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-text">Error: ${err.message}</p>`;
  }
}

async function handleEditContenido(contenidoId) {
  try {
    await window.AdminEditor?.edit(contenidoId);
  } catch (err) {
    toast(`Error al cargar contenido: ${err.message}`, 'error');
  }
}

async function handleDeleteContenido(contenidoId) {
  const confirmed = await showConfirm('¿Eliminar este contenido? Esta acción no se puede deshacer.');
  if (!confirmed) return;

  try {
    await deleteContenidoAdmin(contenidoId);
    toast('Contenido eliminado', 'success');
    const user = getUser();
    if (user?.rol === 'director_rama') {
      loadContenidoPublicado();
      loadPendientes();
    } else {
      loadMisContenidos();
    }
    loadStats();
  } catch (err) {
    toast(`Error al eliminar: ${err.message}`, 'error');
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
          <button class="btn-mini" onclick="handleEditUsuario(${usuario.id}, ${JSON.stringify(usuario.nombre)}, ${JSON.stringify(usuario.email)}, ${JSON.stringify(usuario.rol)}, ${JSON.stringify(usuario.capitulo || '')})">Editar</button>
          <button class="btn-aprobar" onclick="handleResetPassword(${usuario.id})">Cambiar clave</button>
          <button class="btn-mini danger" onclick="handleDeleteUsuario(${usuario.id})">Eliminar</button>
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

// ==================== APPROVAL MODAL ====================
let _approvalPending = null;

function setupApprovalModal() {
  const modal = document.getElementById('approvalModal');
  if (!modal) return;

  document.getElementById('approvalModalClose').addEventListener('click', closeApprovalModal);
  document.getElementById('approvalCancelBtn').addEventListener('click', closeApprovalModal);
  document.getElementById('approvalConfirmBtn').addEventListener('click', confirmApproval);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeApprovalModal();
  });
}

function closeApprovalModal() {
  document.getElementById('approvalModal').classList.add('hidden');
  document.getElementById('approvalComment').value = '';
  _approvalPending = null;
}

async function confirmApproval() {
  if (!_approvalPending) return;
  const { contenidoId, accion } = _approvalPending;
  const comentario = document.getElementById('approvalComment').value.trim();
  closeApprovalModal();

  try {
    if (accion === 'aprobar') {
      await aprobarContenido(contenidoId, comentario);
      toast('Contenido aprobado y publicado', 'success');
    } else {
      await rechazarContenido(contenidoId, comentario);
      toast('Contenido rechazado', 'info');
    }
    loadPendientes();
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
  }
}

// ==================== APPROVAL HANDLERS ====================
function handleAprobacion(contenidoId, accion) {
  _approvalPending = { contenidoId, accion };
  const modal = document.getElementById('approvalModal');
  document.getElementById('approvalModalTitle').textContent =
    accion === 'aprobar' ? 'Aprobar contenido' : 'Rechazar contenido';
  document.getElementById('approvalConfirmBtn').textContent =
    accion === 'aprobar' ? 'Aprobar' : 'Rechazar';
  modal.classList.remove('hidden');
  document.getElementById('approvalComment').focus();
}

// ==================== USER EDIT MODAL ====================
function setupUserEditModal() {
  const modal = document.getElementById('editUserModal');
  if (!modal) return;

  document.getElementById('editUserModalClose').addEventListener('click', closeUserEditModal);
  document.getElementById('editUserCancelBtn').addEventListener('click', closeUserEditModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeUserEditModal(); });

  document.getElementById('formEditUser').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editUserId').value;
    const payload = {
      nombre:   document.getElementById('editUserNombre').value.trim(),
      email:    document.getElementById('editUserEmail').value.trim(),
      rol:      document.getElementById('editUserRol').value,
      capitulo: document.getElementById('editUserCapitulo').value.trim(),
    };
    try {
      await updateUsuario(id, payload);
      toast('Usuario actualizado correctamente', 'success');
      closeUserEditModal();
      loadUsuarios();
    } catch (err) {
      showStatus('editUserStatus', `Error: ${err.message}`, 'error');
    }
  });
}

function closeUserEditModal() {
  document.getElementById('editUserModal').classList.add('hidden');
  document.getElementById('formEditUser').reset();
}

function handleEditUsuario(id, nombre, email, rol, capitulo) {
  document.getElementById('editUserId').value       = id;
  document.getElementById('editUserNombre').value   = nombre;
  document.getElementById('editUserEmail').value    = email;
  document.getElementById('editUserRol').value      = rol;
  document.getElementById('editUserCapitulo').value = capitulo || '';
  document.getElementById('editUserStatus').classList.add('hidden');
  document.getElementById('editUserModal').classList.remove('hidden');
  document.getElementById('editUserNombre').focus();
}

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
    toast(`Error: ${err.message}`, 'error');
  }
}

async function handleDeleteUsuario(usuarioId) {
  const confirmed = await showConfirm('¿Eliminar este usuario de forma permanente?');
  if (!confirmed) return;
  try {
    await deleteUsuario(usuarioId);
    toast('Usuario eliminado', 'success');
    loadUsuarios();
  } catch (err) {
    toast(`Error al eliminar: ${err.message}`, 'error');
  }
}

// ==================== STATS + CHART ====================
let _statsChart = null;

async function loadStats() {
  try {
    const [contenido, pendientes, capitulos] = await Promise.all([
      getContenido({ estado: 'aprobado' }).catch(() => []),
      getPendientes().catch(() => []),
      getCapitulos().catch(() => []),
    ]);

    // Cards
    const aprobadosEl = document.getElementById('statAprobados');
    const pendientesEl = document.getElementById('statPendientes');
    const capitulosEl = document.getElementById('statCapitulos');
    const proximoEl = document.getElementById('statProximoEvento');
    if (aprobadosEl) aprobadosEl.textContent = contenido.length;
    if (pendientesEl) pendientesEl.textContent = pendientes.length;
    if (capitulosEl) capitulosEl.textContent = capitulos.length;

    // Próximo evento
    const hoy = new Date();
    const proxEvento = contenido
      .filter((c) => c.tipo === 'evento' && c.fecha_evento && new Date(c.fecha_evento) >= hoy)
      .sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento))[0];
    if (proximoEl) {
      proximoEl.textContent = proxEvento
        ? new Date(proxEvento.fecha_evento).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
        : 'N/A';
    }

    // Gráfico — publicaciones por mes (últimos 6 meses)
    const canvas = document.getElementById('statsChart');
    if (!canvas) return;

    const labels = [];
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      labels.push(d.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' }));
      const count = contenido.filter((c) => {
        const cd = new Date(c.created_at);
        return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
      }).length;
      data.push(count);
    }

    if (_statsChart) _statsChart.destroy();
    _statsChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Publicaciones',
          data,
          backgroundColor: 'rgba(0,153,214,0.55)',
          borderColor: 'rgba(0,153,214,0.9)',
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} publicación${ctx.parsed.y !== 1 ? 'es' : ''}`,
            },
          },
        },
        scales: {
          x: { ticks: { color: '#8ba3c0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#8ba3c0', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
        },
      },
    });
  } catch (err) {
    console.warn('loadStats error:', err);
  }
}

// ==================== LOGOUT ====================
function setupLogout() {
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

// ==================== REVISTA HANDLERS ====================
async function handleCrearRevista() {
  const id = document.getElementById('revistaId').value;
  const titulo = document.getElementById('revistaTitulo').value.trim();
  const edicion = document.getElementById('revistaEdicion').value.trim();
  const fecha = document.getElementById('revistaFecha').value;
  const etiquetas = document.getElementById('revistaEtiquetas')?.value.trim() || '';

  if (!titulo || !edicion || !fecha) {
    toast('Faltan campos obligatorios.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('titulo', titulo);
  formData.append('edicion', edicion);
  formData.append('fecha', fecha);
  formData.append('descripcion', document.getElementById('revistaDesc').value);
  formData.append('etiquetas', etiquetas);

  const portada = document.getElementById('revistaPortada').files[0];
  if (portada) formData.append('portada', portada);

  const pdf = document.getElementById('revistaPdf').files[0];
  if (pdf) formData.append('pdf', pdf);

  try {
    const url = id ? `${API_BASE_URL}/revistas/${id}` : `${API_BASE_URL}/revistas`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error saving revista');
    toast(id ? 'Revista actualizada' : 'Revista publicada exitosamente', 'success');
    document.getElementById('formRevista').reset();
    document.getElementById('revistaId').value = '';
    const submitBtn = document.querySelector('#formRevista button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Publicar Revista';
    loadRevistas();
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
  }
}

async function loadRevistas() {
  const container = document.getElementById('revistasList');
  if (!container) return;
  try {
    const revistas = await getRevistas();
    if (revistas.length === 0) {
      container.innerHTML = '<p class="empty-state">No hay revistas publicadas.</p>';
      return;
    }
    container.innerHTML = revistas.map((item) => `
      <div class="content-item">
        <div class="item-info">
          <h4>${escapeHTML(item.titulo)} (Ed. ${escapeHTML(item.edicion)})</h4>
          <p>${formatDate(item.fecha)}</p>
        </div>
        <div class="content-actions">
          <button class="btn-mini" onclick='handleEditRevista(${JSON.stringify(item).replace(/'/g, "&apos;")})'>Editar</button>
          <button class="btn-mini danger" onclick="handleDeleteRevista(${item.id})">Eliminar</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-text">Error: ${escapeHTML(err.message)}</p>`;
  }
}

async function handleDeleteRevista(id) {
  const confirmed = await showConfirm('¿Eliminar esta revista?');
  if (!confirmed) return;
  try {
    await deleteRevista(id);
    toast('Revista eliminada', 'success');
    loadRevistas();
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
  }
}

function handleEditRevista(item) {
  document.getElementById('revistaId').value = item.id;
  document.getElementById('revistaTitulo').value = item.titulo || '';
  document.getElementById('revistaEdicion').value = item.edicion || '';
  if (item.fecha) {
    document.getElementById('revistaFecha').value = item.fecha.split('T')[0];
  }
  document.getElementById('revistaDesc').value = item.descripcion || '';
  const etiquetasInput = document.getElementById('revistaEtiquetas');
  if (etiquetasInput) etiquetasInput.value = item.etiquetas || '';
  
  const submitBtn = document.querySelector('#formRevista button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Guardar Cambios';
  
  switchTab('crear-revista');
  window.scrollTo(0, 0);
}

async function loadGaleriaAdmin() {
  const container = document.getElementById('galeriaList');
  if (!container) return;
  try {
    const fotos = await getGaleria();
    if (fotos.length === 0) {
      container.innerHTML = '<p class="empty-state">No hay fotos en galería.</p>';
      return;
    }
    const baseUrl = API_BASE_URL.replace('/api', '');
    container.innerHTML = fotos.map((f) => `
      <div style="position:relative; width: 150px; height: 150px; border-radius: 8px; overflow: hidden;">
        <img src="${baseUrl}${f.path}" style="width: 100%; height: 100%; object-fit: cover;" alt="">
        <button onclick="handleDeleteGaleria(${f.id})" style="position: absolute; top: 5px; right: 5px; background: rgba(255,0,0,0.8); color: white; border: none; border-radius: 4px; cursor: pointer; padding: 4px;">✕</button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-text">Error: ${escapeHTML(err.message)}</p>`;
  }
}

async function handleDeleteGaleria(id) {
  const confirmed = await showConfirm('¿Eliminar esta foto de la galería?');
  if (!confirmed) return;
  try {
    await deleteGaleria(id);
    toast('Foto eliminada', 'success');
    loadGaleriaAdmin();
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
  }
}

async function loadSiteSettings() {
  const form = document.getElementById('formSiteSettings');
  if (!form) return;
  try {
    const settings = await getSiteSettings();
    document.getElementById('settingEmail').value = settings.footer_email || '';
    document.getElementById('settingHeroText').value = settings.hero_text || '';
    document.getElementById('settingFacebook').value = settings.footer_facebook || '';
    document.getElementById('settingInstagram').value = settings.footer_instagram || '';
    document.getElementById('settingLinkedin').value = settings.footer_linkedin || '';
    document.getElementById('settingTwitter').value = settings.footer_twitter || '';
    document.getElementById('settingWhatsApp').value = settings.footer_whatsapp || '';
    document.getElementById('settingAddress').value = settings.footer_address || '';
    document.getElementById('settingMaintenance').checked = settings.maintenance === 'true';
  } catch (err) {
    console.error('Error loading site settings:', err);
  }
}

async function handleSiteSettingsSubmit(e) {
  e.preventDefault();
  const settings = {
    footer_email: document.getElementById('settingEmail').value,
    hero_text: document.getElementById('settingHeroText').value,
    footer_facebook: document.getElementById('settingFacebook').value,
    footer_instagram: document.getElementById('settingInstagram').value,
    footer_linkedin: document.getElementById('settingLinkedin').value,
    footer_twitter: document.getElementById('settingTwitter').value,
    footer_whatsapp: document.getElementById('settingWhatsApp').value,
    footer_address: document.getElementById('settingAddress').value,
    maintenance: document.getElementById('settingMaintenance').checked ? 'true' : 'false',
  };

  try {
    const res = await updateSiteSettings(settings);
    showStatus('settingsStatus', res.message || 'Configuraciones guardadas', 'success');
  } catch (err) {
    showStatus('settingsStatus', err.message, 'error');
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
    toast('Selecciona una imagen', 'error');
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
    toast(`Imagen '${clave}' actualizada correctamente`, 'success');
    loadSiteImagesAdmin();
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
  }
}

// ==================== IMAGE COMPRESSION & PREVIEW ====================
const compressedImages = new Map();

function setupImagePreviews() {
  setupSinglePreview('noticiaImagen', 'previewNoticiaImagen');
  setupSinglePreview('proyectoImagen', 'previewProyectoImagen');
  setupSinglePreview('eventoImagen', 'previewEventoImagen');
}

function setupSinglePreview(inputId, previewContainerId) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(previewContainerId);
  if (!input || !container) return;

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) {
      container.innerHTML = '';
      compressedImages.delete(inputId);
      return;
    }
    
    const url = URL.createObjectURL(file);
    container.innerHTML = `<img src="${url}" class="img-preview-thumb" alt="Preview"> <div class="file-meta">Comprimiendo...</div>`;
    
    try {
      const blobFile = await compressImage(file, 1920, 0.8);
      compressedImages.set(inputId, blobFile);
      
      const savedBytes = file.size - blobFile.size;
      const savedMb = (savedBytes / (1024 * 1024)).toFixed(2);
      const newMb = (blobFile.size / (1024 * 1024)).toFixed(2);
      
      if(savedBytes > 0) {
        container.querySelector('.file-meta').innerHTML = `
          <span>Peso final: ${newMb} MB</span>
          <span class="saved">¡Ahorraste ${savedMb} MB!</span>
        `;
      } else {
        container.querySelector('.file-meta').innerHTML = `<span>Peso: ${newMb} MB</span>`;
      }
    } catch(err) {
      console.warn('Error compressing:', err);
      compressedImages.set(inputId, file);
      container.querySelector('.file-meta').innerHTML = `<span>Original: ${(file.size/(1024*1024)).toFixed(2)} MB</span>`;
    }
  });
}

function compressImage(file, maxWidth = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(blob => {
          if (blob) {
            const newFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else {
            reject(new Error('Canvas to Blob failed'));
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = error => reject(error);
    };
    reader.onerror = error => reject(error);
  });
}

// ==================== FAQ ADMIN ====================
function setupFaqModalListeners() {
  const modal = document.getElementById('faqModal');
  if (!modal) return;

  document.getElementById('faqModalClose')?.addEventListener('click', closeFaqModal);
  document.getElementById('faqModalCancel')?.addEventListener('click', closeFaqModal);
  document.getElementById('btnNuevaPregunta')?.addEventListener('click', () => openFaqModal(null));

  modal.addEventListener('click', (e) => { if (e.target === modal) closeFaqModal(); });

  document.getElementById('formFaq')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSaveFaq();
  });
}

function openFaqModal(item) {
  document.getElementById('faqId').value = item?.id || '';
  document.getElementById('faqPregunta').value = item?.pregunta || '';
  document.getElementById('faqRespuesta').value = item?.respuesta || '';
  document.getElementById('faqOrden').value = item?.orden ?? 0;
  document.getElementById('faqModalTitle').textContent = item ? 'Editar Pregunta' : 'Nueva Pregunta';
  const statusEl = document.getElementById('faqStatus');
  if (statusEl) { statusEl.textContent = ''; statusEl.classList.add('hidden'); }
  document.getElementById('faqModal').classList.remove('hidden');
  document.getElementById('faqPregunta').focus();
}

function closeFaqModal() {
  document.getElementById('faqModal').classList.add('hidden');
  document.getElementById('formFaq').reset();
}

async function handleSaveFaq() {
  const id = document.getElementById('faqId').value;
  const pregunta = document.getElementById('faqPregunta').value.trim();
  const respuesta = document.getElementById('faqRespuesta').value.trim();
  const orden = document.getElementById('faqOrden').value;
  const statusEl = document.getElementById('faqStatus');

  if (!pregunta || !respuesta) {
    if (statusEl) { statusEl.textContent = 'Pregunta y respuesta son requeridas.'; statusEl.className = 'status-msg error'; statusEl.classList.remove('hidden'); }
    return;
  }

  try {
    const url = id ? `${API_BASE_URL}/faq/${id}` : `${API_BASE_URL}/faq`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ pregunta, respuesta, orden: parseInt(orden) || 0 }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error guardando FAQ');
    toast(id ? 'Pregunta actualizada' : 'Pregunta creada exitosamente', 'success');
    closeFaqModal();
    loadFaqAdmin();
  } catch (err) {
    if (statusEl) { statusEl.textContent = `Error: ${err.message}`; statusEl.className = 'status-msg error'; statusEl.classList.remove('hidden'); }
  }
}

async function loadFaqAdmin() {
  const container = document.getElementById('faqAdminList');
  if (!container) return;
  container.innerHTML = '<p class="empty-state">Cargando preguntas...</p>';
  try {
    const res = await fetch(`${API_BASE_URL}/faq/admin`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Error cargando FAQ');
    const items = await res.json();

    if (!items.length) {
      container.innerHTML = '<p class="empty-state">No hay preguntas en el FAQ aún. Crea la primera.</p>';
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="content-item">
        <div class="item-info">
          <h4>${escapeHTML(item.pregunta)}</h4>
          <p style="color:var(--text-secondary);font-size:0.85rem;">${escapeHTML(item.respuesta).substring(0, 100)}...</p>
          <p style="font-size:0.8rem;color:var(--text-muted);">Orden: ${item.orden} | ${item.activo ? 'Visible' : 'Oculta'}</p>
        </div>
        <div class="content-actions">
          <button class="btn-mini" onclick='openFaqModal(${JSON.stringify(item).replace(/'/g, "&#39;")})'>Editar</button>
          <button class="btn-mini" onclick="handleToggleFaq(${item.id}, ${item.activo ? 0 : 1})">${item.activo ? 'Ocultar' : 'Mostrar'}</button>
          <button class="btn-mini danger" onclick="handleDeleteFaq(${item.id})">Eliminar</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-text">Error: ${escapeHTML(err.message)}</p>`;
  }
}

async function handleToggleFaq(id, activo) {
  try {
    const res = await fetch(`${API_BASE_URL}/faq/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo }),
    });
    if (!res.ok) throw new Error('Error');
    toast(activo ? 'Pregunta visible' : 'Pregunta ocultada', 'success');
    loadFaqAdmin();
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
  }
}

async function handleDeleteFaq(id) {
  const confirmed = await showConfirm('\u00bfEliminar esta pregunta del FAQ permanentemente?');
  if (!confirmed) return;
  try {
    const res = await fetch(`${API_BASE_URL}/faq/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Error eliminando');
    toast('Pregunta eliminada', 'success');
    loadFaqAdmin();
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
  }
}

// ==================== COLLAPSE TOGGLE (Campos académicos) ====================
function toggleCollapse(bodyId) {
  const body  = document.getElementById(bodyId);
  const arrow = document.getElementById(bodyId === 'academicFields' ? 'academicArrow' : 'noticiaArrow');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display  = isOpen ? 'none' : 'block';
  if (arrow) arrow.textContent = isOpen ? '▸' : '▾';
}

// ==================== CHAR COUNTER ====================
function setupCharCounter(inputId, counterId, maxLen) {
  const el  = document.getElementById(inputId);
  const cnt = document.getElementById(counterId);
  if (!el || !cnt) return;
  const update = () => {
    const len = el.value.length;
    cnt.textContent = len;
    cnt.style.color = len > maxLen * 0.9 ? '#ff6b6b' : '';
  };
  el.addEventListener('input', update);
  update();
}

