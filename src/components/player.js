import { SOURCES } from '../config.js';
import { getDetails, getSeasonDetails } from '../services/api.js';
import { saveContinueWatching } from '../services/storage.js';
import { ICONS, escapeHtml } from './cards.js';
import { showToast } from './toast.js';

let activeSourceIndex = 0;
let currentPlayState = {
  id: null,
  type: 'tv',
  season: 1,
  episode: 1,
  title: '',
  backdrop: '',
  poster: '',
  seasonsCount: 1
};
let hideControlsTimer = null;

export async function renderPlayerView(containerEl, params) {
  const id = Number(params.id);
  const type = params.type || 'tv';
  const season = Number(params.season) || 1;
  const episode = Number(params.episode) || 1;

  activeSourceIndex = 0;
  currentPlayState = { id, type, season, episode, title: 'Loading...', backdrop: '', poster: '', seasonsCount: 1 };

  containerEl.innerHTML = `
    <div class="player-page-layout">
      <div class="player-top-header">
        <button class="player-back-btn" onclick="window.__hdRouter.navigateBack()">
          ${ICONS.chevronLeft(18)} Back to Overview
        </button>
        <span id="player-top-title" style="font-size: 14px; font-weight: 600; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          Preparing stream...
        </span>
        <button class="player-control-chip" onclick="window.__hdToggleFullscreen()" title="Toggle Fullscreen (F)">
          ${ICONS.expand(15)} <span id="fs-label-top">Fullscreen</span>
        </button>
      </div>

      <div class="player-frame-wrapper" id="player-frame-wrapper">
        <div class="player-overlay-bar" id="player-overlay-bar">
          <button class="player-control-chip" id="player-fs-btn" onclick="window.__hdToggleFullscreen()" title="Fullscreen (F / Esc)">
            <span id="fs-icon-wrap">${ICONS.expand(16)}</span>
            <span id="fs-text-wrap">Full Screen</span>
          </button>
        </div>
        <iframe id="player-iframe" 
          src="about:blank"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
          allowfullscreen="true"
          webkitallowfullscreen="true"
          mozallowfullscreen="true">
        </iframe>
      </div>

      <div class="player-metadata-panel">
        <h1 class="player-title-line" id="player-main-title">Loading title...</h1>
        <div class="player-subline" id="player-meta-subline">
          <span>${type === 'tv' ? `Season ${season} · Episode ${episode}` : 'Feature Film'}</span>
          <span aria-hidden="true">·</span>
          <span>Press 'F' for Fullscreen</span>
        </div>

        <div class="source-strip-label">Streaming Server Mirror</div>
        <div class="source-selector-row">
          ${SOURCES.map((src, i) => `
            <button class="source-choice-btn ${i === activeSourceIndex ? 'active' : ''}" 
              onclick="window.__hdSwitchSource(${i})">
              <span>${src.label}</span>
              <span class="source-badge">${src.badge}</span>
            </button>
          `).join('')}
        </div>

        ${type === 'tv' ? `
          <div class="episodes-box" id="episodes-box">
            <div class="section-headline" style="margin-bottom: 14px;">
              <span class="section-idx">EP</span>
              <h2 class="section-label">Episodes & Seasons</h2>
            </div>
            <div class="season-tabs-row" id="season-tabs-row">
              <div class="sk-item" style="width: 100px; height: 32px;"></div>
            </div>
            <div class="episode-grid" id="episode-grid">
              ${Array(6).fill('<div class="sk-item" style="height: 80px;"></div>').join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  setupPlayerControls();
  await loadMediaDetails(id, type, season, episode);
}

async function loadMediaDetails(id, type, season, episode) {
  try {
    const details = await getDetails(type, id);
    const title = details.name || details.title || 'Korean Media';
    currentPlayState.title = title;
    currentPlayState.backdrop = details.backdrop_path || '';
    currentPlayState.poster = details.poster_path || '';
    currentPlayState.seasonsCount = details.number_of_seasons || 1;

    document.getElementById('player-top-title').textContent = title;
    document.getElementById('player-main-title').textContent = title;
    updateSubline();

    // Save to Continue Watching
    saveContinueWatching(
      { id, type, title, backdrop: details.backdrop_path, poster: details.poster_path },
      25,
      season,
      episode
    );

    updateIframeSrc();

    if (type === 'tv') {
      renderSeasonTabs(details.number_of_seasons || 1, season);
      await loadEpisodes(id, season, episode);
    }
  } catch (err) {
    console.error('Error loading media details', err);
    updateIframeSrc();
  }
}

function updateSubline() {
  const el = document.getElementById('player-meta-subline');
  if (!el) return;
  const { type, season, episode } = currentPlayState;
  el.innerHTML = `
    <span>${type === 'tv' ? `Season ${season} · Episode ${episode}` : 'Feature Film'}</span>
    <span aria-hidden="true">·</span>
    <span>Source: ${SOURCES[activeSourceIndex]?.label}</span>
    <span aria-hidden="true">·</span>
    <span style="color: var(--crimson);">Fullscreen: Press 'F' or button</span>
  `;
}

function updateIframeSrc() {
  const iframe = document.getElementById('player-iframe');
  if (!iframe) return;
  const { id, type, season, episode } = currentPlayState;
  const src = SOURCES[activeSourceIndex] || SOURCES[0];
  const url = type === 'tv' ? src.urlTV(id, season, episode) : src.urlMovie(id);
  iframe.src = url;
}

function renderSeasonTabs(totalSeasons, activeSeason) {
  const tabsRow = document.getElementById('season-tabs-row');
  if (!tabsRow) return;

  tabsRow.innerHTML = Array.from({ length: totalSeasons }, (_, i) => i + 1).map(s => `
    <button class="season-tab-btn ${s === activeSeason ? 'active' : ''}" 
      onclick="window.__hdChangeSeason(${s})">
      Season ${s}
    </button>
  `).join('');
}

async function loadEpisodes(tvId, seasonNumber, currentEp) {
  const grid = document.getElementById('episode-grid');
  if (!grid) return;

  grid.innerHTML = Array(6).fill('<div class="sk-item" style="height: 80px;"></div>').join('');

  try {
    const seasonData = await getSeasonDetails(tvId, seasonNumber);
    const episodes = seasonData.episodes || [];

    if (!episodes.length) {
      grid.innerHTML = `<div style="color: var(--text-muted); font-size: 13px;">No episodes available for this season.</div>`;
      return;
    }

    grid.innerHTML = episodes.map(ep => {
      const isCurrent = ep.episode_number === currentEp;
      const thumb = ep.still_path 
        ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
        : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="169" viewBox="0 0 300 169"><rect fill="%23171b26" width="300" height="169"/><text fill="%2364748b" font-family="sans-serif" font-size="14" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle">No Still</text></svg>';

      return `
        <div class="episode-card ${isCurrent ? 'active' : ''}" 
          onclick="window.__hdChangeEpisode(${seasonNumber}, ${ep.episode_number})">
          <div class="ep-thumb-preview">
            <img src="${thumb}" alt="Episode ${ep.episode_number}" loading="lazy" />
          </div>
          <div class="ep-info-body">
            <span class="ep-number-tag">EPISODE ${ep.episode_number}</span>
            <div class="ep-name-text">${escapeHtml(ep.name || `Episode ${ep.episode_number}`)}</div>
            <div class="ep-overview-snippet">${escapeHtml(ep.overview || 'Korean television drama episode broadcast.')}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.warn('Failed to load season episodes', err);
    grid.innerHTML = `<div style="color: var(--text-muted); font-size: 13px;">Episodes list could not be loaded. Use player controls.</div>`;
  }
}

// SETUP CONTROLS & AUTO-HIDE
function setupPlayerControls() {
  const wrapper = document.getElementById('player-frame-wrapper');
  if (!wrapper) return;

  const showControls = () => {
    wrapper.classList.remove('controls-dimmed');
    clearTimeout(hideControlsTimer);
    hideControlsTimer = setTimeout(() => {
      if (document.fullscreenElement || wrapper.classList.contains('is-theater-fullscreen')) {
        wrapper.classList.add('controls-dimmed');
      }
    }, 2800);
  };

  wrapper.addEventListener('mousemove', showControls);
  wrapper.addEventListener('mouseenter', showControls);
  wrapper.addEventListener('click', showControls);

  // Fullscreen change events
  const onFsChange = () => {
    const isNativeFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    const isTheater = wrapper.classList.contains('is-theater-fullscreen');
    updateFullscreenUi(isNativeFs || isTheater);
  };

  document.removeEventListener('fullscreenchange', onFsChange);
  document.addEventListener('fullscreenchange', onFsChange);
  document.removeEventListener('webkitfullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);

  // Keyboard shortcut listener
  const keyHandler = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      window.__hdToggleFullscreen();
    } else if (e.key === 'Escape' || e.key === 'Esc') {
      if (wrapper.classList.contains('is-theater-fullscreen')) {
        exitTheaterFullscreen();
      }
    }
  };
  window.removeEventListener('keydown', keyHandler);
  window.addEventListener('keydown', keyHandler);
}

function updateFullscreenUi(isFullscreen) {
  const iconWrap = document.getElementById('fs-icon-wrap');
  const textWrap = document.getElementById('fs-text-wrap');
  const topLabel = document.getElementById('fs-label-top');

  if (iconWrap) iconWrap.innerHTML = isFullscreen ? ICONS.compress(16) : ICONS.expand(16);
  if (textWrap) textWrap.textContent = isFullscreen ? 'Exit Full Screen' : 'Full Screen';
  if (topLabel) topLabel.textContent = isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
}

function exitTheaterFullscreen() {
  const wrapper = document.getElementById('player-frame-wrapper');
  if (!wrapper) return;
  wrapper.classList.remove('is-theater-fullscreen');
  wrapper.classList.remove('controls-dimmed');
  document.body.classList.remove('theater-active');
  updateFullscreenUi(false);
  showToast('Exited Fullscreen');
}

// Global functions for inline HTML calls
window.__hdToggleFullscreen = async function() {
  const wrapper = document.getElementById('player-frame-wrapper');
  if (!wrapper) return;

  const isNative = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  const isTheater = wrapper.classList.contains('is-theater-fullscreen');

  // If already in either fullscreen mode, exit
  if (isNative) {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
    } catch (e) {
      console.warn('Native exit failed', e);
    }
    updateFullscreenUi(false);
    return;
  }

  if (isTheater) {
    exitTheaterFullscreen();
    return;
  }

  // Attempt Native Fullscreen first
  const req = wrapper.requestFullscreen || wrapper.webkitRequestFullscreen || wrapper.msRequestFullscreen;
  let nativeSuccess = false;
  if (req) {
    try {
      await req.call(wrapper);
      nativeSuccess = true;
      updateFullscreenUi(true);
      showToast('Fullscreen Mode (Press F or Esc to exit)');
    } catch (err) {
      console.warn('Native requestFullscreen denied/blocked by iframe sandbox. Activating Theater Fullscreen fallback:', err);
      nativeSuccess = false;
    }
  }

  // If native fullscreen was rejected or unavailable (e.g. nested in AI Studio iframe)
  // activate CSS Theater / Window-Maximized Fullscreen
  if (!nativeSuccess) {
    wrapper.classList.add('is-theater-fullscreen');
    document.body.classList.add('theater-active');
    updateFullscreenUi(true);
    showToast('Theater Fullscreen Active (Press Esc to exit)');
  }
};

window.__hdSwitchSource = function(index) {
  activeSourceIndex = index;
  document.querySelectorAll('.source-choice-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });
  updateIframeSrc();
  updateSubline();
  showToast(`Switched to ${SOURCES[index].label}`);
};

window.__hdChangeSeason = async function(seasonNum) {
  currentPlayState.season = seasonNum;
  currentPlayState.episode = 1;
  document.querySelectorAll('.season-tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i + 1 === seasonNum);
  });
  updateIframeSrc();
  updateSubline();
  await loadEpisodes(currentPlayState.id, seasonNum, 1);
  showToast(`Loaded Season ${seasonNum}`);
};

window.__hdChangeEpisode = function(seasonNum, epNum) {
  currentPlayState.season = seasonNum;
  currentPlayState.episode = epNum;
  document.querySelectorAll('.episode-card').forEach(card => {
    const isTarget = card.querySelector('.ep-number-tag')?.textContent.includes(`EPISODE ${epNum}`);
    card.classList.toggle('active', Boolean(isTarget));
  });
  updateIframeSrc();
  updateSubline();
  saveContinueWatching(
    { id: currentPlayState.id, type: 'tv', title: currentPlayState.title, backdrop: currentPlayState.backdrop, poster: currentPlayState.poster },
    35,
    seasonNum,
    epNum
  );
  showToast(`Playing Season ${seasonNum} Episode ${epNum}`);
};
