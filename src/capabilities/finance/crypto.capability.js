/**
 * Crypto Terminal Capability (CoinGecko, Mempool.space, Alternative.me Fear & Greed)
 * 100% Free, NO API keys required.
 */

const { fetchWithTimeout } = require('../../utils/fetchWithTimeout');
const cache = require('../../utils/cache');

const COINGECKO_MAP = {
  'btc': 'bitcoin',
  'eth': 'ethereum',
  'sol': 'solana',
  'doge': 'dogecoin',
  'xrp': 'ripple',
  'ada': 'cardano',
  'dot': 'polkadot',
  'avax': 'avalanche-2',
  'link': 'chainlink'
};

async function fetchCryptoPrices(coins = 'bitcoin,ethereum,solana', currency = 'usd') {
  const cacheKey = `crypto_prices:${coins}:${currency}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coins)}&vs_currencies=${currency}&include_24hr_change=true&include_market_cap=true`;
    const res = await fetchWithTimeout(url, {}, 4000);
    if (!res.ok) throw new Error(`CoinGecko status: ${res.status}`);
    const data = await res.json();
    cache.set(cacheKey, data, 90); // 90 sec TTL
    return data;
  } catch (err) {
    console.warn('[Crypto Capability] CoinGecko price fetch fallback:', err.message);
    // Return empty map on failure so mempool / fear & greed still display
    return {};
  }
}

async function fetchMempoolStats() {
  const cacheKey = 'crypto:mempool_stats';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const [feeRes, blockRes] = await Promise.all([
      fetchWithTimeout('https://mempool.space/api/v1/fees/recommended', {}, 3500),
      fetchWithTimeout('https://mempool.space/api/blocks/tip/height', {}, 3500)
    ]);

    const fees = await feeRes.json();
    const height = await blockRes.text();

    const data = {
      fastestFee: Number(fees.fastestFee) || 0,
      halfHourFee: Number(fees.halfHourFee) || 0,
      hourFee: Number(fees.hourFee) || 0,
      minimumFee: Number(fees.minimumFee) || 0,
      blockHeight: parseInt(height, 10) || 0
    };

    cache.set(cacheKey, data, 60); // 60 sec TTL
    return data;
  } catch (err) {
    console.warn('[Crypto Capability] Mempool stats fetch fallback:', err.message);
    return null;
  }
}

async function fetchFearAndGreed() {
  const cacheKey = 'crypto:fear_greed';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout('https://api.alternative.me/fng/?limit=1', {}, 4000);
    const data = await res.json();
    const item = data?.data?.[0];

    if (!item) return null;

    const result = {
      score: parseInt(item.value, 10) || 50,
      classification: item.value_classification || 'Neutral',
      timestamp: item.timestamp
    };

    cache.set(cacheKey, result, 300); // 5 min TTL
    return result;
  } catch (err) {
    console.warn('[Crypto Capability] Fear & Greed fetch fallback:', err.message);
    return null;
  }
}

const schema = {
  type: 'function',
  function: {
    name: 'get_crypto_terminal',
    description: 'Get live crypto terminal intelligence: Bitcoin network stats, mempool recommended fees (sat/vB), market sentiment (Fear & Greed index), and major asset prices (BTC, ETH, SOL).',
    parameters: {
      type: 'object',
      properties: {
        asset: {
          type: 'string',
          description: 'Optional focus: "all", "btc_fees", "fear_and_greed", "crypto_prices", or a specific coin (e.g. "bitcoin", "solana"). Defaults to "all".'
        },
        coins: {
          type: 'string',
          description: 'Comma-separated coin IDs to display (default: "bitcoin,ethereum,solana")'
        }
      }
    }
  }
};

async function execute(args = {}) {
  const rawAsset = (args.asset || '').trim().toLowerCase();
  let coins = (args.coins || 'bitcoin,ethereum,solana').trim().toLowerCase();

  // Resolve custom single coin if provided in asset parameter
  if (rawAsset && rawAsset !== 'all' && rawAsset !== 'btc_fees' && rawAsset !== 'fear_and_greed' && rawAsset !== 'crypto_prices') {
    const resolved = COINGECKO_MAP[rawAsset] || rawAsset;
    if (!coins.includes(resolved)) {
      coins = `${resolved},${coins}`;
    }
  }

  const [prices, mempool, fearAndGreed] = await Promise.all([
    fetchCryptoPrices(coins),
    fetchMempoolStats(),
    fetchFearAndGreed()
  ]);

  return {
    type: 'crypto_terminal',
    data: {
      prices,
      mempool,
      fearAndGreed,
      requestedCoins: coins.split(',').map(c => c.trim()),
      updatedAt: new Date().toISOString()
    }
  };
}

module.exports = {
  name: 'get_crypto_terminal',
  domain: 'finance',
  schema,
  execute,
  fetchCryptoPrices,
  fetchMempoolStats,
  fetchFearAndGreed,
  slashCommand: 'crypto'
};
