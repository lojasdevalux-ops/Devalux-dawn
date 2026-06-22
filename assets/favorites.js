/*
 * Favorites (wishlist) — client-side, no app required.
 *
 * Stores favorited products in localStorage so the heart buttons, the header
 * count badge and the favorites page all stay in sync across pages/tabs.
 *
 * Public surface:
 *   - <favorite-button data-favorite='{json}'> toggles a product.
 *   - <favorites-count> renders the number of saved items.
 *   - An element with id="FavoritesGrid" gets populated with saved products.
 */
(function () {
  const STORAGE_KEY = 'theme:favorites';

  function read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function write(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      /* storage full / unavailable — ignore */
    }
    document.dispatchEvent(new CustomEvent('favorites:updated', { detail: { list } }));
  }

  function has(id) {
    return read().some((item) => String(item.id) === String(id));
  }

  function toggle(product) {
    const list = read();
    const index = list.findIndex((item) => String(item.id) === String(product.id));
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.unshift(product);
    }
    write(list);
    return index === -1; // true if it was added
  }

  /* ----------------------------- UI updates ----------------------------- */

  function refreshCounts() {
    const count = read().length;
    document.querySelectorAll('favorites-count, [data-favorites-count]').forEach((el) => {
      // Always visible, even at 0 — matches Época, which shows the "0" badge.
      el.textContent = count;
      el.dataset.count = count;
    });
  }

  function refreshButtons() {
    document.querySelectorAll('.favorite-button').forEach((btn) => {
      let data;
      try {
        data = JSON.parse(btn.getAttribute('data-favorite'));
      } catch (e) {
        return;
      }
      const active = has(data.id);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      const label = active ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    });
  }

  /* --------------------------- Favorites page --------------------------- */

  function money(value) {
    if (value == null) return '';
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
    } catch (e) {
      return 'R$ ' + (value / 100).toFixed(2);
    }
  }

  function isFavoritesPage() {
    const handle = window.FAVORITES_PAGE_HANDLE || 'favoritos';
    const segment = window.location.pathname.replace(/\/+$/, '').split('/').pop();
    return segment === handle;
  }

  // Returns the grid element. If the page doesn't provide one (default page
  // template, no custom template selected) but we ARE on the favorites page,
  // inject the container automatically into the main content area.
  function ensureGrid() {
    let grid = document.getElementById('FavoritesGrid');
    if (grid) return grid;
    if (!isFavoritesPage()) return null;

    const host = document.getElementById('MainContent') || document.querySelector('main') || document.body;
    const wrap = document.createElement('div');
    wrap.className = 'page-width epoca-favorites epoca-favorites--auto';
    wrap.innerHTML =
      '<p id="FavoritesEmpty" class="epoca-favorites__empty">Você ainda não adicionou nenhum produto aos favoritos. Toque no coração dos produtos para salvá-los aqui.</p>' +
      '<div id="FavoritesGrid" class="epoca-favorites__grid"></div>';
    host.appendChild(wrap);
    return document.getElementById('FavoritesGrid');
  }

  function renderFavoritesPage() {
    const grid = ensureGrid();
    if (!grid) return;
    const empty = document.getElementById('FavoritesEmpty');
    const list = read();

    if (empty) empty.toggleAttribute('hidden', list.length !== 0);
    grid.innerHTML = '';

    list.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'epoca-fav-card';
      card.innerHTML = `
        <a class="epoca-fav-card__media" href="${p.url}">
          ${p.image ? `<img src="${p.image}" alt="${(p.title || '').replace(/"/g, '&quot;')}" loading="lazy">` : ''}
        </a>
        <button type="button" class="favorite-button is-active epoca-fav-card__remove" aria-pressed="true"
          data-favorite='${JSON.stringify(p).replace(/'/g, '&#39;')}' aria-label="Remover dos favoritos" title="Remover dos favoritos">
          <span class="svg-wrapper">${heartSvg()}</span>
        </button>
        <a class="epoca-fav-card__title" href="${p.url}">${p.title || ''}</a>
        <div class="epoca-fav-card__price">${p.price != null ? money(p.price) : ''}</div>
        <a class="epoca-fav-card__btn" href="${p.url}">Ver produto</a>
      `;
      grid.appendChild(card);
    });
  }

  function heartSvg() {
    return '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 5.24 8.515 3.773a4.433 4.433 0 0 0-6.21 0 4.293 4.293 0 0 0 0 6.128L10 17.495l7.695-7.593a4.293 4.293 0 0 0 0-6.128 4.433 4.433 0 0 0-6.21 0z"/></svg>';
  }

  /* ------------------------------ Events ------------------------------- */

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.favorite-button');
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    let data;
    try {
      data = JSON.parse(btn.getAttribute('data-favorite'));
    } catch (e) {
      return;
    }
    toggle(data);
  });

  document.addEventListener('favorites:updated', () => {
    refreshCounts();
    refreshButtons();
    renderFavoritesPage();
  });

  // Keep multiple tabs in sync.
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      refreshCounts();
      refreshButtons();
      renderFavoritesPage();
    }
  });

  function init() {
    if (isFavoritesPage()) document.body.classList.add('is-favorites-page');
    refreshCounts();
    refreshButtons();
    renderFavoritesPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
