// LocalStorage Persistence Service
const FAV_KEY = 'hd_favorites_v2';
const CW_KEY = 'hd_cw_v2';

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn('Storage read failed', err);
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('hd:storage_update', { detail: { key } }));
  } catch (err) {
    console.warn('Storage write failed', err);
  }
}

export function getFavorites() {
  return safeGet(FAV_KEY, {});
}

export function isFavorite(id) {
  const favs = getFavorites();
  return Boolean(favs[id]);
}

export function toggleFavorite(item) {
  const favs = getFavorites();
  const id = item.id;
  if (favs[id]) {
    delete favs[id];
    safeSet(FAV_KEY, favs);
    return false;
  } else {
    favs[id] = {
      id: item.id,
      type: item.type || 'tv',
      title: item.title || item.name || '',
      poster: item.poster || item.poster_path || '',
      backdrop: item.backdrop || item.backdrop_path || '',
      vote_average: item.vote_average || 0,
      release_date: item.release_date || item.first_air_date || '',
      addedAt: Date.now()
    };
    safeSet(FAV_KEY, favs);
    return true;
  }
}

export function getContinueWatching() {
  return safeGet(CW_KEY, {});
}

export function saveContinueWatching(item, progress = 10, season = 1, episode = 1) {
  const cw = getContinueWatching();
  cw[item.id] = {
    id: item.id,
    type: item.type || 'tv',
    title: item.title || item.name || '',
    backdrop: item.backdrop || item.backdrop_path || '',
    poster: item.poster || item.poster_path || '',
    progress: Math.min(100, Math.max(0, progress)),
    season,
    episode,
    updatedAt: Date.now()
  };
  safeSet(CW_KEY, cw);
}

export function removeContinueWatching(id) {
  const cw = getContinueWatching();
  delete cw[id];
  safeSet(CW_KEY, cw);
}

export function clearContinueWatching() {
  safeSet(CW_KEY, {});
}
