import { getFavorites } from '../services/storage.js';
import { renderPosterCard, ICONS } from './cards.js';

export function renderFavoritesView(containerEl) {
  const favsObj = getFavorites();
  const items = Object.values(favsObj).sort((a, b) => b.addedAt - a.addedAt);

  containerEl.innerHTML = `
    <div class="browse-view-wrap">
      <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px; flex-wrap: wrap; gap: 12px;">
        <h1 class="browse-heading">Your Saved Collection</h1>
        ${items.length ? `
          <span style="font-size: 13px; color: var(--text-muted); font-weight: 600;">
            ${items.length} title${items.length === 1 ? '' : 's'} saved
          </span>
        ` : ''}
      </div>
      <p class="browse-subhead">Quick access to bookmarked Korean dramas and films</p>

      ${!items.length ? `
        <div style="padding: 80px 20px; text-align: center; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); margin-top: 24px;">
          <div style="color: var(--crimson); margin-bottom: 16px;">${ICONS.heart(false, 36)}</div>
          <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">No Titles Saved Yet</h2>
          <p style="color: var(--text-muted); font-size: 14px; max-width: 440px; margin: 0 auto 24px;">
            Tap the heart icon on any Korean drama or film to bookmark it to your personal watchlist.
          </p>
          <button class="btn-primary" onclick="window.__hdRouter.navigate('home')">
            Browse Popular Dramas
          </button>
        </div>
      ` : `
        <div class="catalog-grid" id="favorites-grid">
          ${items.map(item => renderPosterCard(item, item.type || 'tv')).join('')}
        </div>
      `}
    </div>
  `;
}
