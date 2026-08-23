import { createWidgetShell, escapeHtml } from './widget-utils.js';

export function renderAdviceWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const content = `
        <div style="font-size: 1.2rem; line-height: 1.6; font-weight: 500; font-style: italic; text-align: center; padding: 12px 0;">
            "${escapeHtml(data.advice)}"
        </div>
    `;

    return createWidgetShell('advice', '<i class="fa-solid fa-lightbulb"></i>', `Advice #${data.id}`, content);
}
