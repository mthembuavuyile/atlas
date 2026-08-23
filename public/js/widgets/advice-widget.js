import { createWidgetShell, escapeHtml, WIDGET_ICONS } from './widget-utils.js';

export function renderAdviceWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const content = `
        <div class="atlas-advice-content">
            "${escapeHtml(data.advice || '')}"
        </div>
        ${data.id ? `<div class="atlas-advice-meta">Reference #${data.id}</div>` : ''}
    `;

    return createWidgetShell('advice', WIDGET_ICONS.advice, 'Heuristic Insight', content);
}
