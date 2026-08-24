import { createWidgetShell, escapeHtml, WIDGET_ICONS } from './widget-utils.js';

export function renderImageWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    if (!data.images || data.images.length === 0) {
        return createWidgetShell('image', WIDGET_ICONS.image, `Visuals: ${escapeHtml(data.query || '')}`, `
            <div class="widget-notice">
                <span>No images located for "${escapeHtml(data.query || '')}".</span>
            </div>
        `);
    }

    let imagesHtml = '';
    for (const img of data.images) {
        imagesHtml += `
            <a href="${img.link || img.src}" target="_blank" rel="noopener noreferrer" class="atlas-image-card" title="${escapeHtml(img.title || img.author || '')}">
                <div class="image-thumb-wrapper">
                    <img src="${img.thumb || img.src}" alt="${escapeHtml(img.title || 'Visual result')}" loading="lazy">
                </div>
                <div class="image-card-info">
                    <span class="image-card-title">${escapeHtml(img.title || data.query || 'Image')}</span>
                    <span class="image-card-meta">${escapeHtml(img.provider || 'Wikimedia')}</span>
                </div>
            </a>
        `;
    }

    const content = `<div class="atlas-image-grid">${imagesHtml}</div>`;
    return createWidgetShell('image', WIDGET_ICONS.image, `Visual References: ${escapeHtml(data.query || '')}`, content);
}
