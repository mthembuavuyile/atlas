import { createWidgetShell, escapeHtml, WIDGET_ICONS } from '../widget-utils.js';

let stockWidgetCounter = 0;

export const stockWidget = {
  type: 'stock_chart',

  render(data) {
    if (!data) return '';
    if (data.error) {
      return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;
    }

    const symbol = escapeHtml(data.symbol || 'NASDAQ:GOOGL');
    const query = escapeHtml(data.query || data.ticker || symbol);
    const containerId = `tv_chart_${Date.now()}_${++stockWidgetCounter}`;

    const content = `
      <div class="atlas-stock-container">
        <div id="${containerId}" class="atlas-tv-widget-host" data-symbol="${symbol}">
          <div class="atlas-stock-loading">
            <span>Loading interactive chart for ${symbol}...</span>
          </div>
        </div>
      </div>
      <div class="widget-subtext">
        <span>Live Exchange Overview (1D)</span>
        <span class="widget-badge">${symbol}</span>
      </div>
    `;

    return createWidgetShell('stock', WIDGET_ICONS.stock, `Market Chart: ${query.toUpperCase()}`, content);
  },

  mount(containerEl, data) {
    if (!containerEl) return;
    const hostEl = containerEl.querySelector('.atlas-tv-widget-host');
    if (!hostEl) return;

    const symbol = hostEl.dataset.symbol || data?.symbol || 'NASDAQ:GOOGL';
    hostEl.innerHTML = ''; // Clear loading state

    // Outer TradingView standard wrapper
    const tvContainer = document.createElement('div');
    tvContainer.className = 'tradingview-widget-container';
    tvContainer.style.width = '100%';
    tvContainer.style.height = '100%';

    // Inner widget mount target
    const tvWidget = document.createElement('div');
    tvWidget.className = 'tradingview-widget-container__widget';
    tvWidget.style.width = '100%';
    tvWidget.style.height = '100%';

    // TradingView official embed script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [[symbol, `${symbol}|1D`]],
      chartOnly: false,
      width: '100%',
      height: '100%',
      locale: 'en',
      colorTheme: 'dark',
      autosize: true,
      showVolume: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: 'right',
      scaleMode: 'Normal',
      fontFamily: 'DM Sans, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '10',
      noTimeScale: false,
      valuesTracking: '1',
      changeMode: 'price-and-percent',
      chartType: 'area',
      lineWidth: 2,
      lineType: 0,
      dateRanges: [
        '1d|1',
        '1m|30',
        '3m|60',
        '12m|1D',
        '60m|1W',
        'all|1M'
      ],
      upColor: '#10b981',
      downColor: '#ef4444'
    });

    tvContainer.appendChild(tvWidget);
    tvContainer.appendChild(script);
    hostEl.appendChild(tvContainer);
  }
};
