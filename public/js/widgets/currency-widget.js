import { createWidgetShell, escapeHtml, formatNumber, WIDGET_ICONS } from './widget-utils.js';

export function renderCurrencyWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const content = `
        <div class="currency-conversion-display">
            <div class="currency-from-label">
                ${formatNumber(data.amount)} ${escapeHtml(data.from)} =
            </div>
            <div class="currency-result-value">
                ${formatNumber(data.converted)} <span class="currency-target-code">${escapeHtml(data.to)}</span>
            </div>
            <div class="currency-rate-meta">
                <span>Rate: 1 ${escapeHtml(data.from)} = ${formatNumber(data.rate)} ${escapeHtml(data.to)}</span>
                <span>•</span>
                <span>Source: ${escapeHtml(data.source || 'FX Benchmark')}</span>
            </div>
        </div>
    `;

    return createWidgetShell('currency', WIDGET_ICONS.currency, 'Currency Exchange', content);
}
