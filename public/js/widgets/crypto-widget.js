import { createWidgetShell, escapeHtml, formatNumber, WIDGET_ICONS } from './widget-utils.js';

export function renderCryptoWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    if (Array.isArray(data.items) && data.items.length > 0) {
        const rows = data.items.map(item => `
            <div class="crypto-multi-item">
                <span class="crypto-coin-symbol">${escapeHtml(item.coin.toUpperCase())}</span>
                <span class="atlas-crypto-price-sm">$${formatNumber(item.price)}</span>
            </div>
        `).join('');

        const content = `
            <div class="crypto-multi-container">${rows}</div>
            <div class="widget-subtext">
                <span>Real-Time Market Benchmark (USD)</span>
                ${data.source ? `<span class="widget-badge">${escapeHtml(data.source)}</span>` : ''}
            </div>
        `;
        return createWidgetShell('crypto', WIDGET_ICONS.crypto, 'Crypto Market Assets', content);
    }

    const content = `
        <div class="atlas-crypto-price">$${formatNumber(data.price)}</div>
        <div class="widget-subtext">
            <span>Market Price (USD)</span>
            ${data.source ? `<span class="widget-badge">${escapeHtml(data.source)}</span>` : ''}
        </div>
    `;

    return createWidgetShell('crypto', WIDGET_ICONS.crypto, `Market: ${(data.coin || 'Asset').toUpperCase()}`, content);
}
