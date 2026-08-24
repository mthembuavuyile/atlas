import { createWidgetShell, escapeHtml, WIDGET_ICONS } from './widget-utils.js';

let activeGallery = [];
let activeIndex = 0;

export function openLightboxGallery(gallery = [], startIndex = 0) {
    if (!Array.isArray(gallery) || gallery.length === 0) return;
    activeGallery = gallery;
    activeIndex = Math.max(0, Math.min(startIndex, gallery.length - 1));
    showLightboxCurrent();
}

export function openImageLightbox(src, title = '', author = '', provider = '', link = '') {
    const singleItem = [{ src, thumb: src, title, author, provider, link }];
    openLightboxGallery(singleItem, 0);
}

function ensureLightboxModal() {
    let modal = document.getElementById('atlasImageLightboxModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'atlasImageLightboxModal';
        modal.className = 'atlas-lightbox-backdrop';
        modal.innerHTML = `
            <div class="atlas-lightbox-dialog" role="dialog" aria-modal="true">
                <div class="atlas-lightbox-header">
                    <div class="atlas-lightbox-header-info">
                        <span class="atlas-lightbox-title" id="atlasLightboxTitle">Visual Reference</span>
                        <span class="atlas-lightbox-counter" id="atlasLightboxCounter">1 / 1</span>
                    </div>
                    <button class="atlas-lightbox-close" id="atlasLightboxCloseBtn" title="Close (Esc)" aria-label="Close">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="atlas-lightbox-body">
                    <button class="atlas-lightbox-nav-btn prev" id="atlasLightboxPrevBtn" title="Previous (←)" aria-label="Previous Image">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <div class="atlas-lightbox-img-wrap" id="atlasLightboxImgWrap">
                        <div class="atlas-lightbox-spinner" id="atlasLightboxSpinner"></div>
                        <img id="atlasLightboxImg" src="" alt="Full resolution preview">
                    </div>
                    <button class="atlas-lightbox-nav-btn next" id="atlasLightboxNextBtn" title="Next (→)" aria-label="Next Image">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                </div>
                <div class="atlas-lightbox-footer">
                    <div class="atlas-lightbox-meta" id="atlasLightboxMeta"></div>
                    <div class="atlas-lightbox-actions">
                        <a id="atlasLightboxSourceLink" href="#" target="_blank" rel="noopener noreferrer" class="atlas-lightbox-link-btn" title="Open original provider link">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            <span>Source</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('#atlasLightboxCloseBtn')) {
                modal.classList.remove('active');
            }
        });

        const prevBtn = modal.querySelector('#atlasLightboxPrevBtn');
        const nextBtn = modal.querySelector('#atlasLightboxNextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigateLightbox(-1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigateLightbox(1);
            });
        }

        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('active')) return;
            if (e.key === 'Escape') {
                modal.classList.remove('active');
            } else if (e.key === 'ArrowLeft') {
                navigateLightbox(-1);
            } else if (e.key === 'ArrowRight') {
                navigateLightbox(1);
            }
        });
    }

    return modal;
}

function navigateLightbox(direction) {
    if (!activeGallery.length) return;
    activeIndex = (activeIndex + direction + activeGallery.length) % activeGallery.length;
    showLightboxCurrent();
}

function showLightboxCurrent() {
    const modal = ensureLightboxModal();
    const item = activeGallery[activeIndex];
    if (!item) return;

    const imgElem = modal.querySelector('#atlasLightboxImg');
    const titleElem = modal.querySelector('#atlasLightboxTitle');
    const counterElem = modal.querySelector('#atlasLightboxCounter');
    const metaElem = modal.querySelector('#atlasLightboxMeta');
    const linkElem = modal.querySelector('#atlasLightboxSourceLink');
    const prevBtn = modal.querySelector('#atlasLightboxPrevBtn');
    const nextBtn = modal.querySelector('#atlasLightboxNextBtn');
    const spinner = modal.querySelector('#atlasLightboxSpinner');

    const total = activeGallery.length;
    if (counterElem) {
        counterElem.textContent = total > 1 ? `${activeIndex + 1} / ${total}` : '';
        counterElem.style.display = total > 1 ? 'inline-block' : 'none';
    }

    if (prevBtn && nextBtn) {
        prevBtn.style.display = total > 1 ? 'flex' : 'none';
        nextBtn.style.display = total > 1 ? 'flex' : 'none';
    }

    if (titleElem) {
        titleElem.textContent = item.title || 'Visual Reference';
        titleElem.title = item.title || '';
    }

    if (metaElem) {
        const parts = [];
        if (item.provider) parts.push(item.provider);
        if (item.author) parts.push(item.author);
        if (item.width && item.height) parts.push(`${item.width} × ${item.height}px`);
        metaElem.textContent = parts.join(' · ');
    }

    if (linkElem) {
        linkElem.href = item.link || item.src;
        linkElem.style.display = (item.link || item.src) ? 'inline-flex' : 'none';
    }

    if (imgElem) {
        if (spinner) spinner.style.display = 'block';
        imgElem.style.opacity = '0';
        imgElem.onload = () => {
            if (spinner) spinner.style.display = 'none';
            imgElem.style.opacity = '1';
        };
        imgElem.onerror = () => {
            if (spinner) spinner.style.display = 'none';
            imgElem.style.opacity = '1';
        };
        imgElem.src = item.src || item.thumb;
    }

    modal.classList.add('active');
}

if (typeof window !== 'undefined') {
    window.atlasOpenLightbox = openImageLightbox;
    window.atlasOpenLightboxGallery = openLightboxGallery;

    // Attach global click handler for image cards if not already attached
    if (!window._atlasImageCardDelegated) {
        window._atlasImageCardDelegated = true;
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.atlas-image-card');
            if (card) {
                e.preventDefault();
                const grid = card.closest('.atlas-image-grid');
                if (grid) {
                    const allCards = Array.from(grid.querySelectorAll('.atlas-image-card'));
                    const galleryData = allCards.map(c => ({
                        src: c.getAttribute('data-src') || '',
                        thumb: c.getAttribute('data-thumb') || c.getAttribute('data-src') || '',
                        title: c.getAttribute('data-title') || '',
                        author: c.getAttribute('data-author') || '',
                        provider: c.getAttribute('data-provider') || '',
                        link: c.getAttribute('data-link') || ''
                    }));
                    const index = allCards.indexOf(card);
                    openLightboxGallery(galleryData, index >= 0 ? index : 0);
                    return;
                }

                // Fallback single image open
                const src = card.getAttribute('data-src');
                const title = card.getAttribute('data-title');
                const author = card.getAttribute('data-author');
                const provider = card.getAttribute('data-provider');
                const link = card.getAttribute('data-link');
                openImageLightbox(src, title, author, provider, link);
            }
        });
    }
}

export function renderImageWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const images = Array.isArray(data.images) ? data.images : [];
    const query = data.query || '';
    const totalCount = data.total || images.length;

    if (images.length === 0) {
        return createWidgetShell('image', WIDGET_ICONS.image, `Visual References: ${query}`, `
            <div class="widget-notice">
                <span>No images located for "${escapeHtml(query)}".</span>
            </div>
        `);
    }

    const countLabel = totalCount === 1 ? '1 Image' : `${totalCount} Images`;
    const metaBadgeHtml = `<span class="atlas-widget-count-badge">${escapeHtml(countLabel)}</span>`;

    let imagesHtml = '';
    images.forEach((img, idx) => {
        const safeSrc = escapeHtml(img.src || '');
        const safeThumb = escapeHtml(img.thumb || img.src || '');
        const safeTitle = escapeHtml(img.title || query || `Visual reference ${idx + 1}`);
        const safeAuthor = escapeHtml(img.author || '');
        const safeProvider = escapeHtml(img.provider || 'Wikimedia');
        const safeLink = escapeHtml(img.link || img.src || '');

        imagesHtml += `
            <div class="atlas-image-card" data-index="${idx}" data-src="${safeSrc}" data-thumb="${safeThumb}" data-title="${safeTitle}" data-author="${safeAuthor}" data-provider="${safeProvider}" data-link="${safeLink}" title="Click to inspect (${idx + 1} of ${totalCount}): ${safeTitle}" role="button" tabindex="0">
                <div class="image-thumb-wrapper">
                    <img src="${safeThumb}" alt="${safeTitle}" loading="lazy" onload="this.classList.add('loaded')" onerror="const w = this.closest('.image-thumb-wrapper'); if(w){ w.classList.add('img-load-failed'); }">
                    <div class="image-card-badge-num">#${idx + 1}</div>
                    <div class="image-card-overlay">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                    </div>
                    <div class="image-fallback-placeholder">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        <span>Preview unavailable</span>
                    </div>
                </div>
                <div class="image-card-info">
                    <span class="image-card-title">${safeTitle}</span>
                    <div class="image-card-meta-row">
                        <span class="image-card-meta">${safeProvider}</span>
                        ${safeAuthor ? `<span class="image-card-author">${safeAuthor}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    const content = `<div class="atlas-image-grid" data-count="${images.length}">${imagesHtml}</div>`;
    return createWidgetShell('image', WIDGET_ICONS.image, `Visual References: ${query}`, content, metaBadgeHtml);
}
