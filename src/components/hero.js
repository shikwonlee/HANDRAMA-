import { backdropUrl } from '../services/api.js';
import { ICONS, escapeHtml } from './cards.js';

let heroInterval = null;
let currentHeroIndex = 0;
let cachedFeatured = [];

export function renderHeroCarousel(containerEl, items) {
  if (!containerEl || !items || !items.length) return;
  cachedFeatured = items.slice(0, 6);
  currentHeroIndex = 0;

  containerEl.innerHTML = `
    <div class="hero-stage" id="hero-stage">
      <div class="hero-bg-layer" id="hero-bg"></div>
      <div class="hero-gradient-left"></div>
      <div class="hero-gradient-bottom"></div>
      <div class="hero-content" id="hero-content"></div>
      <div class="hero-indicators" id="hero-indicators"></div>
    </div>
  `;

  updateHeroSlide(0);
  startHeroTimer();

  const stage = document.getElementById('hero-stage');
  if (stage) {
    stage.addEventListener('mouseenter', stopHeroTimer);
    stage.addEventListener('mouseleave', startHeroTimer);
  }
}

export function updateHeroSlide(index) {
  if (!cachedFeatured.length) return;
  currentHeroIndex = (index + cachedFeatured.length) % cachedFeatured.length;
  const item = cachedFeatured[currentHeroIndex];

  const bgEl = document.getElementById('hero-bg');
  const contentEl = document.getElementById('hero-content');
  const indicatorsEl = document.getElementById('hero-indicators');

  if (bgEl) {
    const bgUrl = backdropUrl(item.backdrop_path || item.poster_path);
    bgEl.style.backgroundImage = `url('${bgUrl}')`;
  }

  const title = item.name || item.title || 'Untitled';
  const year = (item.first_air_date || item.release_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const overview = item.overview || 'Experience this acclaimed Korean drama series streaming in high definition.';

  if (contentEl) {
    contentEl.innerHTML = `
      <div class="hero-kicker">
        <span class="hero-kicker-bar"></span>
        <span>Featured #${currentHeroIndex + 1} Spotlight</span>
      </div>
      <h1 class="hero-title">
        ${escapeHtml(title)}
        <span class="hero-title-kr">한국 드라마 · Premiere</span>
      </h1>
      <div class="hero-meta-strip">
        ${rating ? `<span class="hero-rating">${ICONS.star(13)} ${rating}</span><span aria-hidden="true">·</span>` : ''}
        <span>${year || 'Korean TV'}</span>
        <span aria-hidden="true">·</span>
        <span>Original Series</span>
      </div>
      <p class="hero-overview">${escapeHtml(overview)}</p>
      <div class="hero-ctas">
        <button class="btn-primary" onclick="window.__hdRouter.navigate('player', { id: ${item.id}, type: 'tv' })">
          ${ICONS.play(18)} Stream Episode 1
        </button>
        <button class="btn-secondary" onclick="window.__hdRouter.navigate('detail', { id: ${item.id}, type: 'tv' })">
          ${ICONS.info(16)} Series Overview
        </button>
      </div>
    `;
  }

  if (indicatorsEl) {
    indicatorsEl.innerHTML = cachedFeatured.map((_, i) => `
      <button class="hero-dot ${i === currentHeroIndex ? 'active' : ''}" 
        aria-label="Slide ${i + 1}" 
        onclick="window.__hdHeroGo(${i})">
      </button>
    `).join('');
  }
}

export function startHeroTimer() {
  stopHeroTimer();
  heroInterval = setInterval(() => {
    updateHeroSlide(currentHeroIndex + 1);
  }, 6000);
}

export function stopHeroTimer() {
  if (heroInterval) {
    clearInterval(heroInterval);
    heroInterval = null;
  }
}

window.__hdHeroGo = function(index) {
  updateHeroSlide(index);
  startHeroTimer();
};
