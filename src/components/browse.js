import { discoverBrowse } from '../services/api.js';
import { DRAMA_GENRES, MOVIE_GENRES, PROVIDERS, YEARS } from '../config.js';
import { renderPosterCard, renderSkeletonCards } from './cards.js';

let currentBrowseState = {
  type: 'tv',
  genre: '',
  year: '',
  provider: '',
  page: 1,
  loading: false,
  hasMore: true
};

export async function renderBrowseView(containerEl, params) {
  const type = params.type || 'tv';
  currentBrowseState = {
    type,
    genre: params.genre || '',
    year: params.year || '',
    provider: params.provider || '',
    page: 1,
    loading: false,
    hasMore: true
  };

  const genres = type === 'tv' ? DRAMA_GENRES : MOVIE_GENRES;

  containerEl.innerHTML = `
    <div class="browse-view-wrap">
      <h1 class="browse-heading">${type === 'tv' ? 'Korean Drama Series' : 'Korean Feature Films'}</h1>
      <p class="browse-subhead">Filter by genre, broadcast year, or streaming network</p>

      <div class="filters-board">
        <div class="filter-category-line">
          <span class="filter-key-label">Format:</span>
          <div class="filter-chip-tray">
            <button class="filter-chip-btn ${type === 'tv' ? 'active' : ''}" onclick="window.__hdChangeBrowseType('tv')">Series</button>
            <button class="filter-chip-btn ${type === 'movie' ? 'active' : ''}" onclick="window.__hdChangeBrowseType('movie')">Films</button>
          </div>
        </div>

        <div class="filter-category-line">
          <span class="filter-key-label">Genre:</span>
          <div class="filter-chip-tray" id="genre-filter-tray">
            ${genres.map(g => `
              <button class="filter-chip-btn ${currentBrowseState.genre === g.id ? 'active' : ''}" 
                onclick="window.__hdSetBrowseFilter('genre', '${g.id}')">
                ${g.label}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="filter-category-line">
          <span class="filter-key-label">Year:</span>
          <div class="filter-chip-tray" id="year-filter-tray">
            ${YEARS.map(y => `
              <button class="filter-chip-btn ${currentBrowseState.year === y ? 'active' : ''}" 
                onclick="window.__hdSetBrowseFilter('year', '${y}')">
                ${y || 'All Years'}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="filter-category-line">
          <span class="filter-key-label">Network:</span>
          <div class="filter-chip-tray" id="provider-filter-tray">
            ${PROVIDERS.map(p => `
              <button class="filter-chip-btn ${String(currentBrowseState.provider) === String(p.id) ? 'active' : ''}" 
                onclick="window.__hdSetBrowseFilter('provider', '${p.id}')">
                ${p.label}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="catalog-grid" id="browse-grid">
        ${renderSkeletonCards(14)}
      </div>

      <div style="text-align: center; margin-top: 36px;" id="browse-load-more-wrap">
        <button class="btn-secondary" id="browse-more-btn" onclick="window.__hdLoadMoreBrowse()">
          Load Next Page
        </button>
      </div>
    </div>
  `;

  await fetchBrowseResults(true);
}

async function fetchBrowseResults(replace = false) {
  if (currentBrowseState.loading) return;
  currentBrowseState.loading = true;

  const grid = document.getElementById('browse-grid');
  const moreBtn = document.getElementById('browse-more-btn');
  if (moreBtn) moreBtn.textContent = 'Loading...';

  try {
    const data = await discoverBrowse({
      type: currentBrowseState.type,
      genre: currentBrowseState.genre,
      year: currentBrowseState.year,
      provider: currentBrowseState.provider,
      page: currentBrowseState.page
    });

    const results = data.results || [];
    currentBrowseState.hasMore = data.page < (data.total_pages || 1);

    if (replace) {
      if (!results.length) {
        grid.innerHTML = `<div style="grid-column: 1/-1; padding: 60px 0; text-align: center; color: var(--text-muted);">No Korean titles found for the selected filter combination.</div>`;
      } else {
        grid.innerHTML = results.map(item => renderPosterCard(item, currentBrowseState.type)).join('');
      }
    } else {
      grid.innerHTML += results.map(item => renderPosterCard(item, currentBrowseState.type)).join('');
    }

    if (moreBtn) {
      moreBtn.style.display = currentBrowseState.hasMore ? 'inline-flex' : 'none';
      moreBtn.textContent = 'Load Next Page';
    }
  } catch (err) {
    console.error('Failed to fetch browse items', err);
    if (replace && grid) {
      grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px 0; text-align: center; color: var(--text-muted);">Error fetching media catalog. Please try again.</div>`;
    }
  } finally {
    currentBrowseState.loading = false;
  }
}

window.__hdChangeBrowseType = function(type) {
  window.__hdRouter.navigate('browse', { type });
};

window.__hdSetBrowseFilter = async function(key, val) {
  currentBrowseState[key] = val;
  currentBrowseState.page = 1;

  // Update active chips in tray
  const trayId = `${key}-filter-tray`;
  const tray = document.getElementById(trayId);
  if (tray) {
    tray.querySelectorAll('.filter-chip-btn').forEach(btn => {
      const match = btn.getAttribute('onclick')?.includes(`'${val}'`);
      btn.classList.toggle('active', Boolean(match));
    });
  }

  const grid = document.getElementById('browse-grid');
  if (grid) grid.innerHTML = renderSkeletonCards(14);

  await fetchBrowseResults(true);
};

window.__hdLoadMoreBrowse = async function() {
  if (currentBrowseState.hasMore && !currentBrowseState.loading) {
    currentBrowseState.page += 1;
    await fetchBrowseResults(false);
  }
};
