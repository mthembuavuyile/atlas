const { test, describe } = require('node:test');
const assert = require('node:assert');
const widgetService = require('../src/services/widget.service');
const chatController = require('../src/controllers/chat.controller');

describe('Widget Service Deterministic Capabilities', () => {
  test('convertUnits correctly converts length (km to miles)', async () => {
    const result = await widgetService.convertUnits(10, 'km', 'miles');
    assert.strictEqual(result.type, 'unit');
    assert.ok(result.data);
    assert.strictEqual(result.data.value, 10);
    assert.strictEqual(result.data.from, 'km');
    assert.strictEqual(result.data.to, 'miles');
    // 10 km is ~6.21371 miles
    assert.ok(Math.abs(result.data.result - 6.2137) < 0.01);
  });

  test('convertUnits correctly converts digital storage (gb to mb)', async () => {
    const result = await widgetService.convertUnits(2, 'gb', 'mb');
    assert.strictEqual(result.type, 'unit');
    assert.strictEqual(result.data.result, 2048);
  });

  test('convertUnits validates invalid values gracefully', async () => {
    const result = await widgetService.convertUnits('not-a-number', 'km', 'miles');
    assert.ok(result.error);
  });

  test('getCurrentTime returns formatted time and timezone information', async () => {
    const result = await widgetService.getCurrentTime('UTC');
    assert.strictEqual(result.type, 'time');
    assert.ok(result.data.time24);
    assert.ok(result.data.time12);
    assert.ok(result.data.date);
    assert.strictEqual(result.data.timezone, 'UTC');
  });

  test('generateQr produces valid data payload for input text', async () => {
    const result = await widgetService.generateQr('https://vylex.co.za');
    assert.strictEqual(result.type, 'generate_qr');
    assert.strictEqual(result.data.text, 'https://vylex.co.za');
  });

  test('TOOL_DISPATCHER has all required tools mapped properly', () => {
    const dispatcher = chatController.TOOL_DISPATCHER;
    assert.ok(dispatcher, 'TOOL_DISPATCHER must be exported');
    
    const requiredTools = [
      'get_current_time',
      'convert_units',
      'search_places',
      'fetch_webpage',
      'get_weather',
      'get_crypto_price',
      'get_bible_verse',
      'search_images',
      'generate_image',
      'get_news_headlines',
      'get_space_news',
      'get_reddit_posts',
      'define_word',
      'convert_currency',
      'solve_math',
      'tell_joke',
      'give_advice',
      'scan_ocr',
      'scan_qr',
      'generate_qr'
    ];

    for (const tool of requiredTools) {
      assert.strictEqual(typeof dispatcher[tool], 'function', `Tool "${tool}" must be a function in TOOL_DISPATCHER`);
    }
  });
});
