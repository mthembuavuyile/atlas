import { createWidgetShell, escapeHtml } from './widget-utils.js';

export function renderBibleWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const content = `
        <blockquote class="atlas-bible-verse">
            "${escapeHtml(data.text.trim())}"
        </blockquote>
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 12px; text-align: right;">
            — ${escapeHtml(data.reference)} (${escapeHtml(data.translation)})
        </div>
    `;

    return createWidgetShell('bible', '<i class="fa-solid fa-book-bible"></i>', 'Bible Verse', content);
}
