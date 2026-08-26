import { createWidgetShell, escapeHtml, WIDGET_ICONS } from './widget-utils.js';

export function renderUnitWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const content = `
        <div class="unit-widget-display">
            <div class="unit-from-label">
                ${escapeHtml(data.value)} <span class="unit-code">${escapeHtml(data.from)}</span> =
            </div>
            <div class="unit-result-value">
                ${escapeHtml(data.formattedResult || data.result)}
            </div>
            <div class="unit-meta-row">
                <span class="widget-badge">${escapeHtml(data.category || 'Metric')}</span>
                ${data.formula ? `<span class="unit-formula">${escapeHtml(data.formula)}</span>` : ''}
            </div>
        </div>
    `;

    return createWidgetShell('unit', WIDGET_ICONS.unit, 'Unit Conversion', content);
}
