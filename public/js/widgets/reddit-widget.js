import { createWidgetShell, escapeHtml, formatNumber, WIDGET_ICONS } from './widget-utils.js';
import { API_BASE } from '../config/constants.js';

function getPlayableVideoSources(post) {
    if (!post) return [];
    return [
        ...(post.video ? [post.video] : []),
        ...(Array.isArray(post.video_sources) ? post.video_sources : [])
    ].filter((s, idx, arr) => s && arr.indexOf(s) === idx && !/(youtube\.com|youtu\.be|redgifs\.com|streamable\.com|gfycat\.com)/i.test(s));
}

export function cycleRedditVideo(triggerEl, videoGalleryId, direction = 1) {
    if (typeof window === 'undefined' || !triggerEl) return;
    const list = window[videoGalleryId];
    if (!Array.isArray(list) || list.length < 2) return;

    const container = triggerEl.closest('.discussion-video-container');
    if (!container) return;

    const currentIdx = Number(container.getAttribute('data-video-index') || 0);
    const nextIdx = (currentIdx + direction + list.length) % list.length;
    const nextItem = list[nextIdx];
    if (!nextItem) return;

    container.setAttribute('data-video-index', String(nextIdx));

    // Pause any other playing Reddit videos in the DOM
    if (typeof document !== 'undefined') {
        document.querySelectorAll('.discussion-video').forEach(v => {
            try { v.pause(); } catch (_) {}
        });
    }

    const videoEl = container.querySelector('.discussion-video');
    const fallbackBar = container.querySelector('.discussion-video-fallback-bar');
    if (fallbackBar) {
        fallbackBar.style.display = 'none';
        const fbLink = fallbackBar.querySelector('.video-fallback-btn');
        if (fbLink && nextItem.link) fbLink.href = nextItem.link;
    }

    if (videoEl) {
        videoEl.poster = nextItem.poster || '';
        const sources = Array.isArray(nextItem.videoSources) ? nextItem.videoSources : [];
        videoEl.innerHTML = sources.map((src, sIdx) => {
            const type = src.includes('.m3u8')
                ? 'application/x-mpegurl'
                : (src.includes('.webm') ? 'video/webm' : 'video/mp4');
            const isLast = sIdx === sources.length - 1;
            const errHandler = isLast
                ? `onerror="const fb=this.closest('.discussion-video-container')?.querySelector('.discussion-video-fallback-bar');if(fb)fb.style.display='flex';"`
                : '';
            return `<source src="${escapeHtml(src)}" type="${type}" ${errHandler}>`;
        }).join('');
        try {
            videoEl.load();
            const playPromise = videoEl.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
            }
        } catch (_) {}
    }

    const counterEl = container.querySelector('.discussion-video-counter');
    if (counterEl) {
        counterEl.textContent = `${nextIdx + 1} / ${list.length}`;
    }

    const expandBtn = container.querySelector('.discussion-video-expand-btn');
    if (expandBtn) {
        expandBtn.setAttribute('data-video-index', String(nextIdx));
    }

    // Update parent discussion card title, score, and metadata to match the active video
    const cardItem = container.closest('.atlas-discussion-item');
    if (cardItem) {
        const scoreSpan = cardItem.querySelector('.discussion-score-badge span');
        if (scoreSpan && typeof nextItem.upsFormatted === 'string') {
            scoreSpan.textContent = nextItem.upsFormatted;
        }
        const titleLink = cardItem.querySelector('.discussion-title a');
        if (titleLink) {
            if (nextItem.link) titleLink.href = nextItem.link;
            titleLink.innerHTML = `${escapeHtml(nextItem.title)} <span class="external-icon">${WIDGET_ICONS.externalLink}</span>`;
        }
        const subTag = cardItem.querySelector('.discussion-tag');
        if (subTag && nextItem.provider) {
            subTag.textContent = nextItem.provider;
        }
    }
}

function toImageGalleryItem(p, idx) {
    return {
        type: 'image',
        isVideo: false,
        src: p.image,
        thumb: p.image,
        title: p.title || `Reddit image ${idx + 1}`,
        author: p.author || '',
        provider: p.subreddit || 'Reddit',
        link: p.url || ''
    };
}

function toVideoGalleryItem(p, idx) {
    const sources = getPlayableVideoSources(p);
    return {
        type: 'video',
        isVideo: true,
        src: sources[0] || p.video || '',
        videoSources: sources,
        poster: p.image || '',
        thumb: p.image || '',
        title: p.title || `Reddit video ${idx + 1}`,
        author: p.author || '',
        provider: p.subreddit || 'Reddit',
        link: p.url || '',
        upsFormatted: formatNumber(p.ups || 0),
        commentsFormatted: formatNumber(p.comments || 0),
        createdAt: p.created_at || ''
    };
}

function buildRedditVideoNavControlsHtml(videoGalleryId, videoIndex, totalVideos) {
    if (totalVideos <= 1 || videoIndex < 0) return '';
    return `
        <button type="button" class="discussion-video-nav-btn prev" title="Previous video (←)" aria-label="Previous video" onclick="if(window.atlasCycleRedditVideo){window.atlasCycleRedditVideo(this, '${videoGalleryId}', -1);} event.preventDefault(); event.stopPropagation();">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button type="button" class="discussion-video-nav-btn next" title="Next video (→)" aria-label="Next video" onclick="if(window.atlasCycleRedditVideo){window.atlasCycleRedditVideo(this, '${videoGalleryId}', 1);} event.preventDefault(); event.stopPropagation();">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <span class="discussion-gallery-counter discussion-video-counter">${videoIndex + 1} / ${totalVideos}</span>
    `;
}

function renderRedditPostCard(post, { galleryId, videoGalleryId, galleryIndex, totalImages, videoIndex, totalVideos }) {
    const isVideo = Boolean(post.is_video || post.video);
    const hasImage = Boolean(post.image);

    // Extract direct playable stream candidate URLs
    const candidateSources = getPlayableVideoSources(post);
    const isDirectStream = candidateSources.length > 0;

    let mediaHtml = '';
    if (isVideo) {
        if (isDirectStream) {
            mediaHtml = `
                <div class="discussion-video-container" data-video-index="${videoIndex >= 0 ? videoIndex : 0}" data-video-gallery="${videoGalleryId}">
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
                    ${buildRedditVideoNavControlsHtml(videoGalleryId, videoIndex, totalVideos)}
                    <button type="button" class="discussion-video-expand-btn" data-video-index="${videoIndex >= 0 ? videoIndex : 0}" title="Open video in lightbox viewer (← → to navigate)" aria-label="Open video in lightbox viewer" onclick="const idx=Number(this.getAttribute('data-video-index')||0); const v=this.closest('.discussion-video-container')?.querySelector('.discussion-video'); if(v){try{v.pause();}catch(_){}} if(window.atlasOpenLightboxGallery && window['${videoGalleryId}']) { window.atlasOpenLightboxGallery(window['${videoGalleryId}'], idx); } event.preventDefault(); event.stopPropagation();">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    </button>
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
            <div class="discussion-thumbnail-container" data-image-index="${galleryIndex >= 0 ? galleryIndex : 0}" title="Click to inspect (${galleryIndex + 1} of ${totalImages}) - Use ← → arrows to navigate">
                <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy" referrerpolicy="no-referrer" class="discussion-image" onerror="if(this.src.includes('preview.redd.it')){this.src=this.src.replace(/^https?:\\/\\/preview\\.redd\\.it\\/([^?#]+)(\\?.*)?$/i,'https://i.redd.it/$1');return;}const fb=this.nextElementSibling;if(fb){this.style.display='none';fb.style.display='flex';}" onclick="if(window.atlasOpenLightboxGallery && window['${galleryId}']) { window.atlasOpenLightboxGallery(window['${galleryId}'], ${galleryIndex}); } else if(window.atlasOpenLightbox) { window.atlasOpenLightbox(this.src, this.alt); } event.preventDefault(); event.stopPropagation();" style="cursor: zoom-in;" />
                <div class="discussion-media-fallback-card" style="display: none;">
                    <a href="${escapeHtml(post.url)}" target="_blank" rel="noopener noreferrer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        <span>View Image on Reddit ↗</span>
                    </a>
                </div>
                ${post.is_gif ? `<span class="discussion-gif-badge">GIF</span>` : ''}
                ${totalImages > 1 && galleryIndex >= 0 ? `<span class="discussion-gallery-counter">${galleryIndex + 1} / ${totalImages}</span>` : ''}
            </div>
        `;
    }

    return `
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

function refreshRedditGalleryCounters(listEl, galleryId, videoGalleryId) {
    if (!listEl || typeof window === 'undefined') return;
    const totalImages = Array.isArray(window[galleryId]) ? window[galleryId].length : 0;
    const totalVideos = Array.isArray(window[videoGalleryId]) ? window[videoGalleryId].length : 0;

    listEl.querySelectorAll('.discussion-thumbnail-container[data-image-index]').forEach(el => {
        const idx = Number(el.getAttribute('data-image-index') || 0);
        el.setAttribute('title', `Click to inspect (${idx + 1} of ${totalImages}) - Use ← → arrows to navigate`);
        let counter = el.querySelector('.discussion-gallery-counter');
        if (totalImages > 1) {
            if (!counter) {
                counter = document.createElement('span');
                counter.className = 'discussion-gallery-counter';
                el.appendChild(counter);
            }
            counter.textContent = `${idx + 1} / ${totalImages}`;
        }
    });

    listEl.querySelectorAll('.discussion-video-container').forEach(el => {
        const idx = Number(el.getAttribute('data-video-index') || 0);
        if (totalVideos > 1) {
            let counter = el.querySelector('.discussion-video-counter');
            if (!counter) {
                const expandBtn = el.querySelector('.discussion-video-expand-btn');
                const navHtml = buildRedditVideoNavControlsHtml(videoGalleryId, idx, totalVideos);
                if (expandBtn) {
                    expandBtn.insertAdjacentHTML('beforebegin', navHtml);
                } else {
                    el.insertAdjacentHTML('beforeend', navHtml);
                }
            } else {
                counter.textContent = `${idx + 1} / ${totalVideos}`;
            }
        }
    });
}

export async function loadMoreRedditPosts(btnEl, stateId) {
    if (typeof window === 'undefined' || !btnEl) return;
    const state = window[stateId];
    if (!state || state.loading || !state.after) return;

    const widgetEl = btnEl.closest('.atlas-widget-reddit');
    const listEl = widgetEl ? widgetEl.querySelector('.atlas-discussions-list') : null;
    if (!listEl) return;

    state.loading = true;
    btnEl.disabled = true;
    const labelEl = btnEl.querySelector('.reddit-load-more-label');
    const prevLabel = labelEl ? labelEl.textContent : 'Load more discussions';
    if (labelEl) labelEl.textContent = 'Loading more…';

    try {
        const res = await fetch(`${API_BASE}/api/widget/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tool: state.tool,
                args: { ...state.args, after: state.after }
            })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        const incoming = Array.isArray(payload?.data?.posts) ? payload.data.posts : [];
        const nextAfter = payload?.data?.pagination?.after || null;

        const freshPosts = incoming.filter(p => p && p.url && !state.seenUrls.has(p.url));
        freshPosts.forEach(p => state.seenUrls.add(p.url));

        const gallery = window[state.galleryId] || (window[state.galleryId] = []);
        const videoGallery = window[state.videoGalleryId] || (window[state.videoGalleryId] = []);

        const postIndexes = freshPosts.map(p => {
            const isVideo = Boolean(p.is_video || p.video);
            const isPlayableVideo = isVideo && getPlayableVideoSources(p).length > 0;
            const isStaticImage = Boolean(p.image) && !isVideo;
            let galleryIndex = -1;
            let videoIndex = -1;
            if (isStaticImage) {
                galleryIndex = gallery.length;
                gallery.push(toImageGalleryItem(p, galleryIndex));
            }
            if (isPlayableVideo) {
                videoIndex = videoGallery.length;
                videoGallery.push(toVideoGalleryItem(p, videoIndex));
            }
            return { post: p, galleryIndex, videoIndex };
        });

        const totalImages = gallery.length;
        const totalVideos = videoGallery.length;
        const cardsHtml = postIndexes.map(({ post, galleryIndex, videoIndex }) =>
            renderRedditPostCard(post, {
                galleryId: state.galleryId,
                videoGalleryId: state.videoGalleryId,
                galleryIndex,
                totalImages,
                videoIndex,
                totalVideos
            })
        ).join('');

        if (cardsHtml) {
            listEl.insertAdjacentHTML('beforeend', cardsHtml);
            refreshRedditGalleryCounters(listEl, state.galleryId, state.videoGalleryId);
        }

        state.after = nextAfter;
        const wrap = btnEl.closest('.reddit-load-more-wrap') || btnEl;
        if (!nextAfter || freshPosts.length === 0) {
            wrap.remove();
        } else {
            btnEl.disabled = false;
            if (labelEl) labelEl.textContent = prevLabel;
        }
    } catch (_) {
        btnEl.disabled = false;
        if (labelEl) labelEl.textContent = 'Retry loading more';
    } finally {
        state.loading = false;
    }
}

if (typeof window !== 'undefined') {
    window.atlasCycleRedditVideo = cycleRedditVideo;
    window.atlasLoadMoreReddit = loadMoreRedditPosts;
}

export function renderRedditWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    if (!data.posts || !data.posts.length) {
        return `<div class="atlas-widget-empty">No live discussions found for ${escapeHtml(data.subreddit || 'this topic')}.</div>`;
    }

    const allPosts = data.posts || [];

    // Build gallery of static image posts for Next/Prev lightbox navigation
    const imagePosts = allPosts.filter(p => !!p.image && !p.is_video && !p.video);
    const galleryItems = imagePosts.map((p, idx) => toImageGalleryItem(p, idx));

    // Build gallery of playable video posts for Next/Prev inline & lightbox navigation
    const videoPosts = allPosts.filter(p => Boolean(p.is_video || p.video) && getPlayableVideoSources(p).length > 0);
    const videoGalleryItems = videoPosts.map((p, idx) => toVideoGalleryItem(p, idx));

    const uid = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const galleryId = `redditGallery_${uid}`;
    const videoGalleryId = `redditVideoGallery_${uid}`;
    const stateId = `redditPaging_${uid}`;
    const pagination = data.pagination && data.pagination.after ? data.pagination : null;

    if (typeof window !== 'undefined') {
        window[galleryId] = galleryItems;
        window[videoGalleryId] = videoGalleryItems;
        if (pagination) {
            window[stateId] = {
                tool: pagination.tool || 'get_reddit_posts',
                args: pagination.args || { subreddit: data.subreddit || 'news' },
                after: pagination.after,
                galleryId,
                videoGalleryId,
                seenUrls: new Set(allPosts.map(p => p.url).filter(Boolean)),
                loading: false
            };
        }
    }

    let html = '<div class="atlas-discussions-list">';
    for (const post of allPosts) {
        html += renderRedditPostCard(post, {
            galleryId,
            videoGalleryId,
            galleryIndex: imagePosts.indexOf(post),
            totalImages: imagePosts.length,
            videoIndex: videoPosts.indexOf(post),
            totalVideos: videoPosts.length
        });
    }
    html += '</div>';

    if (pagination) {
        html += `
            <div class="reddit-load-more-wrap">
                <button type="button" class="reddit-load-more-btn" onclick="if(window.atlasLoadMoreReddit){window.atlasLoadMoreReddit(this, '${stateId}');}">
                    <span class="reddit-load-more-label">Load more discussions</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
            </div>
        `;
    }

    const headerTitle = `${escapeHtml(data.source || 'Community Discussions')}: ${escapeHtml(data.subreddit || 'r/news')}`;
    return createWidgetShell('reddit', WIDGET_ICONS.reddit, headerTitle, html);
}
