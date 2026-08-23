import { createWidgetShell, escapeHtml } from './widget-utils.js';

export function renderImageWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    let imagesHtml = '';
    for (const img of data.images) {
        imagesHtml += `
            <a href="${img.link}" target="_blank" rel="noopener noreferrer" class="atlas-image-item" title="Photo by ${escapeHtml(img.author)} on ${img.provider}">
                <img src="${img.thumb}" alt="Search result" loading="lazy" style="background-color: ${img.color}">
            </a>
        `;
    }

    const content = `<div class="atlas-image-grid">${imagesHtml}</div>`;
    return createWidgetShell('image', '<i class="fa-solid fa-image"></i>', `Images: ${data.query}`, content);
}
