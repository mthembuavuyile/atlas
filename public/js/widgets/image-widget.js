import { createWidgetShell, escapeHtml, WIDGET_ICONS } from './widget-utils.js';

export function openImageLightbox(src, title = '', author = '', provider = '', link = '') {
    let modal = document.getElementById('atlasImageLightboxModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'atlasImageLightboxModal';
        modal.className = 'atlas-lightbox-backdrop';
        modal.innerHTML = `
            <div class="atlas-lightbox-dialog" role="dialog" aria-modal="true">
                <div class="atlas-lightbox-header">
                    <span class="atlas-lightbox-title" id="atlasLightboxTitle">Image Preview</span>
                    <button class="atlas-lightbox-close" id="atlasLightboxCloseBtn" title="Close (Esc)" aria-label="Close">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="atlas-lightbox-body">
                    <div class="atlas-lightbox-img-wrap">
                        <img id="atlasLightboxImg" src="" alt="Full resolution preview">
                    </div>
                </div>
                <div class="atlas-lightbox-footer">
                    <div class="atlas-lightbox-meta" id="atlasLightboxMeta"></div>
                    <a id="atlasLightboxSourceLink" href="#" target="_blank" rel="noopener noreferrer" class="atlas-lightbox-link-btn">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        <span>Open Source</span>
                    </a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('#atlasLightboxCloseBtn')) {
                modal.classList.remove('active');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        });
    }

    const imgElem = modal.querySelector('#atlasLightboxImg');
    const titleElem = modal.querySelector('#atlasLightboxTitle');
    const metaElem = modal.querySelector('#atlasLightboxMeta');
    const linkElem = modal.querySelector('#atlasLightboxSourceLink');

    if (imgElem) imgElem.src = src;
    if (titleElem) titleElem.textContent = title || 'Visual Preview';
    if (metaElem) metaElem.textContent = `${provider || 'Visual'}${author ? ` · ${author}` : ''}`;
    if (linkElem) {
        linkElem.href = link || src;
        linkElem.style.display = link ? 'inline-flex' : 'none';
    }

    modal.classList.add('active');
}

if (typeof window !== 'undefined') {
    window.atlasOpenLightbox = openImageLightbox;

    // Attach global click handler for image cards if not already attached
    if (!window._atlasImageCardDelegated) {
        window._atlasImageCardDelegated = true;
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.atlas-image-card');
            if (card) {
                e.preventDefault();
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

    if (!data.images || data.images.length === 0) {
        return createWidgetShell('image', WIDGET_ICONS.image, `Visual References: ${escapeHtml(data.query || '')}`, `
            <div class="widget-notice">
                <span>No images located for "${escapeHtml(data.query || '')}".</span>
            </div>
        `);
    }

    let imagesHtml = '';
    for (const img of data.images) {
        const safeSrc = escapeHtml(img.src || '');
        const safeThumb = escapeHtml(img.thumb || img.src || '');
        const safeTitle = escapeHtml(img.title || data.query || 'Visual reference');
        const safeAuthor = escapeHtml(img.author || '');
        const safeProvider = escapeHtml(img.provider || 'Wikimedia');
        const safeLink = escapeHtml(img.link || img.src || '');

        imagesHtml += `
            <div class="atlas-image-card" data-src="${safeSrc}" data-title="${safeTitle}" data-author="${safeAuthor}" data-provider="${safeProvider}" data-link="${safeLink}" title="Click to expand: ${safeTitle}" role="button" tabindex="0">
                <div class="image-thumb-wrapper">
                    <img src="${safeThumb}" alt="${safeTitle}" loading="lazy" onerror="this.closest('.image-thumb-wrapper').classList.add('img-load-failed')">
                    <div class="image-card-overlay">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    </div>
                </div>
                <div class="image-card-info">
                    <span class="image-card-title">${safeTitle}</span>
                    <span class="image-card-meta">${safeProvider}</span>
                </div>
            </div>
        `;
    }

    const content = `<div class="atlas-image-grid">${imagesHtml}</div>`;
    return createWidgetShell('image', WIDGET_ICONS.image, `Visual References: ${escapeHtml(data.query || '')}`, content);
}
