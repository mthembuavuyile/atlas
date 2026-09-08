/**
 * Stock & Market Interactive Charts Capability (TradingView)
 * Zero API keys needed — 100% embeddable and free.
 */

const TICKER_MAP = {
  'google': 'NASDAQ:GOOGL',
  'googl': 'NASDAQ:GOOGL',
  'apple': 'NASDAQ:AAPL',
  'aapl': 'NASDAQ:AAPL',
  'nvidia': 'NASDAQ:NVDA',
  'nvda': 'NASDAQ:NVDA',
  'microsoft': 'NASDAQ:MSFT',
  'msft': 'NASDAQ:MSFT',
  'tesla': 'NASDAQ:TSLA',
  'tsla': 'NASDAQ:TSLA',
  'amazon': 'NASDAQ:AMZN',
  'amzn': 'NASDAQ:AMZN',
  'meta': 'NASDAQ:META',
  'netflix': 'NASDAQ:NFLX',
  'nflx': 'NASDAQ:NFLX',
  'amd': 'NASDAQ:AMD',
  'intel': 'NASDAQ:INTC',
  'intc': 'NASDAQ:INTC',
  'bitcoin': 'COINBASE:BTCUSD',
  'btc': 'COINBASE:BTCUSD',
  'ethereum': 'COINBASE:ETHUSD',
  'eth': 'COINBASE:ETHUSD',
  'solana': 'COINBASE:SOLUSD',
  'sol': 'COINBASE:SOLUSD'
};

function resolveTicker(query) {
  const clean = (query || '').trim().toLowerCase();
  if (TICKER_MAP[clean]) {
    return TICKER_MAP[clean];
  }
  if (clean.includes(':')) {
    return clean.toUpperCase();
  }
  return `NASDAQ:${clean.toUpperCase()}`;
}

const schema = {
  type: 'function',
  function: {
    name: 'get_stock_chart',
    description: 'Display an interactive market price chart for a stock or crypto ticker when user asks about stocks (e.g. Google, NVDA, Apple, BTC).',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Company name or ticker symbol, e.g. "Google", "NVDA", "Apple", "BTC", "TSLA"'
        }
      },
      required: ['query']
    }
  }
};

async function execute(args = {}) {
  const query = (args.query || args.ticker || args.symbol || 'Google').trim();
  const symbol = resolveTicker(query);

  return {
    type: 'stock_chart',
    data: {
      symbol,
      query,
      exchange: symbol.includes(':') ? symbol.split(':')[0] : 'NASDAQ',
      ticker: symbol.includes(':') ? symbol.split(':')[1] : symbol
    }
  };
}

module.exports = {
  name: 'get_stock_chart',
  domain: 'finance',
  schema,
  execute,
  resolveTicker,
  slashCommand: 'stock'
};
