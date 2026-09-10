/**
 * Legacy Tool Bridge
 * ─────────────────────────────────────────────────────────────
 * Delegates established tools to widgetService so existing functionality,
 * unit tests, and routes work seamlessly without regressions.
 */

const widgetService = require('../services/widget.service');

const LEGACY_TOOLS = {
  get_current_time: (args = {}) => widgetService.getCurrentTime(args.timezone),
  convert_units: (args = {}) => widgetService.convertUnits(args.value, args.from, args.to),
  search_places: (args = {}) => widgetService.searchPlaces(args.query, args.near),
  fetch_webpage: (args = {}) => widgetService.fetchWebpage(args.url),
  get_weather: (args = {}) => widgetService.getWeather(args.city),
  get_crypto_price: (args = {}) => widgetService.getCryptoPrice(args.coin),
  get_bible_verse: (args = {}) => widgetService.getBibleVerse(args.reference),
  search_images: (args = {}) => widgetService.searchImages(args.query, args.limit || args.count),
  generate_image: (args = {}) => widgetService.generateImage(args.prompt, args.aspect_ratio),
  get_news_headlines: (args = {}) => widgetService.getNewsHeadlines(args.topic),
  get_space_news: (args = {}) => widgetService.getSpaceNews(args.topic),
  get_reddit_posts: (args = {}) => widgetService.getRedditPosts(args.subreddit, args.limit),
  search_reddit: (args = {}) => widgetService.searchReddit(args.query, args.limit, args.sort, args.time, args.subreddit),
  define_word: (args = {}) => widgetService.defineWord(args.word),
  convert_currency: (args = {}) => widgetService.convertCurrency(args.amount, args.from, args.to),
  solve_math: (args = {}) => widgetService.solveMath(args.expression, args.operation),
  tell_joke: () => widgetService.tellJoke(),
  give_advice: () => widgetService.giveAdvice(),
  scan_ocr: () => widgetService.scanOcr(),
  scan_qr: () => widgetService.scanQr(),
  generate_qr: (args = {}) => widgetService.generateQr(args.data)
};

module.exports = { LEGACY_TOOLS };
