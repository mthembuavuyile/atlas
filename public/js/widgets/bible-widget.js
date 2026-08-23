import { createWidgetShell, escapeHtml, WIDGET_ICONS } from './widget-utils.js';

export function renderBibleWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const content = `
        <blockquote class="atlas-bible-verse">
            "${escapeHtml(data.text ? data.text.trim() : '')}"
        </blockquote>
        <div class="bible-reference-footer">
            — ${escapeHtml(data.reference || '')} <span class="widget-badge">${escapeHtml(data.translation || 'KJV')}</span>
        </div>
    `;

    return createWidgetShell('bible', WIDGET_ICONS.bible, 'Textual Reference', content);
}
