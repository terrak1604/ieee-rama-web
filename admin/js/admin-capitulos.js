(function () {
  let capitulos = [];

  function allowedCapitulos() {
    const user = getUser();
    if (user?.rol === 'director_rama') return capitulos;
    return capitulos.filter((cap) => cap.slug === user?.capitulo);
  }

  async function load() {
    const container = document.getElementById('capitulosAdminList');
    if (!container) return;

    container.innerHTML = '<p class="empty-state">Cargando capítulos...</p>';
    try {
      capitulos = await getCapitulos();
      const list = allowedCapitulos();
      container.innerHTML = list.length ? list.map((cap) => `
        <div class="content-item">
          <div class="item-info">
            <h4>${escapeHTML(cap.nombre)}</h4>
            <p>${escapeHTML(cap.siglas || cap.slug)} &bull; ${escapeHTML(cap.descripcion_corta || '')}</p>
          </div>
          <div class="approval-buttons">
            <button class="btn-aprobar" data-edit-capitulo="${escapeHTML(cap.slug)}">Editar</button>
          </div>
        </div>
      `).join('') : '<p class="empty-state">No hay capítulos disponibles para tu cuenta.</p>';

      container.querySelectorAll('[data-edit-capitulo]').forEach((button) => {
        button.addEventListener('click', () => openModal(button.dataset.editCapitulo));
      });
    } catch (err) {
      container.innerHTML = `<p class="error-text">Error: ${escapeHTML(err.message)}</p>`;
    }
  }

  async function openModal(slug) {
    const modal = document.getElementById('capituloModal');
    if (!modal) return;
    const cap = await getCapitulo(slug);
    document.getElementById('capituloSlug').value = cap.slug;
    document.getElementById('capituloNombre').value = cap.nombre || '';
    document.getElementById('capituloSiglas').value = cap.siglas || '';
    document.getElementById('capituloDescCorta').value = cap.descripcion_corta || '';
    document.getElementById('capituloDescLarga').value = cap.descripcion_larga || '';
    document.getElementById('capituloMision').value = cap.mision || '';
    document.getElementById('capituloVision').value = cap.vision || '';
    modal.classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('capituloModal')?.classList.add('hidden');
  }

  async function saveCapitulo(event) {
    event.preventDefault();
    const slug = document.getElementById('capituloSlug').value;
    const payload = {
      nombre: document.getElementById('capituloNombre').value.trim(),
      siglas: document.getElementById('capituloSiglas').value.trim(),
      descripcion_corta: document.getElementById('capituloDescCorta').value.trim(),
      descripcion_larga: document.getElementById('capituloDescLarga').value.trim(),
      mision: document.getElementById('capituloMision').value.trim(),
      vision: document.getElementById('capituloVision').value.trim(),
    };

    try {
      const result = await updateCapitulo(slug, payload);
      const nextSlug = result.slug || slug;
      const logo = document.getElementById('capituloLogo').files[0];
      const portada = document.getElementById('capituloPortada').files[0];

      if (logo) {
        const logoData = new FormData();
        logoData.append('logo', logo);
        await uploadCapituloArchivo(nextSlug, logoData);
      }

      if (portada) {
        const portadaData = new FormData();
        portadaData.append('portada', portada);
        await uploadCapituloArchivo(nextSlug, portadaData);
      }

      showStatus('capituloStatus', '✅ Capítulo actualizado', 'success');
      await load();
      setTimeout(closeModal, 800);
    } catch (err) {
      showStatus('capituloStatus', `❌ Error: ${err.message}`, 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('closeCapituloModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelCapituloModal')?.addEventListener('click', closeModal);
    document.getElementById('formCapituloEditor')?.addEventListener('submit', saveCapitulo);
  });

  window.AdminCapitulos = { load };
})();
