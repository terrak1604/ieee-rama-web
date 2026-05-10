(function () {
  let capitulos = [];
  const UPLOADS = window.API_BASE_URL
    ? window.API_BASE_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:3000';

  // ── Ayudante: ¿puede el usuario editar este capítulo? ──
  function canEdit(cap) {
    const user = getUser();
    if (!user) return false;
    if (user.rol === 'director_rama') return true;
    return user.rol === 'director_capitulo' && user.capitulo === cap.slug;
  }

  function allowedCapitulos() {
    return capitulos.filter(canEdit);
  }

  // ════════════════════════════════════════
  //  Listar capítulos en la tab
  // ════════════════════════════════════════
  async function load() {
    const container = document.getElementById('capitulosAdminList');
    if (!container) return;
    container.innerHTML = '<p class="empty-state">Cargando capítulos...</p>';
    try {
      capitulos = await getCapitulos();
      const list = allowedCapitulos();
      container.innerHTML = list.length
        ? list.map((cap) => {
            const logoUrl = cap.logo_path
              ? `${UPLOADS}${cap.logo_path}`
              : null;
            return `
              <div class="content-item">
                <div class="item-info" style="display:flex;align-items:center;gap:14px;">
                  ${logoUrl
                    ? `<img src="${logoUrl}" style="width:40px;height:40px;border-radius:50%;object-fit:contain;background:rgba(0,98,155,.15);border:1px solid rgba(0,153,214,.25);" alt="">`
                    : `<div style="width:40px;height:40px;border-radius:50%;background:rgba(0,98,155,.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.7rem;color:#7fc8f5;">${escapeHTML(cap.siglas||'?')}</div>`}
                  <div>
                    <h4>${escapeHTML(cap.nombre)}</h4>
                    <p>${escapeHTML(cap.siglas || cap.slug)} · ${escapeHTML(cap.descripcion_corta || '')}</p>
                  </div>
                </div>
                <div class="approval-buttons">
                  <button class="btn-aprobar" data-edit-capitulo="${escapeHTML(cap.slug)}">Editar</button>
                </div>
              </div>`;
          }).join('')
        : '<p class="empty-state">No hay capítulos disponibles para tu cuenta.</p>';

      container.querySelectorAll('[data-edit-capitulo]').forEach((btn) =>
        btn.addEventListener('click', () => openModal(btn.dataset.editCapitulo))
      );
    } catch (err) {
      container.innerHTML = `<p class="error-text">Error: ${escapeHTML(err.message)}</p>`;
    }
  }

  // ════════════════════════════════════════
  //  Abrir modal con datos del capítulo
  // ════════════════════════════════════════
  async function openModal(slug) {
    const modal = document.getElementById('capituloModal');
    if (!modal) return;

    // Activar primera tab
    switchCapTab('info');

    let cap;
    try {
      cap = await getCapitulo(slug);
    } catch (e) {
      alert('No se pudo cargar el capítulo: ' + e.message);
      return;
    }

    // ── Tab 1: Información ──
    setVal('capituloSlug',     cap.slug);
    setVal('capituloNombre',   cap.nombre);
    setVal('capituloSiglas',   cap.siglas);
    setVal('capituloFecha',    cap.fecha_fundacion ? cap.fecha_fundacion.slice(0, 10) : '');
    setVal('capituloDescCorta', cap.descripcion_corta);
    setVal('capituloDescLarga', cap.descripcion_larga);
    setVal('capituloMision',   cap.mision);
    setVal('capituloVision',   cap.vision);
    // Color picker
    const colorVal = cap.color || '#00629b';
    const colorPicker = document.getElementById('capituloColor');
    const colorHex    = document.getElementById('capituloColorHex');
    if (colorPicker) colorPicker.value = colorVal;
    if (colorHex)    colorHex.value    = colorVal;
    updateCharCount('capituloDescCorta', 'capituloDescCortaCount', 300);

    // ── Tab 2: Imágenes ──
    const logoPreview    = document.getElementById('capituloLogoPreview');
    const portadaPreview = document.getElementById('capituloPortadaPreview');
    if (logoPreview) {
      logoPreview.innerHTML = cap.logo_path
        ? `<img src="${UPLOADS}${cap.logo_path}" alt="Logo" style="width:80px;height:80px;border-radius:50%;object-fit:contain;">`
        : 'Sin logo';
    }
    if (portadaPreview) {
      portadaPreview.innerHTML = cap.imagen_portada_path
        ? `<img src="${UPLOADS}${cap.imagen_portada_path}" alt="Portada" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`
        : 'Sin portada';
    }

    // ── Tab 3: Contacto y Redes ──
    const redes = safeParseJSON(cap.redes_json, {});
    setVal('capituloEmail',    cap.email_contacto);
    setVal('capituloTelefono', redes.telefono || '');
    setVal('capituloWeb',      cap.link_externo);
    setVal('capituloFacebook', redes.facebook  || '');
    setVal('capituloInstagram', redes.instagram || '');
    setVal('capituloLinkedin', redes.linkedin   || '');
    setVal('capituloYoutube',  redes.youtube    || '');
    setVal('capituloTiktok',   redes.tiktok     || '');

    // Reset file inputs
    resetFile('capituloLogo');
    resetFile('capituloPortada');

    modal.classList.remove('hidden');
    document.getElementById('capituloNombre')?.focus();
  }

  function closeModal() {
    document.getElementById('capituloModal')?.classList.add('hidden');
  }

  // ════════════════════════════════════════
  //  Tabs del modal
  // ════════════════════════════════════════
  function switchCapTab(tabName) {
    document.querySelectorAll('.cap-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.capTab === tabName);
      btn.setAttribute('aria-selected', btn.dataset.capTab === tabName);
    });
    document.querySelectorAll('.cap-tab-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === `cap-panel-${tabName}`);
    });
  }

  // ════════════════════════════════════════
  //  Guardar capítulo (F.4: permisos validados en backend)
  // ════════════════════════════════════════
  async function saveCapitulo(event) {
    event.preventDefault();

    // Validar URLs de redes sociales
    const socialIds = ['capituloFacebook', 'capituloInstagram', 'capituloLinkedin', 'capituloYoutube', 'capituloTiktok', 'capituloWeb'];
    const badUrls   = socialIds.some((id) => {
      const val = document.getElementById(id)?.value.trim();
      if (!val) return false;
      try { new URL(val); return false; }
      catch { return true; }
    });
    const errEl = document.getElementById('capSocialUrlError');
    if (errEl) errEl.style.display = badUrls ? 'block' : 'none';
    if (badUrls) { switchCapTab('contact'); return; }

    const slug = document.getElementById('capituloSlug').value;
    const redes = {
      telefono:  document.getElementById('capituloTelefono')?.value.trim() || undefined,
      facebook:  document.getElementById('capituloFacebook')?.value.trim() || undefined,
      instagram: document.getElementById('capituloInstagram')?.value.trim() || undefined,
      linkedin:  document.getElementById('capituloLinkedin')?.value.trim() || undefined,
      youtube:   document.getElementById('capituloYoutube')?.value.trim() || undefined,
      tiktok:    document.getElementById('capituloTiktok')?.value.trim() || undefined,
    };
    // Eliminar claves vacías
    Object.keys(redes).forEach((k) => { if (!redes[k]) delete redes[k]; });

    const hexInput = document.getElementById('capituloColorHex')?.value.trim();
    const colorVal = /^#[0-9a-fA-F]{6}$/.test(hexInput) ? hexInput
      : (document.getElementById('capituloColor')?.value || undefined);

    const payload = {
      nombre:           document.getElementById('capituloNombre')?.value.trim() || undefined,
      siglas:           document.getElementById('capituloSiglas')?.value.trim() || undefined,
      descripcion_corta: document.getElementById('capituloDescCorta')?.value.trim() || undefined,
      descripcion_larga: document.getElementById('capituloDescLarga')?.value.trim() || undefined,
      mision:           document.getElementById('capituloMision')?.value.trim() || undefined,
      vision:           document.getElementById('capituloVision')?.value.trim() || undefined,
      fecha_fundacion:  document.getElementById('capituloFecha')?.value || undefined,
      email_contacto:   document.getElementById('capituloEmail')?.value.trim() || undefined,
      link_externo:     document.getElementById('capituloWeb')?.value.trim() || undefined,
      color:            colorVal,
      redes_json:       JSON.stringify(redes),
    };

    const btn = document.getElementById('capituloSubmitBtn');
    if (btn) { btn.textContent = 'Guardando…'; btn.disabled = true; }

    try {
      const result = await updateCapitulo(slug, payload);
      const nextSlug = result.slug || slug;

      // Subir archivos si se seleccionaron
      const logo    = document.getElementById('capituloLogo')?.files[0];
      const portada = document.getElementById('capituloPortada')?.files[0];
      if (logo)    { const fd = new FormData(); fd.append('logo', logo);       await uploadCapituloArchivo(nextSlug, fd); }
      if (portada) { const fd = new FormData(); fd.append('portada', portada); await uploadCapituloArchivo(nextSlug, fd); }

      showStatus('capituloStatus', '✅ Capítulo actualizado correctamente', 'success');
      await load();
      setTimeout(closeModal, 900);
    } catch (err) {
      showStatus('capituloStatus', `❌ Error: ${err.message}`, 'error');
    } finally {
      if (btn) { btn.textContent = 'Guardar Capítulo'; btn.disabled = false; }
    }
  }

  // ════════════════════════════════════════
  //  Helpers
  // ════════════════════════════════════════
  function setVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
  }

  function resetFile(id) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  }

  function updateCharCount(textareaId, countId, max) {
    const ta    = document.getElementById(textareaId);
    const count = document.getElementById(countId);
    if (!ta || !count) return;
    count.textContent = `${ta.value.length} / ${max}`;
    ta.addEventListener('input', () => {
      count.textContent = `${ta.value.length} / ${max}`;
    });
  }

  function safeParseJSON(str, fallback) {
    try { return str ? JSON.parse(str) : fallback; }
    catch { return fallback; }
  }

  // ════════════════════════════════════════
  //  Init listeners
  // ════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', () => {
    // Cerrar modal
    document.getElementById('closeCapituloModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelCapituloModal')?.addEventListener('click', closeModal);
    document.getElementById('capituloModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

    // Submit
    document.getElementById('formCapituloEditor')?.addEventListener('submit', saveCapitulo);

    // Tab navigation
    document.querySelectorAll('.cap-tab').forEach((btn) => {
      btn.addEventListener('click', () => switchCapTab(btn.dataset.capTab));
    });

    // Color picker ↔ hex input sync
    document.getElementById('capituloColor')?.addEventListener('input', (e) => {
      const hexEl = document.getElementById('capituloColorHex');
      if (hexEl) hexEl.value = e.target.value;
    });
    document.getElementById('capituloColorHex')?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        const picker = document.getElementById('capituloColor');
        if (picker) picker.value = val;
      }
    });

    // Preview de imágenes seleccionadas
    document.getElementById('capituloLogo')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const preview = document.getElementById('capituloLogoPreview');
      if (preview) preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="" style="width:80px;height:80px;border-radius:50%;object-fit:contain;">`;
    });
    document.getElementById('capituloPortada')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const preview = document.getElementById('capituloPortadaPreview');
      if (preview) preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`;
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  });

  window.AdminCapitulos = { load };
})();
