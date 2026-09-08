const { test, describe } = require('node:test');
const assert = require('node:assert');
const { capabilityRegistry } = require('../src/capabilities');
const stockCapability = require('../src/capabilities/finance/stock.capability');
const movieCapability = require('../src/capabilities/media/movie.capability');
const cryptoCapability = require('../src/capabilities/finance/crypto.capability');
const { ATLAS_TOOLS } = require('../src/config/tools.config');

describe('Modular Capability Architecture & Tool Integrations', () => {
  test('capabilityRegistry exposes tool schemas to ATLAS_TOOLS', () => {
    const schemas = capabilityRegistry.getCapabilitySchemas();
    assert.ok(Array.isArray(schemas));
    assert.ok(schemas.length >= 3);

    const schemaNames = schemas.map(s => s.function?.name);
    assert.ok(schemaNames.includes('get_movie_info'), 'Must include get_movie_info schema');
    assert.ok(schemaNames.includes('get_stock_chart'), 'Must include get_stock_chart schema');
    assert.ok(schemaNames.includes('get_crypto_terminal'), 'Must include get_crypto_terminal schema');

    const atlasToolNames = ATLAS_TOOLS.map(t => t.function?.name);
    assert.ok(atlasToolNames.includes('get_movie_info'), 'ATLAS_TOOLS must contain get_movie_info');
    assert.ok(atlasToolNames.includes('get_stock_chart'), 'ATLAS_TOOLS must contain get_stock_chart');
    assert.ok(atlasToolNames.includes('get_crypto_terminal'), 'ATLAS_TOOLS must contain get_crypto_terminal');
  });

  test('stockCapability accurately resolves ticker symbols', () => {
    assert.strictEqual(stockCapability.resolveTicker('google'), 'NASDAQ:GOOGL');
    assert.strictEqual(stockCapability.resolveTicker('apple'), 'NASDAQ:AAPL');
    assert.strictEqual(stockCapability.resolveTicker('nvidia'), 'NASDAQ:NVDA');
    assert.strictEqual(stockCapability.resolveTicker('nvda'), 'NASDAQ:NVDA');
    assert.strictEqual(stockCapability.resolveTicker('tesla'), 'NASDAQ:TSLA');
    assert.strictEqual(stockCapability.resolveTicker('bitcoin'), 'COINBASE:BTCUSD');
    assert.strictEqual(stockCapability.resolveTicker('btc'), 'COINBASE:BTCUSD');
    assert.strictEqual(stockCapability.resolveTicker('binance:solusdt'), 'BINANCE:SOLUSDT');
  });

  test('stockCapability returns valid stock_chart widget payload', async () => {
    const result = await capabilityRegistry.execute('get_stock_chart', { query: 'Nvidia' });
    assert.strictEqual(result.type, 'stock_chart');
    assert.ok(result.data);
    assert.strictEqual(result.data.symbol, 'NASDAQ:NVDA');
    assert.strictEqual(result.data.exchange, 'NASDAQ');
    assert.strictEqual(result.data.ticker, 'NVDA');
  });

  test('movieCapability fetches and formats movie metadata via OMDb', async () => {
    const result = await capabilityRegistry.execute('get_movie_info', { title: 'Interstellar' });
    assert.strictEqual(result.type, 'movie');
    assert.ok(result.data);
    assert.strictEqual(result.data.title, 'Interstellar');
    assert.strictEqual(result.data.year, '2014');
    assert.ok(result.data.director);
    assert.ok(result.data.actors);
    assert.ok(result.data.plot);
    assert.ok(result.data.imdbRating);
    assert.ok(result.data.poster);
  });

  test('cryptoCapability retrieves terminal metrics including mempool or prices', async () => {
    const result = await capabilityRegistry.execute('get_crypto_terminal', { coins: 'bitcoin,ethereum' });
    assert.strictEqual(result.type, 'crypto_terminal');
    assert.ok(result.data);
    assert.ok('prices' in result.data);
    assert.ok('mempool' in result.data);
    assert.ok('fearAndGreed' in result.data);
  });

  test('unknown tool handles gracefully with error object', async () => {
    const result = await capabilityRegistry.execute('non_existent_tool_xyz', {});
    assert.ok(result.error);
    assert.ok(result.error.includes('Unknown tool'));
  });
});
