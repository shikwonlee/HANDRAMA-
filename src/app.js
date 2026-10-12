import { renderNavigation } from './components/nav.js';
import { renderHeroCarousel } from './components/hero.js';
import { renderShelf, renderContinueWatchingShelf, renderPosterCard, renderSkeletonCards } from './components/cards.js';
import { renderDetailView } from './components/detail.js';
import { renderPlayerView } from './components/player.js';
import { renderBrowseView } from './components/browse.js';
import { renderFavoritesView } from './components/favorites.js';
import { 
  getTrendingKorean, 
  getLatestDramas, 
  getNewKoreanFilms, 
  getDramasByGenre,
  searchKoreanTitles 
} from './services/api.js';
import { getContinueWatching } from './services/storage.js';

let searchDebounceTimer = null;
let currentRoute = 'home';
let routeHistory = [];

class HandramaRouter {
  constructor() {
    this.routes = {
      home: document.getElementById('view-home'),
      browse: document.getElementById('view-browse'),
      detail: document.getElementById('view-detail'),
      player: document.getElementById('view-player'),
      favorites: document.getElementById('view-favorites'),
      search: document.getElementById('view-search')
    };
  }

  async navigate(routeName, params = {}) {
    // If leaving player, tear down iframe to stop audio/video background buffering
    if (currentRoute === 'player' && routeName !== 'player') {
      const frame = document.getElementById('player-iframe');
      if (frame) frame.src = 'about:blank';
      const wrapper = document.getElementById('player-frame-wrapper');
      if (wrapper) wrapper.classList.remove('is-theater-fullscreen');
      document.body.classList.remove('theater-active');
    }

    if (currentRoute && currentRoute !== routeName) {
      routeHistory.push({ route: currentRoute });
    }
    currentRoute = routeName;

    // Update active view visibility
    Object.keys(this.routes).forEach(key => {
      const el = this.routes[key];
      if (el) {
        if (key === routeName) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });

    window.scrollTo({ top: 0, behavior: 'instant' });

    // Update Top & Mobile Navigation styling
    const navKey = routeName === 'browse' ? `browse-${params.type || 'tv'}` : routeName;
    renderNavigation(document.getElementById('nav-container'), navKey);

    // Route view renderers
    switch (routeName) {
      case 'home':
        await this.renderHome();
        break;
      case 'browse':
        await renderBrowseView(this.routes.browse, params);
        break;
      case 'detail':
        await renderDetailView(this.routes.detail, params);
        break;
      case 'player':
        await renderPlayerView(this.routes.player, params);
        break;
      case 'favorites':
        renderFavoritesView(this.routes.favorites);
        break;
      case 'search':
        // search is handled via search input
        break;
    }
  }

  navigateBack() {
    if (routeHistory.length > 0) {
      const last = routeHistory.pop();
      this.navigate(last.route);
    } else {
      this.navigate('home');
    }
  }

  async renderHome() {
    const homeEl = this.routes.home;
    if (homeEl.dataset.initialized === 'true') {
      this.refreshHomeCW();
      return;
    }

    homeEl.innerHTML = `
      <div class="hero-wrapper" id="hero-mount">
        <div class="hero-stage">
          <div class="sk-item" style="width: 100%; height: 100%;"></div>
        </div>
      </div>
      
      <div id="cw-mount"></div>

      <div id="home-shelves">
        ${renderShelf('shelf-new-tv', '01', 'Trending Korean Series', null, 'tv', "window.__hdRouter.navigate('browse', { type: 'tv' })")}
        ${renderShelf('shelf-films', '02', 'Featured Korean Films', null, 'movie', "window.__hdRouter.navigate('browse', { type: 'movie' })")}
        ${renderShelf('shelf-romance', '03', 'Romance & Melodrama', null, 'tv', "window.__hdRouter.navigate('browse', { type: 'tv', genre: '10749' })")}
        ${renderShelf('shelf-thriller', '04', 'Mystery & Crime Thrillers', null, 'tv', "window.__hdRouter.navigate('browse', { type: 'tv', genre: '9648' })")}
        ${renderShelf('shelf-sageuk', '05', 'Historical Sageuk Epics', null, 'tv', "window.__hdRouter.navigate('browse', { type: 'tv', genre: '10768' })")}
      </div>
      
      ${renderFooter()}
    `;

    this.refreshHomeCW();

    // Fetch catalog sections concurrently
    try {
      const [trendData, filmsData, romData, thrData, sagData] = await Promise.all([
        getTrendingKorean(),
        getNewKoreanFilms(),
        getDramasByGenre('10749'),
        getDramasByGenre('9648'),
        getDramasByGenre('10768')
      ]);

      const featured = (trendData.results || []).filter(item => item.backdrop_path).slice(0, 6);
      renderHeroCarousel(document.getElementById('hero-mount'), featured);

      const updateShelf = (shelfId, items, type) => {
        const el = document.getElementById(shelfId);
        if (el) {
          el.innerHTML = items && items.length 
            ? items.map(item => renderPosterCard(item, type)).join('')
            : '<div style="color:var(--text-muted);padding:20px;">No titles available.</div>';
        }
      };

      updateShelf('shelf-new-tv', (trendData.results || []).slice(0, 18), 'tv');
      updateShelf('shelf-films', (filmsData.results || []).slice(0, 18), 'movie');
      updateShelf('shelf-romance', (romData.results || []).slice(0, 18), 'tv');
      updateShelf('shelf-thriller', (thrData.results || []).slice(0, 18), 'tv');
      updateShelf('shelf-sageuk', (sagData.results || []).slice(0, 18), 'tv');

      homeEl.dataset.initialized = 'true';
    } catch (err) {
      console.error('Failed to load home catalog', err);
    }
  }

  refreshHomeCW() {
    const cwMount = document.getElementById('cw-mount');
    if (!cwMount) return;
    const cwObj = getContinueWatching();
    const list = Object.values(cwObj).sort((a, b) => b.updatedAt - a.updatedAt);
    cwMount.innerHTML = renderContinueWatchingShelf(list);
  }
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="footer-row">
        <div>
          <div class="nav-brand" style="margin-bottom: 6px;">
            HANDRAMA <em>한국 드라마</em>
          </div>
          <p class="footer-copy">Curated cinema and drama streaming portal for Korean storytelling.</p>
        </div>
        <div class="footer-copy">
          Powered by TMDB API · Non-commercial streaming catalog · © 2026 HANDRAMA
        </div>
      </div>
    </footer>
  `;
}

// Global Router instance
window.__hdRouter = new HandramaRouter();

// Search handling with 280ms debounce
window.__hdOnSearchInput = function(query) {
  clearTimeout(searchDebounceTimer);
  const q = (query || '').trim();

  if (!q) {
    if (currentRoute === 'search') {
      window.__hdRouter.navigate('home');
    }
    return;
  }

  searchDebounceTimer = setTimeout(async () => {
    const searchView = document.getElementById('view-search');
    window.__hdRouter.navigate('search');

    searchView.innerHTML = `
      <div class="search-view-wrap">
        <h1 class="search-query-banner">Results for “${q}”</h1>
        <div class="catalog-grid" id="search-results-grid">
          ${renderSkeletonCards(12)}
        </div>
      </div>
    `;

    try {
      const data = await searchKoreanTitles(q);
      const grid = document.getElementById('search-results-grid');
      if (!grid) return;

      if (!data.results || !data.results.length) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; padding: 60px 0; text-align: center; color: var(--text-muted);">
            No Korean drama or film matching “${q}” was found.
          </div>
        `;
      } else {
        grid.innerHTML = data.results.map(item => renderPosterCard(item, item.media_type || 'tv')).join('');
      }
    } catch (err) {
      console.error('Search query failed', err);
    }
  }, 280);
};

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  renderNavigation(document.getElementById('nav-container'), 'home');
  window.__hdRouter.navigate('home');
});
