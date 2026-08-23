import { createWidgetShell, escapeHtml, WIDGET_ICONS } from './widget-utils.js';

export function renderImageWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    if (data.notice && (!data.images || data.images.length === 0)) {
        return createWidgetShell('image', WIDGET_ICONS.image, `Visual Reference: ${escapeHtml(data.query || '')}`, `
            <div class="widget-notice">
                <span>${escapeHtml(data.notice)}</span>
            </div>
        `);
    }

    let imagesHtml = '';
    if (Array.isArray(data.images)) {
        for (const img of data.images) {
            imagesHtml += `
                <a href="${img.link}" target="_blank" rel="noopener noreferrer" class="atlas-image-item" title="Photo by ${escapeHtml(img.author)} on ${img.provider}">
                    <img src="${img.thumb}" alt="Search result" loading="lazy" style="background-color: ${img.color || '#1e2024'}">
                </a>
            `;
        }
    }

    const content = `<div class="atlas-image-grid">${imagesHtml}</div>`;
    return createWidgetShell('image', WIDGET_ICONS.image, `Visuals: ${escapeHtml(data.query || '')}`, content);
}
