// Configuration & Constants for HANDRAMA
export const TMDB_BEARER = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlOTk0YTNmMzc5MDg1YzQyZGI4MTM2NTk4NmI5MTRkYiIsIm5iZiI6MTc3OTE2NzYxNC45NzcsInN1YiI6IjZhMGJmMTdlOGZjMzhmZjJmNzhmYWM0YSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.BL9wtf4C5ZujQqtRUXfu5EfWNwjM4EUJYzSPX_LsJGw';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';
export const KO_LANG = 'ko';

export const SOURCES = [
  {
    id: 'vidsrc-xyz',
    label: 'VidSrc Direct',
    badge: 'Fast HD',
    urlMovie: (id) => `https://vidsrc.xyz/embed/movie/${id}`,
    urlTV: (id, s, e) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'vidsrc-pro',
    label: 'VidSrc Pro',
    badge: 'Server 2',
    urlMovie: (id) => `https://vidsrc.pro/embed/movie/${id}`,
    urlTV: (id, s, e) => `https://vidsrc.pro/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'vidsrc-me',
    label: 'VidSrc Classic',
    badge: 'Server 3',
    urlMovie: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    urlTV: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
  },
  {
    id: '2embed',
    label: '2Embed Cinema',
    badge: 'Multilingual',
    urlMovie: (id) => `https://www.2embed.cc/embed/${id}`,
    urlTV: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
  },
  {
    id: 'superembed',
    label: 'SuperEmbed Stream',
    badge: 'Backup',
    urlMovie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    urlTV: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
  }
];

export const DRAMA_GENRES = [
  { id: '', label: 'All Drama' },
  { id: '10749', label: 'Romance & Melodrama' },
  { id: '9648', label: 'Mystery & Thriller' },
  { id: '35', label: 'Romantic Comedy' },
  { id: '10768', label: 'Historical Sageuk' },
  { id: '10759', label: 'Action & Crime' },
  { id: '10765', label: 'Fantasy & Supernatural' },
  { id: '18', label: 'Slice of Life' }
];

export const MOVIE_GENRES = [
  { id: '', label: 'All Films' },
  { id: '28', label: 'Action' },
  { id: '53', label: 'Thriller & Suspense' },
  { id: '18', label: 'Drama' },
  { id: '10749', label: 'Romance' },
  { id: '35', label: 'Comedy' },
  { id: '27', label: 'Horror' },
  { id: '9648', label: 'Mystery' }
];

export const PROVIDERS = [
  { id: '', label: 'All Services' },
  { id: 8, label: 'Netflix' },
  { id: 337, label: 'Disney+' },
  { id: 119, label: 'Prime Video' },
  { id: 152, label: 'Viu' },
  { id: 96, label: 'TVING / Naver' }
];

export const YEARS = ['', '2026', '2025', '2024', '2023', '2022', '2021', '2020'];
