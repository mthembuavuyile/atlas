import { createWidgetShell, escapeHtml, formatNumber, WIDGET_ICONS } from './widget-utils.js';

export function renderRedditWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    if (!data.posts || !data.posts.length) {
        return `<div class="atlas-widget-empty">No live discussions found for ${escapeHtml(data.subreddit || 'this topic')}.</div>`;
    }

    // Build unified gallery of all posts that contain images for Next/Prev lightbox navigation
    const imagePosts = (data.posts || []).filter(p => !!p.image);
    const galleryItems = imagePosts.map((p, idx) => ({
        src: p.image,
        thumb: p.image,
        title: p.title || `Reddit image ${idx + 1}`,
        author: p.author || '',
        provider: p.subreddit || 'Reddit',
        link: p.url || ''
    }));

    const galleryId = `redditGallery_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    if (typeof window !== 'undefined') {
        window[galleryId] = galleryItems;
    }

    let html = '<div class="atlas-discussions-list">';
    for (const post of (data.posts || [])) {
        const galleryIndex = imagePosts.indexOf(post);

        html += `
            <div class="atlas-discussion-item">
                <div class="discussion-score-badge" title="Upvotes / Score">
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

                    ${post.video ? `
                        <div class="discussion-video-container">
                            <video class="discussion-video" controls playsinline preload="metadata" poster="${escapeHtml(post.image || '')}">
                                <source src="${escapeHtml(post.video)}" type="video/mp4" onerror="const c = this.closest('.discussion-video-container'); if (c) { c.style.display='none'; const fb = c.nextElementSibling; if (fb) fb.style.display='block'; }">
                                Your browser does not support inline video playback.
                            </video>
                        </div>
                        ${post.image ? `
                            <div class="discussion-thumbnail-container discussion-video-fallback" style="display: none;" title="Click to inspect (${galleryIndex + 1} of ${imagePosts.length})">
                                <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.style.display='none'" onclick="if(window.atlasOpenLightboxGallery && window['${galleryId}']) { window.atlasOpenLightboxGallery(window['${galleryId}'], ${galleryIndex}); } else if(window.atlasOpenLightbox) { window.atlasOpenLightbox('${escapeHtml(post.image)}', '${escapeHtml(post.title)}'); } event.preventDefault(); event.stopPropagation();" style="cursor: zoom-in;" />
                            </div>
                        ` : ''}
                    ` : (post.image ? `
                        <div class="discussion-thumbnail-container" title="Click to inspect (${galleryIndex + 1} of ${imagePosts.length}) - Use ← → arrows to navigate">
                            <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.style.display='none'" onclick="if(window.atlasOpenLightboxGallery && window['${galleryId}']) { window.atlasOpenLightboxGallery(window['${galleryId}'], ${galleryIndex}); } else if(window.atlasOpenLightbox) { window.atlasOpenLightbox('${escapeHtml(post.image)}', '${escapeHtml(post.title)}'); } event.preventDefault(); event.stopPropagation();" style="cursor: zoom-in;" />
                            ${imagePosts.length > 1 ? `<span class="discussion-gallery-counter">${galleryIndex + 1} / ${imagePosts.length}</span>` : ''}
                        </div>
                    ` : '')}

                    <div class="discussion-meta">
                        <span class="discussion-tag">${escapeHtml(post.subreddit || 'community')}</span>
                        <span>•</span>
                        <span>${formatNumber(post.comments || 0)} comments</span>
                        <span>•</span>
                        <span>${escapeHtml(post.author || 'author')}</span>
                        ${post.created_at ? `<span>•</span><span>${escapeHtml(post.created_at)}</span>` : ''}
                        ${post.video ? `<span class="discussion-video-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Video</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    html += '</div>';

    const headerTitle = `${escapeHtml(data.source || 'Community Discussions')}: ${escapeHtml(data.subreddit || 'r/news')}`;
    return createWidgetShell('reddit', WIDGET_ICONS.reddit, headerTitle, html);
}
