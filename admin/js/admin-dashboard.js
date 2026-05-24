(function () {
  // Badge colors per tipo
  const TIPO_LABELS = { noticia: 'Noticia', proyecto: 'Proyecto', evento: 'Evento' };

  let _allPendientes = [];
  let _filterTipo = 'todos';
  let _filterCap  = 'todos';

  // ── Override loadPendientes ──────────────────────────────────
  window.loadPendientes = async function loadPendientesMejorado() {
    const container = document.getElementById('pendientesList');
    if (!container) return;

    container.innerHTML = '<p class="empty-state">Cargando...</p>';

    try {
      _allPendientes = await getPendientes();
      buildFilters(container);
      renderPendientes(container);
    } catch (err) {
      container.innerHTML = `<p class="error-text">Error: ${escapeHTML(err.message)}</p>`;
    }
  };

  function buildFilters(container) {
    // Recopilar tipos y capítulos únicos
    const tipos = ['todos', ...new Set(_allPendientes.map((p) => p.tipo).filter(Boolean))];
    const caps  = ['todos', ...new Set(_allPendientes.map((p) => p.capitulo).filter(Boolean))];

    const filtersHTML = `
      <div class="approval-filters" id="approvalFiltersTipo">
        ${tipos.map((t) => `<button class="filter-chip${t === _filterTipo ? ' active' : ''}" data-tipo="${t}">${t === 'todos' ? 'Todos' : TIPO_LABELS[t] || t}</button>`).join('')}
      </div>
      ${caps.length > 2 ? `<div class="approval-filters" id="approvalFiltersCap">
        ${caps.map((c) => `<button class="filter-chip${c === _filterCap ? ' active' : ''}" data-cap="${c}">${c === 'todos' ? 'Todos los capítulos' : escapeHTML(c)}</button>`).join('')}
      </div>` : ''}
      <div id="approvalItems"></div>
    `;

    container.innerHTML = filtersHTML;

    container.querySelectorAll('[data-tipo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        _filterTipo = btn.dataset.tipo;
        container.querySelectorAll('[data-tipo]').forEach((b) => b.classList.toggle('active', b === btn));
        renderPendientes(container);
      });
    });

    container.querySelectorAll('[data-cap]').forEach((btn) => {
      btn.addEventListener('click', () => {
        _filterCap = btn.dataset.cap;
        container.querySelectorAll('[data-cap]').forEach((b) => b.classList.toggle('active', b === btn));
        renderPendientes(container);
      });
    });
  }

  function renderPendientes(container) {
    const items = _allPendientes.filter((p) => {
      if (_filterTipo !== 'todos' && p.tipo !== _filterTipo) return false;
      if (_filterCap  !== 'todos' && p.capitulo !== _filterCap) return false;
      return true;
    });

    const listEl = container.querySelector('#approvalItems') || container;

    if (!items.length) {
      listEl.innerHTML = '<p class="empty-state">No hay contenido pendiente con los filtros seleccionados.</p>';
      return;
    }

    listEl.innerHTML = items.map((item) => `
      <div class="approval-item approval-reading">
        <div class="item-info">
          <h4>${escapeHTML(item.titulo)}</h4>
          <p>Por <strong>${escapeHTML(item.autor_nombre)}</strong> &bull; ${formatDate(item.created_at)}</p>
          <div class="approval-badges">
            <span class="badge-tipo">${escapeHTML(TIPO_LABELS[item.tipo] || item.tipo)}</span>
            ${item.capitulo ? `<span class="badge-cap">${escapeHTML(item.capitulo)}</span>` : ''}
          </div>
          <details style="margin-top:10px;">
            <summary style="color:var(--ieee-light-blue);cursor:pointer;font-size:0.85rem;">Vista previa</summary>
            <div class="approval-reader">
              ${item.extracto ? `<p style="margin-bottom:10px;font-style:italic;">${escapeHTML(item.extracto)}</p>` : ''}
              <div>${item.cuerpo || `<p>${escapeHTML(item.descripcion || '')}</p>`}</div>
            </div>
          </details>
        </div>
        <div class="approval-buttons">
          <button class="btn-mini" onclick="handleEditContenido(${item.id})">Editar</button>
          <button class="btn-aprobar" onclick="handleAprobacion(${item.id}, 'aprobar')">Aprobar</button>
          <button class="btn-rechazar" onclick="handleAprobacion(${item.id}, 'rechazar')">Rechazar</button>
          <button class="btn-mini danger" onclick="handleDeleteContenido(${item.id})">Eliminar</button>
        </div>
      </div>
    `).join('');
  }
})();
