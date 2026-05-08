(function () {
  let quill = null;
  let selectedFiles = [];
  let initialized = false;

  async function init() {
    if (!initialized) {
      setupQuill();
      setupDropZone();
      setupSubmit();
      initialized = true;
    }
    await loadCapituloOptions();
  }

  function setupQuill() {
    if (!window.Quill || quill) return;
    quill = new Quill('#quillEditor', {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'blockquote', 'clean'],
        ],
      },
    });
  }

  async function loadCapituloOptions() {
    const select = document.getElementById('editorCapitulo');
    if (!select) return;
    const user = getUser();
    const capitulos = await getCapitulos();
    const list = user?.rol === 'director_rama'
      ? capitulos
      : capitulos.filter((cap) => cap.slug === user?.capitulo);

    select.innerHTML = list.map((cap) => `<option value="${escapeHTML(cap.slug)}">${escapeHTML(cap.nombre)}</option>`).join('');
  }

  function setupDropZone() {
    const drop = document.getElementById('dropAdjuntos');
    const input = document.getElementById('editorAdjuntos');
    if (!drop || !input) return;

    drop.addEventListener('click', () => input.click());
    drop.addEventListener('dragover', (event) => {
      event.preventDefault();
      drop.classList.add('dragover');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
    drop.addEventListener('drop', (event) => {
      event.preventDefault();
      drop.classList.remove('dragover');
      addFiles(event.dataTransfer.files);
    });
    input.addEventListener('change', () => addFiles(input.files));
  }

  function addFiles(fileList) {
    const incoming = Array.from(fileList || []).filter((file) => (
      file.type.startsWith('image/') || file.type === 'application/pdf'
    ));
    selectedFiles = [...selectedFiles, ...incoming].slice(0, 10);
    renderPreview();
  }

  function renderPreview() {
    const preview = document.getElementById('adjuntosPreview');
    if (!preview) return;
    preview.innerHTML = selectedFiles.map((file, index) => `
      <div class="attachment-chip">
        <span>${file.type.startsWith('image/') ? 'Imagen' : 'PDF'} · ${escapeHTML(file.name)}</span>
        <button type="button" data-remove-file="${index}">Eliminar</button>
      </div>
    `).join('');
    preview.querySelectorAll('[data-remove-file]').forEach((button) => {
      button.addEventListener('click', () => {
        selectedFiles.splice(Number(button.dataset.removeFile), 1);
        renderPreview();
      });
    });
  }

  function setupSubmit() {
    document.getElementById('formEditorArticulo')?.addEventListener('submit', saveArticle);
    document.getElementById('formEditorArticulo')?.addEventListener('reset', () => {
      selectedFiles = [];
      renderPreview();
      quill?.setContents([]);
    });
  }

  async function saveArticle(event) {
    event.preventDefault();
    const formData = new FormData();
    formData.append('tipo', document.getElementById('editorTipo').value);
    formData.append('titulo', document.getElementById('editorTitulo').value.trim());
    formData.append('descripcion', document.getElementById('editorExtracto').value.trim());
    formData.append('extracto', document.getElementById('editorExtracto').value.trim());
    formData.append('capitulo', document.getElementById('editorCapitulo').value);
    formData.append('cuerpo', quill ? quill.root.innerHTML : '');
    formData.append('lugar', document.getElementById('editorLugar').value.trim());
    formData.append('fecha_evento', document.getElementById('editorFechaEvento').value);

    const imagen = document.getElementById('editorImagen').files[0];
    if (imagen) formData.append('imagen', imagen);

    try {
      const created = await createContenido(formData);

      if (selectedFiles.length) {
        const filesData = new FormData();
        selectedFiles.forEach((file) => filesData.append('archivos', file));
        await uploadContenidoArchivos(created.id, filesData);
      }

      showStatus('editorStatus', '✅ Artículo guardado', 'success');
      document.getElementById('formEditorArticulo').reset();
      selectedFiles = [];
      renderPreview();
      quill?.setContents([]);
    } catch (err) {
      showStatus('editorStatus', `❌ Error: ${err.message}`, 'error');
    }
  }

  window.AdminEditor = { init };
})();
