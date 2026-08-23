import { createWidgetShell, escapeHtml, WIDGET_ICONS } from './widget-utils.js';

export function renderMathWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const content = `
        <div class="math-operation-tag">
            ${escapeHtml(data.operation || 'COMPUTATION')}
        </div>
        <div class="math-expression-display">
            ${escapeHtml(data.expression || '')}
        </div>
        <div class="math-result-display">
            = ${escapeHtml(data.result || '')}
        </div>
    `;

    return createWidgetShell('math', WIDGET_ICONS.math, 'Computation Engine', content);
}
