import { createWidgetShell, escapeHtml, formatTimeAgo, WIDGET_ICONS } from './widget-utils.js';

export function renderNewsWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const articles = data.articles || [];
    if (!articles.length) {
        return `<div class="atlas-widget-empty">No aerospace or astronomy news found${data.topic ? ` for "${escapeHtml(data.topic)}"` : ''}.</div>`;
    }

    let html = '<div class="atlas-news-list">';
    for (const article of articles) {
        const title = escapeHtml(article.title || 'Untitled Article');
        const url = escapeHtml(article.url || '#');
        const site = escapeHtml(article.news_site || 'Space Wire');
        const summary = article.summary ? escapeHtml(article.summary) : '';
        const timeAgo = formatTimeAgo(article.published_at);
        const imageUrl = article.image_url ? escapeHtml(article.image_url) : '';

        html += `
            <div class="atlas-news-item">
                ${imageUrl ? `
                <div class="atlas-news-thumb-wrapper">
                    <img src="${imageUrl}" class="atlas-news-thumb" alt="${title}" loading="lazy" onerror="this.parentElement.style.display='none'" />
                </div>` : ''}
                <div class="atlas-news-content">
                    <h4 class="atlas-news-title">
                        <a href="${url}" target="_blank" rel="noopener noreferrer">
                            ${title}
                            <span class="external-icon">${WIDGET_ICONS.externalLink}</span>
                        </a>
                    </h4>
                    ${summary ? `<p class="atlas-news-summary">${summary}</p>` : ''}
                    <div class="atlas-news-meta">
                        <span class="atlas-news-site">${site}</span>
                        <span>•</span>
                        <span>${timeAgo}</span>
                    </div>
                </div>
            </div>
        `;
    }
    html += '</div>';

    const topicLabel = data.topic ? `: ${escapeHtml(data.topic)}` : '';
    return createWidgetShell('news', WIDGET_ICONS.news, `Space & Astronomy News${topicLabel}`, html);
}

