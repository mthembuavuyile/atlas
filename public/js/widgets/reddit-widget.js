import { createWidgetShell, escapeHtml, formatNumber, WIDGET_ICONS } from './widget-utils.js';

export function renderRedditWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    let html = '<div class="atlas-discussions-list">';
    for (const post of (data.posts || [])) {
        html += `
            <div class="atlas-discussion-item">
                <div class="discussion-score-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    <span>${formatNumber(post.ups || 0)}</span>
                </div>
                <div class="discussion-content">
                    <h4 class="discussion-title">
                        <a href="${post.url}" target="_blank" rel="noopener noreferrer">
                            ${escapeHtml(post.title)}
                            <span class="external-icon">${WIDGET_ICONS.externalLink}</span>
                        </a>
                    </h4>
                    <div class="discussion-meta">
                        <span class="discussion-tag">${escapeHtml(post.subreddit || 'community')}</span>
                        <span>•</span>
                        <span>${formatNumber(post.comments || 0)} comments</span>
                        <span>•</span>
                        <span>${escapeHtml(post.author || 'author')}</span>
                        ${post.created_at ? `<span>•</span><span>${escapeHtml(post.created_at)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    html += '</div>';

    const headerTitle = `Community Discussions: ${escapeHtml(data.subreddit || 'Tech')}`;
    return createWidgetShell('reddit', WIDGET_ICONS.reddit, headerTitle, html);
}
