const { test, describe } = require('node:test');
const assert = require('node:assert');
const widgetService = require('../src/services/widget.service');
const chatController = require('../src/controllers/chat.controller');
const { ATLAS_TOOLS } = require('../src/config/tools.config');

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
      'search_reddit',
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

  test('search_reddit is exposed as a natural-language query tool', () => {
    const redditTool = ATLAS_TOOLS.find(tool => tool.function.name === 'search_reddit');
    assert.ok(redditTool, 'search_reddit must be included in the model tool schema');
    assert.ok(redditTool.function.parameters.required.includes('query'));
    assert.strictEqual(typeof chatController.TOOL_DISPATCHER.search_reddit, 'function');
  });

  test('searchReddit validates empty queries without a network request', async () => {
    const result = await widgetService.searchReddit('');
    assert.strictEqual(result.error, 'A Reddit search query is required.');
  });

  test('searchImages respects custom limit parameter (limit=1 and limit=4)', async () => {
    const resSingle = await widgetService.searchImages('quantum', 1);
    assert.strictEqual(resSingle.type, 'image');
    assert.ok(Array.isArray(resSingle.data.images));
    assert.strictEqual(resSingle.data.images.length, 1, 'Should return exactly 1 image when limit=1');

    const resFour = await widgetService.searchImages('computer', 4);
    assert.strictEqual(resFour.type, 'image');
    assert.ok(Array.isArray(resFour.data.images));
    assert.strictEqual(resFour.data.images.length, 4, 'Should return exactly 4 images when limit=4');
  });

  test('getRedditPosts returns valid structure with video property compatibility', async () => {
    const res = await widgetService.getRedditPosts('technology');
    if (res.error || res.data?.error) {
      assert.ok(typeof (res.error || res.data?.error) === 'string');
    } else {
      assert.strictEqual(res.type, 'reddit');
      assert.ok(Array.isArray(res.data.posts));
      if (res.data.posts.length > 0) {
        const firstPost = res.data.posts[0];
        assert.ok('title' in firstPost);
        assert.ok('url' in firstPost);
        assert.ok('video' in firstPost);
      }
    }
  });

  test('getRedditPosts handles multi-subreddit queries with balanced distribution', async () => {
    const res = await widgetService.getRedditPosts('java, bitcoin, news, python', 8);
    if (res.error || res.data?.error) {
      assert.ok(typeof (res.error || res.data?.error) === 'string');
    } else {
      assert.strictEqual(res.type, 'reddit');
      assert.ok(Array.isArray(res.data.posts));
      assert.ok(res.data.posts.length > 0);
      assert.ok(res.data.subreddit.includes('+') || res.data.subreddit.includes('r/'));
      assert.ok(Array.isArray(res.data.subreddits));
      assert.ok(res.data.subreddits.length >= 2, 'Should detect multiple subreddits');
      const postSubreddits = new Set(res.data.posts.map(p => (p.subreddit || '').toLowerCase()));
      assert.ok(postSubreddits.size >= 2, 'Posts should be distributed across multiple subreddits');
    }
  });

  test('getRedditPosts parses plus-separated subreddits seamlessly', async () => {
    const res = await widgetService.getRedditPosts('bitcoin+news', 4);
    if (res.error || res.data?.error) {
      assert.ok(typeof (res.error || res.data?.error) === 'string');
    } else {
      assert.strictEqual(res.type, 'reddit');
      assert.ok(Array.isArray(res.data.posts));
      assert.ok(Array.isArray(res.data.subreddits));
      assert.strictEqual(res.data.subreddits.length, 2);
    }
  });
});

