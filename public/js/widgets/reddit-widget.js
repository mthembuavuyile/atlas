import { createWidgetShell, escapeHtml, formatNumber, WIDGET_ICONS } from './widget-utils.js';

export function renderRedditWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    let html = '<div class="atlas-list">';
    for (const post of (data.posts || [])) {
        html += `
            <div class="atlas-list-item">
                ${post.thumbnail ? `<img src="${post.thumbnail}" class="atlas-list-thumb" alt="Thumb" loading="lazy">` : ''}
                <div class="atlas-list-content">
                    <h4><a href="${post.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(post.title)} ${WIDGET_ICONS.externalLink}</a></h4>
                    <div class="atlas-list-meta">
                        <span>Score: ${formatNumber(post.ups)}</span>
                        <span>•</span>
                        <span>Comments: ${formatNumber(post.comments)}</span>
                        <span>•</span>
                        <span>Author: ${escapeHtml(post.author)}</span>
                    </div>
                </div>
            </div>
        `;
    }
    html += '</div>';

    return createWidgetShell('reddit', WIDGET_ICONS.reddit, `Discussions: ${escapeHtml(data.subreddit || 'Community')}`, html);
}
