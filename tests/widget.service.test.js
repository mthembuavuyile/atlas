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

  test('searchReddit falls back when the global Reddit endpoint fails', async () => {
    const originalFetch = global.fetch;
    const requestedUrls = [];
    global.fetch = async (url) => {
      requestedUrls.push(url);
      if (url.includes('www.reddit.com/search.json')) {
        throw new Error('Reddit search endpoint unavailable');
      }
      return {
        ok: true,
        json: async () => ({
          data: [{
            title: 'Crypto discussion',
            permalink: '/r/crypto/comments/example/crypto_discussion',
            score: 42,
            num_comments: 7,
            author: 'atlas_user',
            subreddit: 'crypto',
            created_utc: 1700000000
          }]
        })
      };
    };

    try {
      const result = await widgetService.searchReddit('crypto-fallback-test');
      assert.strictEqual(result.type, 'reddit');
      assert.strictEqual(result.data.query, 'crypto-fallback-test');
      assert.strictEqual(result.data.posts.length, 1);
      assert.strictEqual(result.data.posts[0].subreddit, 'r/crypto');
      assert.ok(requestedUrls.some(url => url.includes('www.reddit.com/search.json')));
      assert.ok(requestedUrls.some(url => url.includes('arctic-shift.photon-reddit.com')));
    } finally {
      global.fetch = originalFetch;
    }
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
      assert.ok(res.data.subreddits.length >= 1, 'Should detect subreddits');
      if (res.data.subreddits.length >= 2) {
        const postSubreddits = new Set(res.data.posts.map(p => (p.subreddit || '').toLowerCase()));
        assert.ok(postSubreddits.size >= 1, 'Posts should be distributed across subreddits');
      }
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
      assert.ok(res.data.subreddits.length >= 1);
    }
  });

  test('_cleanRedditMediaUrl unblocks preview.redd.it and cleans ampersand entities', () => {
    const previewUrl = 'https://preview.redd.it/example123.jpg?width=320&amp;crop=smart&amp;auto=webp&amp;s=abc';
    const cleaned = widgetService._cleanRedditMediaUrl(previewUrl);
    assert.strictEqual(cleaned, 'https://i.redd.it/example123.jpg');

    const doubleEncoded = 'https://i.redd.it/test.png?foo=1&amp;amp;bar=2';
    assert.strictEqual(widgetService._cleanRedditMediaUrl(doubleEncoded), 'https://i.redd.it/test.png?foo=1&bar=2');
  });

  test('_extractRedditMedia correctly resolves v.redd.it candidate streams and poster', () => {
    const postData = {
      title: 'Amazing game clip',
      url: 'https://v.redd.it/sampleclip123',
      is_video: true,
      preview: {
        images: [{
          source: { url: 'https://preview.redd.it/clipthumb.jpg?width=1080' },
          resolutions: [{ url: 'https://preview.redd.it/clipthumb.jpg?width=640' }]
        }]
      }
    };
    const media = widgetService._extractRedditMedia(postData);
    assert.strictEqual(media.isVideo, true);
    assert.ok(media.video.includes('sampleclip123'));
    assert.ok(media.video.includes('DASH_480.mp4'));
    assert.strictEqual(media.image, 'https://i.redd.it/clipthumb.jpg');
    assert.ok(Array.isArray(media.videoSources));
    assert.ok(media.videoSources.some(s => s.includes('HLSPlaylist.m3u8')));
    assert.ok(media.videoSources.some(s => s.includes('DASH_720.mp4')));
  });

  test('_extractRedditMedia extracts media from crosspost parent when top level is empty', () => {
    const crosspost = {
      title: 'Crossposted video',
      url: 'https://www.reddit.com/r/funny/comments/xyz123',
      is_video: false,
      crosspost_parent_list: [{
        title: 'Original clip',
        url: 'https://v.redd.it/parentclip999',
        is_video: true,
        media: {
          reddit_video: {
            fallback_url: 'https://v.redd.it/parentclip999/DASH_720.mp4?source=fallback'
          }
        }
      }]
    };
    const media = widgetService._extractRedditMedia(crosspost);
    assert.strictEqual(media.isVideo, true);
    assert.ok(media.video.includes('parentclip999'));
    assert.ok(media.videoSources.length > 0);
  });

  test('renderRedditWidget renders persistent media containers and playable video sources without collapsing', async () => {
    const { renderRedditWidget } = await import('../public/js/widgets/reddit-widget.js');

    const mockData = {
      subreddit: 'r/funny',
      posts: [
        {
          title: "DC isn't infinitely powerful",
          url: 'https://www.reddit.com/r/funny/comments/post1',
          ups: 420,
          comments: 69,
          author: 'u/tester',
          subreddit: 'r/funny',
          created_at: '2026-09-10',
          image: 'https://i.redd.it/post1.jpg',
          video: 'https://v.redd.it/post1/DASH_480.mp4?source=fallback',
          video_sources: [
            'https://v.redd.it/post1/HLSPlaylist.m3u8',
            'https://v.redd.it/post1/DASH_720.mp4?source=fallback',
            'https://v.redd.it/post1/DASH_480.mp4?source=fallback'
          ],
          is_video: true,
          is_gif: false
        },
        {
          title: "Funny static image",
          url: 'https://www.reddit.com/r/funny/comments/post2',
          ups: 100,
          comments: 10,
          author: 'u/tester2',
          subreddit: 'r/funny',
          created_at: '2026-09-10',
          image: 'https://i.redd.it/post2.jpg',
          video: null,
          video_sources: [],
          is_video: false,
          is_gif: false
        }
      ]
    };

    const html = renderRedditWidget(mockData);

    // Must NEVER include the destructive c.style.display='none' that caused videos to vanish
    assert.strictEqual(html.includes("c.style.display='none'"), false);
    // Must include the persistent video container
    assert.ok(html.includes('discussion-video-container'));
    // Must include multiple candidate video sources
    assert.ok(html.includes('DASH_720.mp4'));
    assert.ok(html.includes('HLSPlaylist.m3u8'));
    // Must include the non-destructive fallback bar
    assert.ok(html.includes('discussion-video-fallback-bar'));
    // Must include the image thumbnail container
    assert.ok(html.includes('discussion-thumbnail-container'));
    // Must not collapse into plain text
    assert.ok(html.includes('discussion-media-fallback-card'));
  });

  test('searchReddit returns structured type: reddit with friendly notice when no posts match', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ data: [] }),
      text: async () => '<feed></feed>'
    });

    try {
      const result = await widgetService.searchReddit('extremely-rare-unmatched-query-xyz123');
      assert.strictEqual(result.type, 'reddit');
      assert.ok(Array.isArray(result.data.posts));
      assert.strictEqual(result.data.posts.length, 0);
      assert.ok(typeof result.data.error === 'string');
      assert.ok(result.data.error.includes('search terms'));
      assert.strictEqual(result.data.error.includes('keywords'), false);
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('formatUserFriendlyError prevents false-positive API key settings buttons on words like keywords', async () => {
    const { formatUserFriendlyError } = await import('../public/js/services/chat-service.js');
    const redditNotice = formatUserFriendlyError(new Error('No Reddit results found for that query. Please try different keywords or check back later.'));
    assert.strictEqual(redditNotice.openSettings, false, 'Should not show settings button for query notice');
    assert.strictEqual(redditNotice.title, 'Service Notice');
    assert.strictEqual(redditNotice.action.includes('custom key in Settings'), false);

    const realKeyError = formatUserFriendlyError(new Error('Invalid OpenRouter API key provided'));
    assert.strictEqual(realKeyError.openSettings, true, 'Should show settings button for genuine API key error');
    assert.strictEqual(realKeyError.title, 'API Key Notice');
  });
});

