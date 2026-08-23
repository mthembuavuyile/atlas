import { createWidgetShell, escapeHtml, formatNumber } from './widget-utils.js';

export function renderCryptoWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const content = `
        <div class="atlas-crypto-price">$${formatNumber(data.price)}</div>
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 8px;">
            Live price (USD)
        </div>
    `;

    return createWidgetShell('crypto', '<i class="fa-brands fa-bitcoin"></i>', `Crypto: ${data.coin.toUpperCase()}`, content);
}
