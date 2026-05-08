(function () {
  const originalLoadPendientes = window.loadPendientes;

  window.loadPendientes = async function loadPendientesLectura() {
    const container = document.getElementById('pendientesList');
    if (!container) return originalLoadPendientes?.();

    try {
      const pendientes = await getPendientes();
      if (!pendientes.length) {
        container.innerHTML = '<p class="empty-state">No hay contenido pendiente de aprobación.</p>';
        return;
      }

      container.innerHTML = pendientes.map((item) => `
        <div class="approval-item approval-reading">
          <div class="item-info">
            <h4>${escapeHTML(item.titulo)}</h4>
            <p>${escapeHTML(item.tipo).toUpperCase()} por ${escapeHTML(item.autor_nombre)} &bull; ${formatDate(item.created_at)}</p>
            <details>
              <summary>Abrir vista de lectura</summary>
              <div class="approval-reader">
                <p>${escapeHTML(item.extracto || item.descripcion || '')}</p>
                <div>${item.cuerpo || `<p>${escapeHTML(item.descripcion || '')}</p>`}</div>
              </div>
            </details>
          </div>
          <div class="approval-buttons">
            <button class="btn-aprobar" onclick="handleAprobacion(${item.id}, 'aprobar')">Aprobar</button>
            <button class="btn-rechazar" onclick="handleAprobacion(${item.id}, 'rechazar')">Rechazar</button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<p class="error-text">Error: ${escapeHTML(err.message)}</p>`;
    }
  };
})();
