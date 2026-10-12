import { getDetails, backdropUrl, imgUrl } from '../services/api.js';
import { isFavorite, toggleFavorite } from '../services/storage.js';
import { ICONS, escapeHtml, renderShelf } from './cards.js';
import { showToast } from './toast.js';

export async function renderDetailView(containerEl, params) {
  const id = Number(params.id);
  const type = params.type || 'tv';

  containerEl.innerHTML = `
    <div style="padding: calc(var(--nav-height) + 40px) var(--page-px); text-align: center; color: var(--text-muted);">
      <div class="sk-item" style="max-width: 900px; height: 350px; margin: 0 auto 30px;"></div>
      <p>Loading media synopsis and streaming details...</p>
    </div>
  `;

  try {
    const data = await getDetails(type, id);
    const title = data.title || data.name || 'Untitled';
    const year = (data.release_date || data.first_air_date || '').slice(0, 4);
    const rating = data.vote_average ? data.vote_average.toFixed(1) : null;
    const runtime = data.runtime 
      ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m`
      : (data.episode_run_time?.[0] ? `~${data.episode_run_time[0]}m / ep` : '');
    const genres = (data.genres || []).map(g => g.name).join(' · ');
    const overview = data.overview || 'No synopsis provided in TMDB archive for this title.';
    const favActive = isFavorite(id);
    const cast = (data.credits?.cast || []).slice(0, 14);
    const similar = (data.similar?.results || []).filter(item => item.original_language === 'ko').slice(0, 16);
    const trailer = (data.videos?.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube');

    containerEl.innerHTML = `
      <div class="detail-hero-box">
        <div class="detail-backdrop-layer" style="background-image: url('${backdropUrl(data.backdrop_path || data.poster_path)}');"></div>
        <div class="detail-mask-left"></div>
        <div class="detail-mask-bottom"></div>
        
        <div class="detail-content-wrap">
          <div class="detail-poster-column">
            <img src="${imgUrl(data.poster_path)}" alt="${escapeHtml(title)}" />
          </div>
          <div class="detail-info-column">
            ${data.tagline ? `<div class="detail-tagline">“${escapeHtml(data.tagline)}”</div>` : ''}
            <h1 class="detail-headline">${escapeHtml(title)}</h1>
            <div class="detail-meta-row">
              ${rating ? `<span style="color: var(--gold); font-weight: 700;">★ ${rating}</span><span aria-hidden="true">·</span>` : ''}
              <span>${year || 'Korean'}</span>
              <span aria-hidden="true">·</span>
              <span>${type === 'tv' ? 'Series' : 'Film'}</span>
              ${runtime ? `<span aria-hidden="true">·</span><span>${runtime}</span>` : ''}
              ${data.number_of_seasons ? `<span aria-hidden="true">·</span><span>${data.number_of_seasons} Season${data.number_of_seasons > 1 ? 's' : ''}</span>` : ''}
              ${genres ? `<span aria-hidden="true">·</span><span style="color: var(--text-muted);">${escapeHtml(genres)}</span>` : ''}
            </div>
            <p class="detail-desc-text">${escapeHtml(overview)}</p>
            <div class="hero-ctas">
              <button class="btn-primary" onclick="window.__hdRouter.navigate('player', { id: ${id}, type: '${type}' })">
                ${ICONS.play(18)} Watch Now
              </button>
              ${trailer ? `
                <button class="btn-secondary" onclick="window.__hdOpenTrailer('${trailer.key}')">
                  ${ICONS.play(16)} Watch Official Trailer
                </button>
              ` : ''}
              <button class="btn-secondary" id="detail-fav-btn" 
                onclick="window.__hdToggleDetailFav(${id}, '${type}', '${escapeHtml(title)}', '${data.poster_path || ''}', ${data.vote_average || 0}, '${year}')">
                ${ICONS.heart(favActive, 14)} <span>${favActive ? 'Saved in Favorites' : 'Save to Favorites'}</span>
              </button>
              <button class="btn-secondary" onclick="window.__hdRouter.navigateBack()">
                ${ICONS.chevronLeft(16)} Back
              </button>
            </div>
          </div>
        </div>
      </div>

      ${cast.length ? `
        <div style="padding: 36px var(--page-px) 20px;">
          <div class="section-headline" style="margin-bottom: 16px;">
            <span class="section-idx">CAST</span>
            <h2 class="section-label">Cast & Creators</h2>
          </div>
          <div class="cast-shelf">
            ${cast.map(c => `
              <div class="cast-item-node">
                <img class="cast-avatar-photo" 
                  src="${c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"80\" height=\"80\"><rect fill=\"%231e293b\" width=\"80\" height=\"80\"/></svg>'}" 
                  alt="${escapeHtml(c.name)}" 
                  loading="lazy" />
                <div class="cast-actor-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</div>
                <div class="cast-role-name" title="${escapeHtml(c.character || '')}">${escapeHtml(c.character || '')}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${similar.length ? `
        <div style="margin-top: 10px;">
          ${renderShelf('similar-shelf', 'REC', 'More Like This', similar, type)}
        </div>
      ` : ''}
    `;
  } catch (err) {
    console.error('Failed to load detail page', err);
    containerEl.innerHTML = `
      <div style="padding: 100px var(--page-px); text-align: center;">
        <h2 style="font-size: 22px; margin-bottom: 12px;">Title Not Found</h2>
        <p style="color: var(--text-muted); margin-bottom: 24px;">Could not retrieve media details. Please try another Korean title.</p>
        <button class="btn-primary" onclick="window.__hdRouter.navigate('home')">Return Home</button>
      </div>
    `;
  }
}

window.__hdToggleDetailFav = function(id, type, title, poster, vote_average, release_date) {
  const added = toggleFavorite({ id, type, title, poster, vote_average, release_date });
  const btn = document.getElementById('detail-fav-btn');
  if (btn) {
    btn.innerHTML = `${ICONS.heart(added, 14)} <span>${added ? 'Saved in Favorites' : 'Save to Favorites'}</span>`;
  }
  showToast(added ? 'Saved to Favorites' : 'Removed from Favorites');
};

window.__hdOpenTrailer = function(youtubeKey) {
  let modal = document.getElementById('trailer-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'trailer-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.88);backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;padding:20px;';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div style="position:relative;width:100%;max-width:960px;aspect-ratio:16/9;background:#000;border-radius:12px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.8);border:1px solid rgba(255,255,255,0.15);">
      <button onclick="window.__hdCloseTrailer()" style="position:absolute;top:12px;right:12px;z-index:10;background:rgba(0,0,0,0.7);color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.2);">
        ${ICONS.close(16)}
      </button>
      <iframe src="https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1" style="width:100%;height:100%;border:none;" allow="autoplay; fullscreen" allowfullscreen></iframe>
    </div>
  `;
  modal.onclick = (e) => {
    if (e.target === modal) window.__hdCloseTrailer();
  };
};

window.__hdCloseTrailer = function() {
  const modal = document.getElementById('trailer-modal');
  if (modal) {
    modal.innerHTML = '';
    modal.remove();
  }
};
