import { createWidgetShell, escapeHtml, formatNumber } from './widget-utils.js';

export function renderRedditWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    let html = '<div class="atlas-list">';
    for (const post of data.posts) {
        html += `
            <div class="atlas-list-item">
                ${post.thumbnail ? `<img src="${post.thumbnail}" class="atlas-list-thumb" alt="Thumb" loading="lazy">` : ''}
                <div class="atlas-list-content">
                    <h4><a href="${post.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(post.title)}</a></h4>
                    <div class="atlas-list-meta">
                        <span><i class="fa-solid fa-arrow-up"></i> ${formatNumber(post.ups)}</span>
                        <span><i class="fa-solid fa-comment"></i> ${formatNumber(post.comments)}</span>
                        <span>u/${escapeHtml(post.author)}</span>
                    </div>
                </div>
            </div>
        `;
    }
    html += '</div>';

    return createWidgetShell('reddit', '<i class="fa-brands fa-reddit-alien"></i>', `r/${data.subreddit} Trending`, html);
}
