(function () {
  let quill = null;
  let selectedFiles = [];   // { file, caption }[]
  let existingAttachments = [];
  let editingId = null;
  let initialized = false;
  let autosaveTimer = null;
  let dragSrcIndex = null;

  const DRAFT_KEY = 'ieee_editor_draft';

  // ══════════════════════════════════════════
  //  E.1 — Inicialización
  // ══════════════════════════════════════════
  async function init() {
    if (!initialized) {
      setupQuill();
      setupDropZone();
      setupSubmit();
      restoreDraft();
      startAutosave();
      initialized = true;
    }
    await loadCapituloOptions();
  }

  // ══════════════════════════════════════════
  //  E.1 — Quill con toolbar completa
  // ══════════════════════════════════════════
  function setupQuill() {
    if (!window.Quill || quill) return;
    quill = new Quill('#quillEditor', {
      theme: 'snow',
      placeholder: 'Escribe el cuerpo del artículo...',
      modules: {
        toolbar: [
          [{ header: [2, 3, 4, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          ['link', 'blockquote', 'code-block'],
          ['clean'],
        ],
      },
    });

    // Cambio en el editor activa el autosave
    quill.on('text-change', scheduleSave);
  }

  // ══════════════════════════════════════════
  //  Capítulos del usuario
  // ══════════════════════════════════════════
  async function loadCapituloOptions() {
    const select = document.getElementById('editorCapitulo');
    if (!select) return;
    const user = getUser();
    const capitulos = await getCapitulos();
    const list = user?.rol === 'director_rama'
      ? capitulos
      : capitulos.filter((cap) => cap.slug === user?.capitulo);

    select.innerHTML = list
      .map((cap) => `<option value="${escapeHTML(cap.slug)}">${escapeHTML(cap.nombre)}</option>`)
      .join('');
  }

  // ══════════════════════════════════════════
  //  E.3 — Drop zone + file list con captions y reorden
  // ══════════════════════════════════════════
  function setupDropZone() {
    const drop  = document.getElementById('dropAdjuntos');
    const input = document.getElementById('editorAdjuntos');
    if (!drop || !input) return;

    drop.addEventListener('click', () => input.click());

    drop.addEventListener('dragover', (e) => {
      e.preventDefault();
      drop.classList.add('dragover');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('dragover');
      addFiles(e.dataTransfer.files);
    });

    input.addEventListener('change', () => {
      addFiles(input.files);
      input.value = '';   // permite volver a seleccionar el mismo archivo
    });
  }

  function addFiles(fileList) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    const incoming = Array.from(fileList || [])
      .filter((f) => allowed.includes(f.type))
      .map((f) => ({ file: f, caption: '' }));

    selectedFiles = [...selectedFiles, ...incoming].slice(0, 10);
    renderAttachments();
    scheduleSave();
  }

  // ── Render lista de adjuntos con captions y drag-reorder ──
  function renderAttachments() {
    const preview = document.getElementById('adjuntosPreview');
    if (!preview) return;

    if (!selectedFiles.length && !existingAttachments.length) {
      preview.innerHTML = '<p class="attach-empty">Sin adjuntos</p>';
      return;
    }

    const baseUrl = API_BASE_URL.replace('/api', '');
    const existingHTML = existingAttachments.map((item) => {
      const isImage = item.mime_type?.startsWith('image/') || item.tipo === 'imagen';
      const src = `${baseUrl}${item.archivo_path}`;
      const thumb = isImage
        ? `<img src="${src}" class="attach-thumb" alt="">`
        : `<span class="attach-pdf-icon">PDF</span>`;
      return `
        <div class="attach-item attach-existing" data-existing-id="${item.id}">
          <span class="attach-handle" title="Adjunto publicado">✓</span>
          ${thumb}
          <div class="attach-info">
            <span class="attach-name">${escapeHTML(item.nombre_original || item.archivo_path)}</span>
            <span class="attach-caption-read">${escapeHTML(item.caption || 'Sin descripción')}</span>
          </div>
          <button type="button" class="attach-remove" data-remove-existing="${item.id}" title="Eliminar adjunto">✕</button>
        </div>`;
    }).join('');

    const selectedHTML = selectedFiles.map((item, i) => {
      const isImage = item.file.type.startsWith('image/');
      const thumb   = isImage
        ? `<img src="${URL.createObjectURL(item.file)}" class="attach-thumb" alt="">`
        : `<span class="attach-pdf-icon">PDF</span>`;
      return `
        <div class="attach-item" draggable="true" data-index="${i}">
          <span class="attach-handle" title="Arrastrar para reordenar">⠿</span>
          ${thumb}
          <div class="attach-info">
            <span class="attach-name">${escapeHTML(item.file.name)}</span>
            <input
              type="text"
              class="attach-caption"
              placeholder="Descripción (opcional)"
              value="${escapeHTML(item.caption)}"
              data-caption-index="${i}"
            >
          </div>
          <button type="button" class="attach-remove" data-remove="${i}" title="Eliminar">✕</button>
        </div>`;
    }).join('');

    preview.innerHTML = existingHTML + selectedHTML;

    // Caption listeners
    preview.querySelectorAll('.attach-caption').forEach((input) => {
      input.addEventListener('input', (e) => {
        const idx = Number(e.target.dataset.captionIndex);
        selectedFiles[idx].caption = e.target.value;
        scheduleSave();
      });
    });

    // Remove listeners
    preview.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedFiles.splice(Number(btn.dataset.remove), 1);
        renderAttachments();
        scheduleSave();
      });
    });

    preview.querySelectorAll('[data-remove-existing]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!editingId) return;
        const confirmed = await showConfirm('¿Eliminar este adjunto del artículo?');
        if (!confirmed) return;
        try {
          await deleteContenidoArchivo(editingId, btn.dataset.removeExisting);
          existingAttachments = existingAttachments.filter((item) => String(item.id) !== String(btn.dataset.removeExisting));
          renderAttachments();
          toast('Adjunto eliminado', 'success');
        } catch (err) {
          toast(`Error: ${err.message}`, 'error');
        }
      });
    });

    // Drag-and-drop reorder
    const items = preview.querySelectorAll('.attach-item[draggable="true"]');
    items.forEach((el) => {
      el.addEventListener('dragstart', (e) => {
        dragSrcIndex = Number(el.dataset.index);
        e.dataTransfer.effectAllowed = 'move';
        el.classList.add('dragging');
      });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        items.forEach((i) => i.classList.remove('drag-over'));
        el.classList.add('drag-over');
      });
      el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetIndex = Number(el.dataset.index);
        if (dragSrcIndex === null || dragSrcIndex === targetIndex) return;
        const [moved] = selectedFiles.splice(dragSrcIndex, 1);
        selectedFiles.splice(targetIndex, 0, moved);
        dragSrcIndex = null;
        renderAttachments();
        scheduleSave();
      });
    });
  }

  // ══════════════════════════════════════════
  //  E.4 — Autosave de borrador en localStorage
  // ══════════════════════════════════════════
  function scheduleSave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(saveDraft, 30000);   // 30s inactividad
  }

  function saveDraft() {
    try {
      const draft = {
        tipo:        document.getElementById('editorTipo')?.value,
        titulo:      document.getElementById('editorTitulo')?.value,
        extracto:    document.getElementById('editorExtracto')?.value,
        etiquetas:   document.getElementById('editorEtiquetas')?.value,
        lugar:       document.getElementById('editorLugar')?.value,
        fecha:       document.getElementById('editorFechaEvento')?.value,
        link:        document.getElementById('editorLink')?.value,
        cuerpo:      quill ? quill.root.innerHTML : '',
        savedAt:     new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      showDraftBadge(draft.savedAt);
    } catch (_) { /* quota exceeded o iframe */ }
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.titulo) document.getElementById('editorTitulo').value = draft.titulo;
      if (draft.extracto) document.getElementById('editorExtracto').value = draft.extracto;
      if (draft.etiquetas) document.getElementById('editorEtiquetas').value = draft.etiquetas;
      if (draft.lugar)  document.getElementById('editorLugar').value  = draft.lugar;
      if (draft.fecha)  document.getElementById('editorFechaEvento').value = draft.fecha;
      if (draft.link)   document.getElementById('editorLink').value = draft.link;
      if (draft.tipo) {
        const sel = document.getElementById('editorTipo');
        if (sel) sel.value = draft.tipo;
      }
      if (draft.cuerpo && quill) {
        quill.root.innerHTML = draft.cuerpo;
      }
      showDraftBadge(draft.savedAt);
    } catch (_) {}
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    const badge = document.getElementById('draftBadge');
    if (badge) badge.textContent = '';
  }

  function showDraftBadge(isoDate) {
    let badge = document.getElementById('draftBadge');
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'draftBadge';
      badge.className = 'draft-badge';
      document.getElementById('formEditorArticulo')?.prepend(badge);
    }
    const t = new Date(isoDate).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    badge.textContent = `💾 Borrador guardado a las ${t}`;
  }

  // Autosave inmediato en input change
  function startAutosave() {
    ['editorTitulo', 'editorExtracto', 'editorLugar', 'editorFechaEvento', 'editorTipo', 'editorEtiquetas', 'editorLink'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', scheduleSave);
      document.getElementById(id)?.addEventListener('change', scheduleSave);
    });
  }

  // ══════════════════════════════════════════
  //  Submit
  // ══════════════════════════════════════════
  function setupSubmit() {
    document.getElementById('formEditorArticulo')?.addEventListener('submit', saveArticle);
    document.getElementById('formEditorArticulo')?.addEventListener('reset', () => {
      selectedFiles = [];
      existingAttachments = [];
      editingId = null;
      renderAttachments();
      quill?.setContents([]);
      clearDraft();
      setEditorMode();
    });
  }

  async function saveArticle(event) {
    event.preventDefault();

    const btn = event.submitter || document.querySelector('#formEditorArticulo [type=submit]');
    const originalText = btn?.textContent;
    if (btn) { btn.textContent = 'Guardando…'; btn.disabled = true; }

    const formData = new FormData();
    formData.append('tipo',        document.getElementById('editorTipo').value);
    formData.append('titulo',      document.getElementById('editorTitulo').value.trim());
    formData.append('extracto',    document.getElementById('editorExtracto').value.trim());
    formData.append('descripcion', document.getElementById('editorExtracto').value.trim());
    const etiquetasInput = document.getElementById('editorEtiquetas');
    if (etiquetasInput) formData.append('etiquetas', etiquetasInput.value.trim());
    formData.append('capitulo',    document.getElementById('editorCapitulo').value);
    formData.append('cuerpo',      quill ? quill.root.innerHTML : '');
    formData.append('lugar',       document.getElementById('editorLugar').value.trim());
    formData.append('fecha_evento', document.getElementById('editorFechaEvento').value);
    formData.append('link',        document.getElementById('editorLink').value.trim());

    // --- Campos Académicos ---
    const abstract = document.getElementById('editorAbstract')?.value?.trim();
    if (abstract) formData.append('abstract', abstract);
    
    const doi = document.getElementById('editorDoi')?.value?.trim();
    if (doi) formData.append('doi', doi);
    
    const volumen = document.getElementById('editorVolumen')?.value?.trim();
    if (volumen) formData.append('publicacion_vol', volumen);
    
    const peerReviewed = document.getElementById('editorPeerReviewed')?.checked;
    formData.append('peer_reviewed', peerReviewed ? '1' : '0');
    
    const referencias = document.getElementById('editorReferencias')?.value?.trim();
    if (referencias) formData.append('referencias', referencias);

    // --- Campos Noticia Inmersiva ---
    const lead = document.getElementById('editorLeadParagraph')?.value?.trim();
    if (lead) formData.append('lead_paragraph', lead);
    
    const esDestacada = document.getElementById('editorEsDestacada')?.checked;
    formData.append('es_destacada', esDestacada ? '1' : '0');
    
    if (esDestacada) {
      const breaking = document.getElementById('editorBreakingLabel')?.value?.trim();
      if (breaking) formData.append('breaking_label', breaking);
    }


    const imagen = document.getElementById('editorImagen').files[0];
    if (imagen) formData.append('imagen', imagen);

    try {
      const result = editingId
        ? await updateContenidoAdmin(editingId, formData)
        : await createContenido(formData);
      const contentId = editingId || result.id;

      // Upload adjuntos con captions en el orden actual
      if (selectedFiles.length) {
        const filesData = new FormData();
        selectedFiles.forEach((item, i) => {
          filesData.append('archivos', item.file);
          filesData.append(`caption_${i}`, item.caption);
          filesData.append(`orden_${i}`, String(existingAttachments.length + i));
        });
        await uploadContenidoArchivos(contentId, filesData);
      }

      showStatus('editorStatus', editingId ? '✅ Artículo actualizado' : '✅ Artículo guardado y enviado a revisión', 'success');
      document.getElementById('formEditorArticulo').reset();
      selectedFiles = [];
      existingAttachments = [];
      editingId = null;
      renderAttachments();
      quill?.setContents([]);
      clearDraft();
      setEditorMode();
      refreshCurrentLists();
    } catch (err) {
      showStatus('editorStatus', `❌ Error: ${err.message}`, 'error');
    } finally {
      if (btn) { btn.textContent = originalText; btn.disabled = false; }
    }
  }

  function setEditorMode() {
    const title = document.querySelector('#editor-articulo h1');
    const submit = document.querySelector('#formEditorArticulo [type=submit]');
    const imageInput = document.getElementById('editorImagen');
    if (title) title.textContent = editingId ? 'Editar Artículo' : 'Editor de Artículos';
    if (submit) submit.textContent = editingId ? 'Actualizar Artículo' : 'Guardar Artículo';
    if (imageInput) imageInput.value = '';
  }

  async function edit(contentId) {
    await init();
    const content = await getContenidoAdmin(contentId);
    editingId = content.id;
    selectedFiles = [];
    existingAttachments = content.archivos || [];

    document.getElementById('editorTipo').value = content.tipo || 'noticia';
    document.getElementById('editorTitulo').value = content.titulo || '';
    document.getElementById('editorExtracto').value = content.extracto || content.descripcion || '';
    document.getElementById('editorLugar').value = content.lugar || '';
    document.getElementById('editorFechaEvento').value = content.fecha_evento ? String(content.fecha_evento).slice(0, 16) : '';
    document.getElementById('editorLink').value = content.link || '';
    
    // --- Campos Académicos ---
    if (document.getElementById('editorAbstract')) document.getElementById('editorAbstract').value = content.abstract || '';
    if (document.getElementById('editorDoi')) document.getElementById('editorDoi').value = content.doi || '';
    if (document.getElementById('editorVolumen')) document.getElementById('editorVolumen').value = content.publicacion_vol || '';
    if (document.getElementById('editorPeerReviewed')) document.getElementById('editorPeerReviewed').checked = !!content.peer_reviewed;
    if (document.getElementById('editorReferencias')) document.getElementById('editorReferencias').value = content.referencias || '';

    // --- Campos Noticia Inmersiva ---
    if (document.getElementById('editorLeadParagraph')) document.getElementById('editorLeadParagraph').value = content.lead_paragraph || '';
    if (document.getElementById('editorEsDestacada')) {
      const chk = document.getElementById('editorEsDestacada');
      chk.checked = !!content.es_destacada;
      // Triggers change event manually if needed, or set directly
      const breakingGrp = document.getElementById('breakingLabelGroup');
      if (breakingGrp) breakingGrp.style.display = chk.checked ? 'block' : 'none';
    }
    if (document.getElementById('editorBreakingLabel')) document.getElementById('editorBreakingLabel').value = content.breaking_label || 'ÚLTIMA HORA';

    const capSelect = document.getElementById('editorCapitulo');
    if (capSelect && content.capitulo) capSelect.value = content.capitulo;
    if (quill) quill.root.innerHTML = content.cuerpo || content.descripcion || '';

    // Trigger change on select to show/hide corresponding sections correctly
    document.getElementById('editorTipo').dispatchEvent(new Event('change'));

    setEditorMode();
    renderAttachments();
    clearDraft();
    if (typeof switchTab === 'function') switchTab('editor-articulo');
    toast('Artículo cargado para edición', 'info');
  }

  function refreshCurrentLists() {
    const user = getUser();
    if (user?.rol === 'director_rama') {
      loadContenidoPublicado?.();
      loadPendientes?.();
    } else {
      loadMisContenidos?.();
    }
  }

  window.AdminEditor = { init, saveDraft, edit };
})();
