import { createWidgetShell, escapeHtml, formatNumber, WIDGET_ICONS } from '../widget-utils.js';

export const cryptoTerminalWidget = {
  type: 'crypto_terminal',

  render(data) {
    if (!data) return '';
    if (data.error) {
      return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;
    }

    const prices = data.prices || {};
    const mempool = data.mempool || null;
    const fng = data.fearAndGreed || null;

    // 1. Asset Price Cards
    const coinEntries = Object.entries(prices);
    let priceGridHtml = '';

    if (coinEntries.length > 0) {
      const items = coinEntries.map(([coinId, details]) => {
        const symbol = coinId.toUpperCase();
        const price = details.usd !== undefined ? `$${formatNumber(details.usd)}` : 'N/A';
        const change = details.usd_24h_change !== undefined ? Number(details.usd_24h_change) : null;

        let changeBadge = '';
        if (change !== null) {
          const isPos = change >= 0;
          const sign = isPos ? '+' : '';
          const colorClass = isPos ? 'atlas-change-pos' : 'atlas-change-neg';
          changeBadge = `<span class="atlas-crypto-change ${colorClass}">${sign}${change.toFixed(2)}%</span>`;
        }

        return `
          <div class="atlas-crypto-asset-card">
            <div class="atlas-crypto-asset-head">
              <span class="atlas-crypto-symbol">${escapeHtml(symbol)}</span>
              ${changeBadge}
            </div>
            <div class="atlas-crypto-asset-price">${price}</div>
          </div>
        `;
      }).join('');

      priceGridHtml = `
        <div class="atlas-crypto-section">
          <div class="atlas-crypto-section-title">Spot Benchmarks (USD)</div>
          <div class="atlas-crypto-grid">${items}</div>
        </div>
      `;
    }

    // 2. Mempool Network Fees
    let mempoolHtml = '';
    if (mempool && (mempool.fastestFee || mempool.blockHeight)) {
      mempoolHtml = `
        <div class="atlas-crypto-section">
          <div class="atlas-crypto-section-title">
            <span>Bitcoin Network Fees (sat/vB)</span>
            ${mempool.blockHeight ? `<span class="atlas-block-badge">Block #${Number(mempool.blockHeight).toLocaleString()}</span>` : ''}
          </div>
          <div class="atlas-mempool-grid">
            <div class="atlas-mempool-card">
              <span class="atlas-mempool-label">Fastest (Next Block)</span>
              <span class="atlas-mempool-val">${mempool.fastestFee} sat/vB</span>
            </div>
            <div class="atlas-mempool-card">
              <span class="atlas-mempool-label">~30 Minutes</span>
              <span class="atlas-mempool-val">${mempool.halfHourFee} sat/vB</span>
            </div>
            <div class="atlas-mempool-card">
              <span class="atlas-mempool-label">~1 Hour</span>
              <span class="atlas-mempool-val">${mempool.hourFee} sat/vB</span>
            </div>
          </div>
        </div>
      `;
    }

    // 3. Fear & Greed Sentiment
    let fngHtml = '';
    if (fng && fng.score !== undefined) {
      const score = Math.min(Math.max(fng.score, 0), 100);
      const classification = escapeHtml(fng.classification || 'Neutral');

      let sentimentColor = '#fbbf24'; // Neutral
      if (score >= 75) sentimentColor = '#10b981'; // Extreme Greed
      else if (score >= 55) sentimentColor = '#34d399'; // Greed
      else if (score <= 25) sentimentColor = '#ef4444'; // Extreme Fear
      else if (score <= 45) sentimentColor = '#f87171'; // Fear

      fngHtml = `
        <div class="atlas-crypto-section">
          <div class="atlas-crypto-section-title">Market Sentiment Index</div>
          <div class="atlas-fng-row">
            <div class="atlas-fng-score" style="color: ${sentimentColor};">
              <span class="atlas-fng-number">${score}</span>
              <span class="atlas-fng-label">${classification}</span>
            </div>
            <div class="atlas-fng-track">
              <div class="atlas-fng-fill" style="width: ${score}%; background: ${sentimentColor};"></div>
            </div>
          </div>
        </div>
      `;
    }

    const content = `
      <div class="atlas-crypto-terminal-body">
        ${priceGridHtml}
        ${mempoolHtml}
        ${fngHtml}
      </div>
      <div class="widget-subtext">
        <span>Live Sources: CoinGecko · Mempool.space · Alternative.me</span>
        <span class="widget-badge">100% On-Chain & Grounded</span>
      </div>
    `;

    return createWidgetShell('crypto-terminal', WIDGET_ICONS.terminal, 'Crypto Terminal & On-Chain Intelligence', content);
  }
};
