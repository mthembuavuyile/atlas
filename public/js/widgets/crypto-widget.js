import { createWidgetShell, escapeHtml, formatNumber, WIDGET_ICONS } from './widget-utils.js';

export function renderCryptoWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const content = `
        <div class="atlas-crypto-price">$${formatNumber(data.price)}</div>
        <div class="widget-subtext">
            <span>Market Price (USD)</span>
            ${data.source ? `<span class="widget-badge">${escapeHtml(data.source)}</span>` : ''}
        </div>
    `;

    return createWidgetShell('crypto', WIDGET_ICONS.crypto, `Market: ${(data.coin || 'Asset').toUpperCase()}`, content);
}
