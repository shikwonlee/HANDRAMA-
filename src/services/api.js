import { TMDB_BASE_URL, TMDB_BEARER, TMDB_IMAGE_BASE, KO_LANG } from '../config.js';

// Fast LRU in-memory cache to eliminate network lags and duplicate requests
const memoryCache = new Map();
const MAX_CACHE_ENTRIES = 120;

function getCache(key) {
  if (memoryCache.has(key)) {
    const entry = memoryCache.get(key);
    // 10 minutes cache validity
    if (Date.now() - entry.time < 10 * 60 * 1000) {
      return entry.data;
    }
    memoryCache.delete(key);
  }
  return null;
}

function setCache(key, data) {
  if (memoryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { data, time: Date.now() });
}

export async function fetchApi(path) {
  const cached = getCache(path);
  if (cached) return cached;

  const url = `${TMDB_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TMDB_BEARER}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API HTTP Error ${response.status} for ${path}`);
  }

  const data = await response.json();
  setCache(path, data);
  return data;
}

export function imgUrl(path, size = 'w500') {
  if (!path) {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect fill="%2311131a" width="300" height="450"/><text fill="%23475569" font-family="sans-serif" font-size="14" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle">No Poster</text></svg>';
  }
  return `${TMDB_IMAGE_BASE}${size}${path}`;
}

export function backdropUrl(path, size = 'original') {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}${size}${path}`;
}

export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function getTrendingKorean() {
  const today = getTodayDateString();
  return fetchApi(`/discover/tv?with_original_language=${KO_LANG}&sort_by=popularity.desc&first_air_date.lte=${today}&page=1`);
}

export async function getLatestDramas() {
  const today = getTodayDateString();
  return fetchApi(`/discover/tv?with_original_language=${KO_LANG}&sort_by=first_air_date.desc&first_air_date.lte=${today}&first_air_date.gte=2024-01-01&page=1`);
}

export async function getNewKoreanFilms() {
  const today = getTodayDateString();
  return fetchApi(`/discover/movie?with_original_language=${KO_LANG}&sort_by=primary_release_date.desc&primary_release_date.lte=${today}&vote_count.gte=5&page=1`);
}

export async function getDramasByGenre(genreId) {
  const today = getTodayDateString();
  return fetchApi(`/discover/tv?with_original_language=${KO_LANG}&with_genres=${genreId}&sort_by=popularity.desc&first_air_date.lte=${today}&page=1`);
}

export async function getDetails(type, id) {
  return fetchApi(`/${type}/${id}?append_to_response=videos,credits,similar`);
}

export async function getSeasonDetails(tvId, seasonNumber) {
  return fetchApi(`/tv/${tvId}/season/${seasonNumber}`);
}

export async function searchKoreanTitles(query) {
  const data = await fetchApi(`/search/multi?query=${encodeURIComponent(query)}&page=1`);
  const results = (data.results || []).filter(item => 
    item.media_type !== 'person' && 
    item.poster_path && 
    item.original_language === KO_LANG
  );
  return { results };
}

export async function discoverBrowse({ type = 'tv', genre = '', year = '', provider = '', page = 1 }) {
  const today = getTodayDateString();
  const dateParam = type === 'tv' ? 'first_air_date' : 'primary_release_date';
  let query = `/discover/${type}?with_original_language=${KO_LANG}&page=${page}&sort_by=${dateParam}.desc`;

  if (genre) query += `&with_genres=${genre}`;
  if (provider) query += `&with_watch_providers=${provider}&watch_region=KR`;
  if (year) {
    query += `&${dateParam}_year=${year}`;
  } else {
    query += `&${dateParam}.gte=2023-01-01&${dateParam}.lte=${today}`;
  }

  return fetchApi(query);
}
