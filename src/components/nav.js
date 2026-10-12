import { getFavorites } from '../services/storage.js';
import { ICONS } from './cards.js';

export function renderNavigation(containerEl, activeRoute = 'home') {
  const favCount = Object.keys(getFavorites()).length;

  containerEl.innerHTML = `
    <!-- Desktop & Tablet Top Navigation (Top Bar Contract) -->
    <header id="top-nav">
      <!-- Zone 1: Single-element Brand Wordmark -->
      <a href="javascript:void(0)" class="nav-brand" onclick="window.__hdRouter.navigate('home')">
        HANDRAMA <em>한국 드라마</em>
      </a>

      <!-- Zone 2: Single-line Text Navigation Links -->
      <nav class="nav-links">
        <a href="javascript:void(0)" class="nav-link ${activeRoute === 'home' ? 'active' : ''}" 
          onclick="window.__hdRouter.navigate('home')">Home</a>
        <a href="javascript:void(0)" class="nav-link ${activeRoute === 'browse-tv' ? 'active' : ''}" 
          onclick="window.__hdRouter.navigate('browse', { type: 'tv' })">Drama Series</a>
        <a href="javascript:void(0)" class="nav-link ${activeRoute === 'browse-movie' ? 'active' : ''}" 
          onclick="window.__hdRouter.navigate('browse', { type: 'movie' })">Films</a>
        <a href="javascript:void(0)" class="nav-link ${activeRoute === 'favorites' ? 'active' : ''}" 
          onclick="window.__hdRouter.navigate('favorites')">Watchlist</a>
      </nav>

      <!-- Zone 3: Search Input & Saved Action -->
      <div class="nav-actions">
        <div class="search-box">
          <input type="text" id="desktop-search-input" class="search-input" 
            placeholder="Search titles..." 
            oninput="window.__hdOnSearchInput(this.value)" 
            autocomplete="off" />
          <span class="search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
        </div>
        <button class="nav-fav-badge" onclick="window.__hdRouter.navigate('favorites')" title="View Watchlist">
          ${ICONS.heart(favCount > 0, 13)}
          <span id="nav-fav-count">${favCount}</span>
        </button>
      </div>
    </header>

    <!-- Mobile Bottom Navigation Bar (Within 15% viewport cap, 5 clean tabs) -->
    <nav class="mobile-tab-bar" id="mobile-tab-bar">
      <button class="m-tab-item ${activeRoute === 'home' ? 'active' : ''}" onclick="window.__hdRouter.navigate('home')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
        <span>Home</span>
      </button>
      <button class="m-tab-item ${activeRoute === 'browse-tv' ? 'active' : ''}" onclick="window.__hdRouter.navigate('browse', { type: 'tv' })">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        <span>Series</span>
      </button>
      <button class="m-tab-item ${activeRoute === 'browse-movie' ? 'active' : ''}" onclick="window.__hdRouter.navigate('browse', { type: 'movie' })">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
        <span>Films</span>
      </button>
      <button class="m-tab-item ${activeRoute === 'search' ? 'active' : ''}" onclick="window.__hdRouter.navigate('search')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <span>Search</span>
      </button>
      <button class="m-tab-item ${activeRoute === 'favorites' ? 'active' : ''}" onclick="window.__hdRouter.navigate('favorites')">
        ${ICONS.heart(favCount > 0, 18)}
        <span>Saved</span>
      </button>
    </nav>
  `;

  // Update badge count reactively on storage events
  window.addEventListener('hd:storage_update', () => {
    const badge = document.getElementById('nav-fav-count');
    if (badge) {
      badge.textContent = Object.keys(getFavorites()).length;
    }
  });
}
