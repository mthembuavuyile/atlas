import { createWidgetShell, escapeHtml, formatNumber } from './widget-utils.js';

export function renderCurrencyWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const content = `
        <div style="font-size: 1.2rem; color: var(--text-secondary); margin-bottom: 4px;">
            ${formatNumber(data.amount)} ${escapeHtml(data.from)} =
        </div>
        <div style="font-size: 2.5rem; font-weight: 700; color: #10b981; margin-bottom: 8px;">
            ${formatNumber(data.converted)} ${escapeHtml(data.to)}
        </div>
        <div style="font-size: 0.85rem; color: var(--text-tertiary);">
            Rate: 1 ${escapeHtml(data.from)} = ${formatNumber(data.rate)} ${escapeHtml(data.to)}
            <br>Source: ${escapeHtml(data.source)}
        </div>
    `;

    return createWidgetShell('currency', '<i class="fa-solid fa-money-bill-transfer"></i>', 'Currency Converter', content);
}
