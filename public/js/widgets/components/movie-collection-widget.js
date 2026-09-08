import { createWidgetShell, escapeHtml, WIDGET_ICONS } from '../widget-utils.js';

export const movieCollectionWidget = {
  type: 'movie_collection',

  render(data) {
    if (!data) return '';
    if (data.error) {
      return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;
    }

    const title = escapeHtml(data.title || 'Movie Collection & Releases');
    const movies = Array.isArray(data.movies) ? data.movies : [];
    const query = escapeHtml(data.query || '');

    if (movies.length === 0) {
      return `<div class="atlas-widget">${escapeHtml('No movie suggestions found for this query.')}</div>`;
    }

    const movieCards = movies.map(m => {
      const itemTitle = escapeHtml(m.title || 'Untitled');
      const itemYear = escapeHtml(m.year || '');
      const releaseBadge = m.releaseDate ? escapeHtml(m.releaseDate) : (m.status ? escapeHtml(m.status) : itemYear);
      const genre = m.genre ? escapeHtml(m.genre) : null;
      const plot = m.plot ? escapeHtml(m.plot) : '';
      const director = m.director ? escapeHtml(m.director) : null;
      const poster = m.poster || null;

      const posterHtml = poster
        ? `<div class="atlas-collection-poster-wrap">
             <img src="${escapeHtml(poster)}" alt="${itemTitle}" class="atlas-collection-poster" loading="lazy" onerror="this.style.display='none'" />
           </div>`
        : `<div class="atlas-collection-poster-placeholder">
             <span class="atlas-collection-poster-icon">${WIDGET_ICONS.movie}</span>
           </div>`;

      return `
        <div class="atlas-collection-card">
          ${posterHtml}
          <div class="atlas-collection-info">
            <div class="atlas-collection-card-head">
              <div class="atlas-collection-title-wrap">
                <span class="atlas-collection-title">${itemTitle}</span>
                ${itemYear ? `<span class="atlas-collection-year">(${itemYear})</span>` : ''}
              </div>
              ${releaseBadge ? `<span class="atlas-collection-badge">${releaseBadge}</span>` : ''}
            </div>

            ${genre ? `<div class="atlas-collection-genre">${genre}</div>` : ''}
            ${director ? `<div class="atlas-collection-director">Dir: <strong>${director}</strong></div>` : ''}
            ${plot ? `<p class="atlas-collection-plot">${plot}</p>` : ''}

            <div class="atlas-collection-actions">
              <button class="atlas-collection-btn" onclick="window.atlasQueryMovie && window.atlasQueryMovie('${escapeHtml(m.title)}')">
                Inspect Movie
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const content = `
      <div class="atlas-movie-collection-container">
        <div class="atlas-movie-collection-grid">
          ${movieCards}
        </div>
      </div>
      <div class="widget-subtext">
        <span>Curated Release Intelligence & Database Grounding</span>
        <span class="widget-badge">${movies.length} Titles</span>
      </div>
    `;

    return createWidgetShell('movie-collection', WIDGET_ICONS.movie, title, content);
  }
};
