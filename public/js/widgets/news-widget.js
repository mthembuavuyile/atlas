import { createWidgetShell, escapeHtml, formatTimeAgo, WIDGET_ICONS } from './widget-utils.js';

export function renderNewsWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    let html = '<div class="atlas-list">';
    for (const article of (data.articles || [])) {
        html += `
            <div class="atlas-list-item">
                ${article.image_url ? `<img src="${article.image_url}" class="atlas-list-thumb" alt="Thumbnail" loading="lazy">` : ''}
                <div class="atlas-list-content">
                    <h4><a href="${article.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(article.title)} ${WIDGET_ICONS.externalLink}</a></h4>
                    <div class="atlas-list-meta">
                        <span>${escapeHtml(article.news_site || 'Aerospace Wire')}</span>
                        <span>•</span>
                        <span>${formatTimeAgo(article.published_at)}</span>
                    </div>
                </div>
            </div>
        `;
    }
    html += '</div>';

    return createWidgetShell('news', WIDGET_ICONS.news, `Aerospace Feed${data.topic ? `: ${data.topic}` : ''}`, html);
}
