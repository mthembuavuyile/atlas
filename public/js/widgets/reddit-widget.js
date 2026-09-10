import { createWidgetShell, escapeHtml, formatNumber, WIDGET_ICONS } from './widget-utils.js';

export function renderRedditWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    if (!data.posts || !data.posts.length) {
        return `<div class="atlas-widget-empty">No live discussions found for ${escapeHtml(data.subreddit || 'this topic')}.</div>`;
    }

    // Build unified gallery of static image posts for Next/Prev lightbox navigation
    const imagePosts = (data.posts || []).filter(p => !!p.image && !p.is_video && !p.video);
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
        const isVideo = Boolean(post.is_video || post.video);
        const hasImage = Boolean(post.image);
        const galleryIndex = imagePosts.indexOf(post);

        // Extract direct playable stream candidate URLs
        const candidateSources = [
            ...(post.video ? [post.video] : []),
            ...(Array.isArray(post.video_sources) ? post.video_sources : [])
        ].filter((s, idx, arr) => s && arr.indexOf(s) === idx && !/(youtube\.com|youtu\.be|redgifs\.com|streamable\.com|gfycat\.com)/i.test(s));

        const isDirectStream = candidateSources.length > 0;

        let mediaHtml = '';
        if (isVideo) {
            if (isDirectStream) {
                mediaHtml = `
                    <div class="discussion-video-container">
                        <video class="discussion-video" controls playsinline preload="metadata" poster="${escapeHtml(post.image || '')}">
                            ${candidateSources.map((src, sIdx) => {
                                const type = src.includes('.m3u8') ? 'application/x-mpegurl' : (src.includes('.webm') ? 'video/webm' : 'video/mp4');
                                const isLast = sIdx === candidateSources.length - 1;
                                const errHandler = isLast
                                    ? `onerror="const fb=this.closest('.discussion-video-container')?.querySelector('.discussion-video-fallback-bar');if(fb)fb.style.display='flex';"`
                                    : '';
                                return `<source src="${escapeHtml(src)}" type="${type}" ${errHandler}>`;
                            }).join('')}
                            Your browser does not support inline video playback.
                        </video>
                        <div class="discussion-video-fallback-bar" style="display: none;">
                            <span class="video-fallback-msg">Stream playback unavailable</span>
                            <a href="${escapeHtml(post.url)}" target="_blank" rel="noopener noreferrer" class="video-fallback-btn">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                Watch on Reddit ↗
                            </a>
                        </div>
                    </div>
                `;
            } else {
                // External video (YouTube, RedGIFs, etc.) or indirect video link with poster
                mediaHtml = `
                    <div class="discussion-video-card">
                        <a href="${escapeHtml(post.video || post.url)}" target="_blank" rel="noopener noreferrer" class="discussion-video-card-link" title="Play video: ${escapeHtml(post.title)}">
                            ${hasImage ? `
                                <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy" referrerpolicy="no-referrer" class="discussion-video-card-thumb" onerror="if(this.src.includes('preview.redd.it')){this.src=this.src.replace(/^https?:\\/\\/preview\\.redd\\.it\\/([^?#]+)(\\?.*)?$/i,'https://i.redd.it/$1');}" />
                            ` : `
                                <div class="discussion-video-placeholder">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                </div>
                            `}
                            <div class="discussion-video-play-overlay">
                                <div class="discussion-play-circle">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                </div>
                                <span class="discussion-play-label">Play Video ↗</span>
                            </div>
                        </a>
                    </div>
                `;
            }
        } else if (hasImage) {
            mediaHtml = `
                <div class="discussion-thumbnail-container" title="Click to inspect (${galleryIndex + 1} of ${imagePosts.length}) - Use ← → arrows to navigate">
                    <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy" referrerpolicy="no-referrer" class="discussion-image" onerror="if(this.src.includes('preview.redd.it')){this.src=this.src.replace(/^https?:\\/\\/preview\\.redd\\.it\\/([^?#]+)(\\?.*)?$/i,'https://i.redd.it/$1');return;}const fb=this.nextElementSibling;if(fb){this.style.display='none';fb.style.display='flex';}" onclick="if(window.atlasOpenLightboxGallery && window['${galleryId}']) { window.atlasOpenLightboxGallery(window['${galleryId}'], ${galleryIndex}); } else if(window.atlasOpenLightbox) { window.atlasOpenLightbox(this.src, this.alt); } event.preventDefault(); event.stopPropagation();" style="cursor: zoom-in;" />
                    <div class="discussion-media-fallback-card" style="display: none;">
                        <a href="${escapeHtml(post.url)}" target="_blank" rel="noopener noreferrer">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                            <span>View Image on Reddit ↗</span>
                        </a>
                    </div>
                    ${post.is_gif ? `<span class="discussion-gif-badge">GIF</span>` : ''}
                    ${imagePosts.length > 1 && galleryIndex >= 0 ? `<span class="discussion-gallery-counter">${galleryIndex + 1} / ${imagePosts.length}</span>` : ''}
                </div>
            `;
        }

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

                    ${mediaHtml}

                    <div class="discussion-meta">
                        <span class="discussion-tag">${escapeHtml(post.subreddit || 'community')}</span>
                        <span>•</span>
                        <span>${formatNumber(post.comments || 0)} comments</span>
                        <span>•</span>
                        <span>${escapeHtml(post.author || 'author')}</span>
                        ${post.created_at ? `<span>•</span><span>${escapeHtml(post.created_at)}</span>` : ''}
                        ${isVideo ? `<span class="discussion-video-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Video</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    html += '</div>';

    const headerTitle = `${escapeHtml(data.source || 'Community Discussions')}: ${escapeHtml(data.subreddit || 'r/news')}`;
    return createWidgetShell('reddit', WIDGET_ICONS.reddit, headerTitle, html);
}
