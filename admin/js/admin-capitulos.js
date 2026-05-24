(function () {
  let capitulos = [];
  const UPLOADS = window.API_BASE_URL
    ? window.API_BASE_URL.replace(/\/api\/?$/, '')
    : window.location.origin;

  function resolveUploadUrl(path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads/')) return UPLOADS + path;
    return '/' + path;
  }

  // Clave especial para ocultar/mostrar capítulos
  var CAP_ADMIN_PWD = 'RAMADMIN2025';

  // Ayudante: puede el usuario editar este capítulo?
  function canEdit(cap) {
    var user = getUser();
    if (!user) return false;
    if (user.rol === 'director_rama') return true;
    return user.rol === 'director_capitulo' && user.capitulo === cap.slug;
  }

  function allowedCapitulos() {
    return capitulos.filter(canEdit);
  }

  // Listar capitulos en la tab
  async function load() {
    var container = document.getElementById('capitulosAdminList');
    if (!container) return;
    container.innerHTML = '<p class="empty-state">Cargando cap\u00edtulos...</p>';
    try {
      // Use admin version to get ALL chapters (including hidden)
      var fetchFn = (typeof getCapitulosAdmin === 'function') ? getCapitulosAdmin : getCapitulos;
      capitulos = await fetchFn();
      var list = allowedCapitulos();

      if (!list.length) {
        container.innerHTML = '<p class="empty-state">No hay cap\u00edtulos disponibles para tu cuenta.</p>';
        return;
      }

      container.innerHTML = list.map(function(cap) {
        var logoUrl = resolveUploadUrl(cap.logo_path);
        var visible = cap.activo !== 0; // activo=1 means visible
        var logoHtml = logoUrl
          ? '<img src="' + logoUrl + '" style="width:40px;height:40px;border-radius:50%;object-fit:contain;background:rgba(0,98,155,.15);border:1px solid rgba(0,153,214,.25);" alt="">'
          : '<div style="width:40px;height:40px;border-radius:50%;background:rgba(0,98,155,.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.7rem;color:#7fc8f5;">' + escapeHTML(cap.siglas || '?') + '</div>';
        var hiddenBadge = !visible
          ? '<span style="font-size:.7rem;background:rgba(239,68,68,.2);color:#f87171;border:1px solid rgba(239,68,68,.4);padding:1px 7px;border-radius:10px;vertical-align:middle;margin-left:6px;">Oculto</span>'
          : '';
        var isDirectorRama = getUser() && getUser().rol === 'director_rama';
        var toggleBtn = isDirectorRama
          ? '<button class="btn-mini" data-toggle-visible="' + escapeHTML(cap.slug) + '" data-visible="' + (visible ? '1' : '0') + '">' +
              (visible ? 'Ocultar' : 'Mostrar') +
            '</button>'
          : '';

        return (
          '<div class="content-item">' +
            '<div class="item-info" style="display:flex;align-items:center;gap:14px;">' +
              logoHtml +
              '<div>' +
                '<h4>' + escapeHTML(cap.nombre) + hiddenBadge + '</h4>' +
                '<p>' + escapeHTML(cap.siglas || cap.slug) + ' \u00b7 ' + escapeHTML(cap.descripcion_corta || '') + '</p>' +
              '</div>' +
            '</div>' +
            '<div class="approval-buttons">' +
              '<button class="btn-aprobar" data-edit-capitulo="' + escapeHTML(cap.slug) + '">Editar</button>' +
              toggleBtn +
            '</div>' +
          '</div>'
        );
      }).join('');

      container.querySelectorAll('[data-edit-capitulo]').forEach(function(btn) {
        btn.addEventListener('click', function() { openModal(btn.dataset.editCapitulo); });
      });

      container.querySelectorAll('[data-toggle-visible]').forEach(function(btn) {
        btn.addEventListener('click', function() { handleToggleVisible(btn); });
      });
    } catch (err) {
      container.innerHTML = '<p class="error-text">Error: ' + escapeHTML(err.message) + '</p>';
    }
  }

  // Abrir modal con datos del capitulo
  async function openModal(slug) {
    var modal = document.getElementById('capituloModal');
    if (!modal) return;

    switchCapTab('info');

    var cap;
    try {
      cap = await getCapitulo(slug);
    } catch (e) {
      alert('No se pudo cargar el cap\u00edtulo: ' + e.message);
      return;
    }

    // Tab 1: Informacion
    setVal('capituloSlug',      cap.slug);
    setVal('capituloNombre',    cap.nombre);
    setVal('capituloSiglas',    cap.siglas);
    setVal('capituloFecha',     cap.fecha_fundacion ? cap.fecha_fundacion.slice(0, 10) : '');
    setVal('capituloDescCorta', cap.descripcion_corta);
    setVal('capituloDescLarga', cap.descripcion_larga);
    setVal('capituloMision',    cap.mision);
    setVal('capituloVision',    cap.vision);

    var colorVal   = cap.color || '#00629b';
    var colorPicker = document.getElementById('capituloColor');
    var colorHex    = document.getElementById('capituloColorHex');
    if (colorPicker) colorPicker.value = colorVal;
    if (colorHex)    colorHex.value    = colorVal;
    updateCharCount('capituloDescCorta', 'capituloDescCortaCount', 300);

    // Tab 2: Imagenes
    var logoPreview    = document.getElementById('capituloLogoPreview');
    var portadaPreview = document.getElementById('capituloPortadaPreview');
    if (logoPreview) {
      logoPreview.innerHTML = cap.logo_path
        ? '<img src="' + resolveUploadUrl(cap.logo_path) + '" alt="Logo" style="width:80px;height:80px;border-radius:50%;object-fit:contain;">'
        : 'Sin logo';
    }
    if (portadaPreview) {
      portadaPreview.innerHTML = cap.imagen_portada_path
        ? '<img src="' + resolveUploadUrl(cap.imagen_portada_path) + '" alt="Portada" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">'
        : 'Sin portada';
    }

    // Tab 3: Contacto y Redes
    var redes = safeParseJSON(cap.redes_json, {});
    setVal('capituloEmail',     cap.email_contacto);
    setVal('capituloTelefono',  redes.telefono  || '');
    setVal('capituloWeb',       cap.link_externo);
    setVal('capituloFacebook',  redes.facebook  || '');
    setVal('capituloInstagram', redes.instagram || '');
    setVal('capituloLinkedin',  redes.linkedin  || '');
    setVal('capituloYoutube',   redes.youtube   || '');
    setVal('capituloTiktok',    redes.tiktok    || '');

    resetFile('capituloLogo');
    resetFile('capituloPortada');

    modal.classList.remove('hidden');
    document.getElementById('capituloNombre') && document.getElementById('capituloNombre').focus();
  }

  function closeModal() {
    var m = document.getElementById('capituloModal');
    if (m) m.classList.add('hidden');
  }

  function switchCapTab(tabName) {
    document.querySelectorAll('.cap-tab').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.capTab === tabName);
      btn.setAttribute('aria-selected', btn.dataset.capTab === tabName);
    });
    document.querySelectorAll('.cap-tab-panel').forEach(function(panel) {
      panel.classList.toggle('active', panel.id === 'cap-panel-' + tabName);
    });
  }

  // Guardar capitulo
  async function saveCapitulo(event) {
    event.preventDefault();

    var socialIds = ['capituloFacebook', 'capituloInstagram', 'capituloLinkedin', 'capituloYoutube', 'capituloTiktok', 'capituloWeb'];
    var badUrls = socialIds.some(function(id) {
      var val = document.getElementById(id) && document.getElementById(id).value.trim();
      if (!val) return false;
      try { new URL(val); return false; }
      catch (e) { return true; }
    });
    var errEl = document.getElementById('capSocialUrlError');
    if (errEl) errEl.style.display = badUrls ? 'block' : 'none';
    if (badUrls) { switchCapTab('contact'); return; }

    var slug = document.getElementById('capituloSlug').value;
    var redes = {};
    ['telefono', 'facebook', 'instagram', 'linkedin', 'youtube', 'tiktok'].forEach(function(field) {
      var elId = 'capitulo' + field.charAt(0).toUpperCase() + field.slice(1);
      var val = document.getElementById(elId) && document.getElementById(elId).value.trim();
      if (val) redes[field] = val;
    });

    var hexInput = document.getElementById('capituloColorHex') && document.getElementById('capituloColorHex').value.trim();
    var colorVal = /^#[0-9a-fA-F]{6}$/.test(hexInput) ? hexInput
      : (document.getElementById('capituloColor') && document.getElementById('capituloColor').value || undefined);

    var payload = {
      nombre:            (document.getElementById('capituloNombre') && document.getElementById('capituloNombre').value.trim())    || undefined,
      siglas:            (document.getElementById('capituloSiglas') && document.getElementById('capituloSiglas').value.trim())    || undefined,
      descripcion_corta: (document.getElementById('capituloDescCorta') && document.getElementById('capituloDescCorta').value.trim()) || undefined,
      descripcion_larga: (document.getElementById('capituloDescLarga') && document.getElementById('capituloDescLarga').value.trim()) || undefined,
      mision:            (document.getElementById('capituloMision') && document.getElementById('capituloMision').value.trim())    || undefined,
      vision:            (document.getElementById('capituloVision') && document.getElementById('capituloVision').value.trim())    || undefined,
      fecha_fundacion:   (document.getElementById('capituloFecha') && document.getElementById('capituloFecha').value)             || undefined,
      email_contacto:    (document.getElementById('capituloEmail') && document.getElementById('capituloEmail').value.trim())     || undefined,
      link_externo:      (document.getElementById('capituloWeb') && document.getElementById('capituloWeb').value.trim())         || undefined,
      color:             colorVal,
      redes_json:        JSON.stringify(redes),
    };

    var btn = document.getElementById('capituloSubmitBtn');
    if (btn) { btn.textContent = 'Guardando\u2026'; btn.disabled = true; }

    try {
      var result   = await updateCapitulo(slug, payload);
      var nextSlug = result.slug || slug;
      var logo     = document.getElementById('capituloLogo') && document.getElementById('capituloLogo').files[0];
      var portada  = document.getElementById('capituloPortada') && document.getElementById('capituloPortada').files[0];
      if (logo)    { var fd1 = new FormData(); fd1.append('logo', logo);       await uploadCapituloArchivo(nextSlug, fd1); }
      if (portada) { var fd2 = new FormData(); fd2.append('portada', portada); await uploadCapituloArchivo(nextSlug, fd2); }
      showStatus('capituloStatus', 'Cap\u00edtulo actualizado correctamente', 'success');
      await load();
      setTimeout(closeModal, 900);
    } catch (err) {
      showStatus('capituloStatus', 'Error: ' + err.message, 'error');
    } finally {
      if (btn) { btn.textContent = 'Guardar Cap\u00edtulo'; btn.disabled = false; }
    }
  }

  // Toggle visibilidad de capitulo (protegido con clave especial)
  function handleToggleVisible(btn) {
    var slug    = btn.dataset.toggleVisible;
    var current = btn.dataset.visible === '1';
    var action  = current ? 'ocultar' : 'mostrar';

    return new Promise(function(resolve) {
      var modal     = document.getElementById('confirmModal');
      var titleEl   = document.getElementById('confirmModalTitle');
      var msgEl     = document.getElementById('confirmModalMessage');
      var acceptBtn = document.getElementById('confirmModalAcceptBtn');
      var cancelBtn = document.getElementById('confirmModalCancelBtn');

      if (!modal || !titleEl || !msgEl) {
        // Fallback
        var pwd = prompt('Ingresa la clave de administrador para ' + action + ' el cap\u00edtulo "' + slug + '":');
        if (pwd === CAP_ADMIN_PWD) {
          updateCapitulo(slug, { visible: current ? 0 : 1 })
            .then(function() { if (typeof toast === 'function') toast('Cap\u00edtulo ' + (current ? 'ocultado' : 'mostrado') + '.', 'success'); return load(); })
            .catch(function(e) { if (typeof toast === 'function') toast('Error: ' + e.message, 'error'); });
        } else if (pwd !== null) {
          if (typeof toast === 'function') toast('Clave incorrecta.', 'error');
        }
        resolve(false);
        return;
      }

      titleEl.textContent = 'Acci\u00f3n protegida';
      msgEl.innerHTML =
        '<p style="margin-bottom:10px;color:var(--text-secondary);">Para <strong>' + action + '</strong> el cap\u00edtulo <strong>' + escapeHTML(slug) + '</strong> ingresa la clave de administrador:</p>' +
        '<input id="_capPwdInput" type="password" autocomplete="off" ' +
        'style="width:100%;padding:9px 12px;border:1px solid var(--border-card);border-radius:6px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;" ' +
        'placeholder="Clave especial de administrador">';
      acceptBtn.textContent = current ? 'Ocultar cap\u00edtulo' : 'Mostrar cap\u00edtulo';
      acceptBtn.className   = current ? 'btn-primary danger' : 'btn-primary';
      modal.classList.remove('hidden');
      setTimeout(function() { var el = document.getElementById('_capPwdInput'); if (el) el.focus(); }, 80);

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
        var el  = document.getElementById('_capPwdInput');
        var pwd = el ? el.value : '';
        cleanup();
        if (pwd !== CAP_ADMIN_PWD) {
          if (typeof toast === 'function') toast('Clave incorrecta. Acci\u00f3n cancelada.', 'error');
          resolve(false);
          return;
        }
        try {
          await updateCapitulo(slug, { visible: current ? 0 : 1 });
          if (typeof toast === 'function') toast('Cap\u00edtulo ' + (current ? 'ocultado' : 'mostrado') + ' correctamente.', 'success');
          await load();
        } catch (err) {
          if (typeof toast === 'function') toast('Error: ' + err.message, 'error');
        }
        resolve(true);
      };
      cancelBtn.onclick = function() { cleanup(); resolve(false); };
    });
  }

  // Helpers
  function setVal(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value || '';
  }

  function resetFile(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  }

  function updateCharCount(textareaId, countId, max) {
    var ta    = document.getElementById(textareaId);
    var count = document.getElementById(countId);
    if (!ta || !count) return;
    count.textContent = ta.value.length + ' / ' + max;
    ta.addEventListener('input', function() {
      count.textContent = ta.value.length + ' / ' + max;
    });
  }

  function safeParseJSON(str, fallback) {
    try { return str ? JSON.parse(str) : fallback; }
    catch (e) { return fallback; }
  }

  // Init listeners
  document.addEventListener('DOMContentLoaded', function() {
    var closeCapBtn   = document.getElementById('closeCapituloModal');
    var cancelCapBtn  = document.getElementById('cancelCapituloModal');
    var capModal      = document.getElementById('capituloModal');
    var capForm       = document.getElementById('formCapituloEditor');
    var colorPickerEl = document.getElementById('capituloColor');
    var colorHexEl    = document.getElementById('capituloColorHex');
    var logoInput     = document.getElementById('capituloLogo');
    var portadaInput  = document.getElementById('capituloPortada');

    if (closeCapBtn)  closeCapBtn.addEventListener('click', closeModal);
    if (cancelCapBtn) cancelCapBtn.addEventListener('click', closeModal);
    if (capModal)     capModal.addEventListener('click', function(e) { if (e.target === capModal) closeModal(); });
    if (capForm)      capForm.addEventListener('submit', saveCapitulo);

    document.querySelectorAll('.cap-tab').forEach(function(btn) {
      btn.addEventListener('click', function() { switchCapTab(btn.dataset.capTab); });
    });

    if (colorPickerEl) {
      colorPickerEl.addEventListener('input', function(e) {
        if (colorHexEl) colorHexEl.value = e.target.value;
      });
    }
    if (colorHexEl) {
      colorHexEl.addEventListener('input', function(e) {
        var val = e.target.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(val) && colorPickerEl) colorPickerEl.value = val;
      });
    }

    if (logoInput) {
      logoInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var preview = document.getElementById('capituloLogoPreview');
        if (preview) preview.innerHTML = '<img src="' + URL.createObjectURL(file) + '" alt="" style="width:80px;height:80px;border-radius:50%;object-fit:contain;">';
      });
    }
    if (portadaInput) {
      portadaInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var preview = document.getElementById('capituloPortadaPreview');
        if (preview) preview.innerHTML = '<img src="' + URL.createObjectURL(file) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">';
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });
  });

  window.AdminCapitulos = { load: load };
})();
