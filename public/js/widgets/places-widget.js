import { createWidgetShell, escapeHtml, WIDGET_ICONS } from './widget-utils.js';

export function renderPlacesWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const places = data.places || [];
    if (!places.length) {
        return `<div class="atlas-widget error">No places found for "${escapeHtml(data.query)}".</div>`;
    }

    const countBadge = `<span class="atlas-widget-count-badge">${places.length} FOUND</span>`;

    const itemsHtml = places.map((place, idx) => `
        <div class="places-item">
            <div class="places-item-header">
                <span class="places-item-num">${idx + 1}</span>
                <div class="places-item-title-group">
                    <span class="places-item-name">${escapeHtml(place.name)}</span>
                    <span class="widget-badge">${escapeHtml(place.category || 'LOCATION')}</span>
                </div>
            </div>
            <div class="places-item-address">${escapeHtml(place.address)}</div>
            <div class="places-item-footer">
                <a href="${escapeHtml(place.mapUrl)}" target="_blank" rel="noopener noreferrer" class="places-map-link">
                    <span>Open in OpenStreetMap</span>
                    ${WIDGET_ICONS.externalLink}
                </a>
            </div>
        </div>
    `).join('');

    const content = `<div class="places-widget-list">${itemsHtml}</div>`;
    return createWidgetShell('places', WIDGET_ICONS.places, `Places · ${escapeHtml(data.query)}`, content, countBadge);
}
