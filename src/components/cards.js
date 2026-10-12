import { imgUrl } from '../services/api.js';
import { isFavorite, toggleFavorite, removeContinueWatching } from '../services/storage.js';
import { showToast } from './toast.js';

export const ICONS = {
  play: (size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  star: (size = 12) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="var(--gold)"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  heart: (active = false, size = 14) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  chevronLeft: (size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>`,
  chevronRight: (size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>`,
  close: (size = 14) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  info: (size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
  expand: (size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`,
  compress: (size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/></svg>`
};

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderPosterCard(item, mediaType = 'tv') {
  const id = item.id;
  const title = item.title || item.name || 'Untitled';
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const favActive = isFavorite(id);
  const poster = imgUrl(item.poster_path || item.poster);

  return `
    <article class="poster-card" data-id="${id}" data-type="${mediaType}" onclick="window.__hdRouter.navigate('detail', { id: ${id}, type: '${mediaType}' })">
      <div class="card-media-box">
        <img class="card-media-img" src="${poster}" alt="${escapeHtml(title)}" loading="lazy" />
        <div class="card-hover-overlay">
          <div class="card-play-bubble">${ICONS.play(18)}</div>
        </div>
        <button class="card-fav-action ${favActive ? 'active' : ''}" 
          title="${favActive ? 'Remove favorite' : 'Add to favorites'}"
          onclick="event.stopPropagation(); window.__hdToggleFav(event, ${id}, '${mediaType}', '${escapeHtml(title)}', '${item.poster_path || item.poster || ''}', ${item.vote_average || 0}, '${year}')">
          ${ICONS.heart(favActive, 14)}
        </button>
      </div>
      <div class="card-caption">
        <h3 class="card-title" title="${escapeHtml(title)}">${escapeHtml(title)}</h3>
        <div class="card-meta-line">
          ${rating ? `<span class="card-rating-text">${ICONS.star(10)} ${rating}</span><span aria-hidden="true">·</span>` : ''}
          <span>${year || 'Korean'}</span>
          <span aria-hidden="true">·</span>
          <span>${mediaType === 'movie' ? 'Film' : 'Series'}</span>
        </div>
      </div>
    </article>
  `;
}

export function renderSkeletonCards(count = 7) {
  return Array(count).fill(`
    <div class="poster-card">
      <div class="card-media-box sk-item"></div>
      <div class="card-caption">
        <div class="sk-item" style="height: 14px; width: 85%; margin-bottom: 6px;"></div>
        <div class="sk-item" style="height: 11px; width: 50%;"></div>
      </div>
    </div>
  `).join('');
}

export function renderShelf(id, indexRoman, title, items, mediaType = 'tv', showMoreAction = null) {
  const cardsHtml = items && items.length 
    ? items.map(item => renderPosterCard(item, mediaType)).join('')
    : renderSkeletonCards(8);

  return `
    <section class="catalog-section">
      <div class="section-header-clean">
        <div class="section-headline">
          <span class="section-idx">${indexRoman}</span>
          <h2 class="section-label">${escapeHtml(title)}</h2>
        </div>
        ${showMoreAction ? `
          <button class="section-action-link" onclick="${showMoreAction}">
            Explore All ${ICONS.chevronRight(13)}
          </button>
        ` : ''}
      </div>
      <div class="scroll-shelf-wrapper">
        <button class="shelf-arrow prev" aria-label="Scroll left" onclick="window.__hdScrollShelf('${id}', -1)">
          ${ICONS.chevronLeft(16)}
        </button>
        <div class="scroll-shelf" id="${id}">
          ${cardsHtml}
        </div>
        <button class="shelf-arrow next" aria-label="Scroll right" onclick="window.__hdScrollShelf('${id}', 1)">
          ${ICONS.chevronRight(16)}
        </button>
      </div>
    </section>
  `;
}

export function renderContinueWatchingShelf(cwItems) {
  if (!cwItems || !cwItems.length) return '';

  return `
    <section class="catalog-section" style="margin-bottom: 30px;">
      <div class="section-header-clean">
        <div class="section-headline">
          <span class="section-idx">REC</span>
          <h2 class="section-label">Resume Watching</h2>
        </div>
        <button class="section-action-link" onclick="window.__hdClearCW()">
          Clear History
        </button>
      </div>
      <div class="scroll-shelf-wrapper">
        <div class="scroll-shelf" id="cw-shelf">
          ${cwItems.map(item => `
            <div class="cw-tile" onclick="window.__hdRouter.navigate('player', { id: ${item.id}, type: '${item.type || 'tv'}', season: ${item.season || 1}, episode: ${item.episode || 1} })">
              <div class="cw-thumb-box">
                <img class="cw-thumb-img" src="${imgUrl(item.backdrop || item.poster, 'w780')}" alt="${escapeHtml(item.title)}" loading="lazy" />
                <button class="cw-dismiss-btn" title="Remove" onclick="event.stopPropagation(); window.__hdRemoveCW(${item.id})">
                  ${ICONS.close(12)}
                </button>
                <div class="card-progress-bar">
                  <div class="card-progress-fill" style="width: ${item.progress || 15}%;"></div>
                </div>
              </div>
              <div class="cw-details">
                <h3 class="cw-title">${escapeHtml(item.title)}</h3>
                <div class="cw-subtext">
                  ${item.type === 'tv' ? `S${item.season || 1} · Ep ${item.episode || 1}` : 'Feature Film'}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

// Global helpers attached for clean inline event routing
window.__hdScrollShelf = function(shelfId, direction) {
  const el = document.getElementById(shelfId);
  if (!el) return;
  const card = el.querySelector('.poster-card, .cw-tile');
  const scrollDelta = card ? (card.offsetWidth + 16) * 3 : 500;
  el.scrollBy({ left: direction * scrollDelta, behavior: 'smooth' });
};

window.__hdToggleFav = function(event, id, type, title, poster, vote_average, release_date) {
  const added = toggleFavorite({ id, type, title, poster, vote_average, release_date });
  const btn = event.currentTarget;
  if (btn) {
    btn.classList.toggle('active', added);
    btn.innerHTML = ICONS.heart(added, 14);
    btn.title = added ? 'Remove favorite' : 'Add to favorites';
  }
  showToast(added ? 'Added to favorites' : 'Removed from favorites');
};

window.__hdRemoveCW = function(id) {
  removeContinueWatching(id);
  window.__hdRouter.refreshHomeCW();
  showToast('Removed from history');
};

window.__hdClearCW = function() {
  localStorage.removeItem('hd_cw_v2');
  window.__hdRouter.refreshHomeCW();
  showToast('Watch history cleared');
};
