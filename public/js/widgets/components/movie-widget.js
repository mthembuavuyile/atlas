import { createWidgetShell, escapeHtml, WIDGET_ICONS } from '../widget-utils.js';

export const movieWidget = {
  type: 'movie',

  render(data) {
    if (!data) return '';
    if (data.error) {
      return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;
    }

    const title = escapeHtml(data.title || 'Unknown Title');
    const year = data.year ? `(${escapeHtml(data.year)})` : '';
    const rating = data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : null;
    const rated = data.rated && data.rated !== 'N/A' ? escapeHtml(data.rated) : null;
    const runtime = data.runtime && data.runtime !== 'N/A' ? escapeHtml(data.runtime) : null;
    const genre = data.genre && data.genre !== 'N/A' ? escapeHtml(data.genre) : null;
    const plot = data.plot && data.plot !== 'N/A' ? escapeHtml(data.plot) : 'No synopsis available.';
    const actors = data.actors && data.actors !== 'N/A' ? escapeHtml(data.actors) : null;
    const director = data.director && data.director !== 'N/A' ? escapeHtml(data.director) : null;
    const poster = data.poster || null;
    const imdbID = data.imdbID || null;

    const metaParts = [rated, runtime, genre].filter(Boolean).join(' · ');

    const posterHtml = poster
      ? `<div class="atlas-movie-poster-wrap">
           <img src="${escapeHtml(poster)}" alt="${title}" class="atlas-movie-poster" loading="lazy" onerror="this.style.display='none'" />
         </div>`
      : `<div class="atlas-movie-poster-placeholder">
           <span class="atlas-movie-icon">${WIDGET_ICONS.movie}</span>
         </div>`;

    const ratingBadge = rating
      ? `<span class="atlas-movie-rating-badge">★ ${escapeHtml(rating)}</span>`
      : '';

    const imdbLink = imdbID
      ? `<a href="https://www.imdb.com/title/${encodeURIComponent(imdbID)}/" target="_blank" rel="noopener noreferrer" class="atlas-movie-imdb-link">
           IMDb ${WIDGET_ICONS.externalLink}
         </a>`
      : '';

    const content = `
      <div class="atlas-movie-card">
        ${posterHtml}
        <div class="atlas-movie-info">
          <div class="atlas-movie-title-row">
            <h4 class="atlas-movie-title">${title}</h4>
            <span class="atlas-movie-year">${year}</span>
            ${ratingBadge}
          </div>

          ${metaParts ? `<div class="atlas-movie-meta">${metaParts}</div>` : ''}

          <p class="atlas-movie-plot">${plot}</p>

          <div class="atlas-movie-credits">
            ${actors ? `<div class="atlas-movie-credit-line"><strong>Cast:</strong> ${actors}</div>` : ''}
            ${director ? `<div class="atlas-movie-credit-line"><strong>Director:</strong> ${director}</div>` : ''}
          </div>

          ${imdbLink ? `<div class="atlas-movie-footer">${imdbLink}</div>` : ''}
        </div>
      </div>
    `;

    return createWidgetShell('movie', WIDGET_ICONS.movie, `Film: ${title}`, content);
  }
};
