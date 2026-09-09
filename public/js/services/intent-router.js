/**
 * intent-router.js
 * Offline deterministic widget intents and slash command routing.
 * Triggers local widgets for math, QR codes, currency, weather, OCR, time, crypto, etc.
 */

import { state } from '../state/store.js';
import { API_BASE } from '../config/constants.js';
import { parseMarkdownSafely } from '../markdown/parser.js';
import { saveSessions, updateSessionMetrics } from '../ui/session-manager.js';
import { scrollToBottom } from '../ui/message-renderer.js';
import { renderWidget, mountWidget } from '../widgets/widget-renderer.js';

export function detectLocalWidgetIntent(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // NEVER hijack prompts in Build mode or when user is asking to build/write/code something
  if (state.activeMode === 'build' || /\b(build|write|create|code|html|css|js|javascript|python|component|website|app|portfolio|page)\b/i.test(lower)) {
    return null;
  }

  // If the prompt is a long, multi-sentence prompt, do not hijack with single-intent widgets
  if (trimmed.length > 100 && !/^(what'?s the weather|convert\s+\d+|what is the time)/i.test(trimmed)) {
    return null;
  }

  const stripTrailing = (value) => value.replace(/[?.!]+$/g, '').trim();
  const pickMatch = (patterns) => {
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match?.[1]) return stripTrailing(match[1]);
    }
    return '';
  };

  // Strict OCR trigger
  if (/^(?:open\s+)?(?:scan\s+)?ocr\b/i.test(trimmed) || /^(?:scan|extract|read)\s+text\s+from\s+(?:an?\s+)?(?:image|photo|camera|screenshot|picture)$/i.test(trimmed)) {
    return { tool: 'scan_ocr', args: {}, label: 'Opened OCR scanner.' };
  }

  // QR Code Scan trigger
  if (/^(?:open\s+)?(?:scan|read|decode)\s+(?:a\s+)?qr(?:\s*code)?$/i.test(trimmed) || /^(?:qr\s*(?:scan|scanner|reader)|scan\s*qr)$/i.test(trimmed)) {
    return { tool: 'scan_qr', args: {}, label: 'Opened QR Code Scanner.' };
  }

  // QR Code Generation trigger
  const qrGenMatch = trimmed.match(/^(?:generate|make|create|build|encode)\s+(?:a\s+)?(?:qr|qr\s*code)\s+(?:for|of|with|saying|containing)?\s*(.+)$/i)
    || trimmed.match(/^(?:qr|qr\s*code)\s+(?:for|of|with)?\s*(.+)$/i);
  if (qrGenMatch && qrGenMatch[1] && !/\b(scanner|reader|camera)\b/i.test(qrGenMatch[1])) {
    const qrData = stripTrailing(qrGenMatch[1].replace(/^(?:the\s+)?(?:note|text|link|url|phrase|string|message)\s+/i, '').trim());
    if (qrData) {
      return { tool: 'generate_qr', args: { data: qrData }, label: `Generated QR code for "${qrData}".` };
    }
  }

  const currency = trimmed.match(/^\s*(?:convert\s+)?(\d+(?:\.\d+)?)\s*([a-z]{3})\s+(?:to|in|into)\s+([a-z]{3})\s*\??$/i);
  if (currency) {
    return {
      tool: 'convert_currency',
      args: { amount: parseFloat(currency[1]), from: currency[2].toUpperCase(), to: currency[3].toUpperCase() },
      label: 'Converted live currency rate.'
    };
  }

  const unit = trimmed.match(/^\s*(?:convert\s+)?(-?\d+(?:\.\d+)?)\s*([a-zA-Z°/ ]{1,22})\s+(?:to|in|into)\s+([a-zA-Z°/ ]{1,22})\s*\??$/i);
  if (unit && !/^[a-z]{3}$/i.test(unit[2].trim()) && !/^[a-z]{3}$/i.test(unit[3].trim())) {
    return {
      tool: 'convert_units',
      args: { value: parseFloat(unit[1]), from: unit[2].trim(), to: unit[3].trim() },
      label: 'Converted units.'
    };
  }

  const bible = pickMatch([
    /^(?:give me\s+)?(?:a\s+)?(?:bible verse|scripture|verse)\s+(?:for|about|from)?\s*(.+)$/i,
    /^([1-3]?\s*[a-z]+(?:\s+[a-z]+)?\s+\d+:\d+(?:-\d+)?)$/i
  ]);
  if (bible || /^(a bible verse|random scripture|give me a scripture)$/i.test(trimmed)) {
    return { tool: 'get_bible_verse', args: { reference: bible || '' }, label: 'Fetched scripture.' };
  }

  const definition = pickMatch([/^(?:define|meaning of|what does)\s+["']?([a-z][a-z-]*)["']?(?:\s+mean)?\??$/i]);
  if (definition) {
    return { tool: 'define_word', args: { word: definition }, label: 'Fetched dictionary definition.' };
  }

  const weather = pickMatch([/^(?:what'?s the\s+)?weather\s+(?:in|for|at)\s+(.+)\??$/i, /^(?:forecast|temperature)\s+(?:in|for|at)\s+(.+)\??$/i]);
  if (weather) {
    return { tool: 'get_weather', args: { city: weather }, label: 'Fetched live weather.' };
  }

  const crypto = pickMatch([/^(?:what'?s the\s+)?(?:price of|price for|crypto price of)\s+([a-z0-9 ,&+.-]+)\??$/i, /^([a-z0-9 ,&+.-]+)\s+(?:price|crypto price|price right now)\??$/i]);
  if (crypto && /\b(bitcoin|btc|ethereum|eth|solana|sol|xrp|doge|cardano|ada|crypto)\b/i.test(crypto)) {
    return { tool: 'get_crypto_price', args: { coin: crypto.replace(/\bcrypto\b/gi, '').trim() || 'bitcoin' }, label: 'Fetched live crypto price.' };
  }

  const subreddit = pickMatch([/^(?:show me\s+)?(?:reddit|subreddit)\s+(?:posts|news|threads|discussions)?\s*(?:from|for|in)?\s*\/?r\/?([a-z0-9_]+)$/i, /^r\/([a-z0-9_]+)$/i]);
  if (subreddit) {
    return { tool: 'get_reddit_posts', args: { subreddit: subreddit || 'news' }, label: 'Fetched live discussions.' };
  }

  const imageMatch = trimmed.match(/^(?:show me|find|search|get|give me)\s+(?:an?\s+|one\s+|(\d+)\s+)?(?:images?|photos?|pictures?)\s+(?:of|for)\s+(.+)$/i)
    || trimmed.match(/^(\d+)\s+photos?\s+(?:of|for)\s+(.+)$/i)
    || trimmed.match(/^photos?\s+(?:of|for)\s+(.+)$/i);
  if (imageMatch) {
    let limit = 8;
    let query = '';

    if (imageMatch[1] && /^\d+$/.test(imageMatch[1])) {
      limit = Math.min(Math.max(parseInt(imageMatch[1], 10), 1), 12);
      query = imageMatch[2] || '';
    } else if (/\b(an?|one)\s+(?:images?|photos?|pictures?)\b/i.test(imageMatch[0])) {
      limit = 1;
      query = imageMatch[2] || imageMatch[1] || '';
    } else {
      query = imageMatch[2] || imageMatch[1] || '';
    }

    if (!query) {
      query = imageMatch[0].replace(/^(?:show me|find|search|get|give me)\s+(?:an?\s+|one\s+|\d+\s+)?(?:images?|photos?|pictures?)\s+(?:of|for)\s+/i, '');
    }
    query = stripTrailing(query);

    if (query && !/\b(website|portfolio|button|page|component)\b/i.test(query)) {
      return { tool: 'search_images', args: { query, limit }, label: 'Fetched visual references.' };
    }
  }

  const math = pickMatch([/^(?:derivative|integral|simplify|factor|solve|limit)\s+(?:of\s+)?(.+)$/i]);
  if (math && /[0-9x-z=+\-*/^()]/i.test(math) && trimmed.length < 50) {
    const opMatch = lower.match(/\b(derivative|integral|simplify|factor|solve|limit)\b/);
    const operation = opMatch ? opMatch[1] : 'simplify';
    return { tool: 'solve_math', args: { expression: math, operation }, label: 'Solved math expression.' };
  }

  const spaceTopic = pickMatch([/^(?:space|spacex|nasa|mars|artemis|jwst)\s+(?:news|updates|headlines)\s*(.*)$/i]);
  if (spaceTopic || /^(space news|spacex updates|nasa news|mars rover|artemis mission|jwst discoveries)$/i.test(lower)) {
    return { tool: 'get_space_news', args: { topic: spaceTopic }, label: 'Fetched space intelligence.' };
  }

  const newsTopic = pickMatch([/^(?:show me\s+)?(?:latest|current|today'?s)?\s*(?:news|headlines|top stories)\s*(?:about|on|for|in)?\s*(.*)$/i]);
  if (/^(news|headlines|top stories)$/i.test(lower)) {
    return { tool: 'get_news_headlines', args: { topic: newsTopic || 'top stories' }, label: 'Fetched live headlines.' };
  }

  const time = pickMatch([/^(?:what'?s the\s+)?(?:time|date)\s+(?:in|for|at)\s+(.+)\??$/i]);
  if (time || /^(what'?s\s+)?(?:the\s+)?(?:current\s+)?time\??$/i.test(trimmed)) {
    return { tool: 'get_current_time', args: { timezone: time }, label: 'Resolved live time.' };
  }

  const place = pickMatch([/^(?:find|search for|show me)\s+(.+?)\s+(?:near|in)\s+(.+)$/i]);
  if (place && /\b(restaurant|coffee|cafe|hotel|clinic|hospital|library|school|museum|landmark|shop|store|atm|bank|park)\b/i.test(place)) {
    const match = trimmed.match(/^(?:find|search for|show me)\s+(.+?)\s+(?:near|in)\s+(.+)$/i);
    return { tool: 'search_places', args: { query: stripTrailing(match[1]), near: stripTrailing(match[2]) }, label: 'Searched places.' };
  }

  if (/^(tell me a joke|another joke|daily humor)$/i.test(lower)) {
    return { tool: 'tell_joke', args: {}, label: 'Fetched a joke.' };
  }

  if (/^(give me some advice|words of wisdom|life advice)$/i.test(lower)) {
    return { tool: 'give_advice', args: {}, label: 'Fetched advice.' };
  }

  // Movie Suggestions & Release Slate Intent (e.g. "2026 movies", "upcoming 2026 movies", "movies in 2026")
  const upcomingMatch = trimmed.match(/^(?:what are\s+)?(?:some\s+)?(?:good\s+|upcoming\s+|top\s+)?(?:(\d{4})\s+movies|movies\s+(?:in|for|from|released in)\s+(\d{4}))\??$/i)
    || trimmed.match(/^(\d{4})\s+movies\??$/i);
  if (upcomingMatch) {
    const yr = upcomingMatch[1] || upcomingMatch[2] || '2026';
    return { tool: 'discover_movies', args: { year: yr, query: `${yr} movies` }, label: `Retrieved ${yr} theatrical release slate & upcoming movies.` };
  }

  const suggestionMatch = trimmed.match(/^(?:suggest|recommend|find|show me)\s+(?:some\s+)?(?:movies|films)(?:\s+(?:about|like|for|in)?\s*(.+))?$/i);
  if (suggestionMatch) {
    const q = (suggestionMatch[1] || '').trim();
    return { tool: 'discover_movies', args: { query: q || 'upcoming blockbusters' }, label: `Discovered movie recommendations${q ? ` for "${q}"` : ''}.` };
  }

  // Movie Explorer Intent (Single Film)
  const movie = pickMatch([
    /^(?:tell me about|info on|details for|synopsis of|who directed)\s+(?:the\s+movie\s+|the\s+film\s+)?["']?(.+?)["']?\??$/i,
    /^(?:the\s+)?movie\s+["']?(.+?)["']?\??$/i
  ]);
  if (movie && !/\b(joke|scripture|verse|weather|news|code|function|places?|stock)\b/i.test(movie)) {
    return { tool: 'get_movie_info', args: { title: movie }, label: `Fetched movie intelligence for "${movie}".` };
  }

  // Stock / Market Chart Intent
  const stock = pickMatch([
    /^(?:show me\s+)?(?:stock\s+chart|price\s+chart|market\s+chart|chart)\s+(?:for|of)?\s*(.+)\??$/i,
    /^(?:show me\s+)?([a-z0-9.:]+)\s+(?:stock\s+chart|chart|stock)\??$/i
  ]);
  if (stock && /\b(google|apple|nvidia|nvda|tesla|tsla|microsoft|msft|amazon|amzn|meta|nasdaq|nyse|aapl|googl)\b/i.test(stock)) {
    return { tool: 'get_stock_chart', args: { query: stock }, label: `Loaded interactive market chart for ${stock.toUpperCase()}.` };
  }

  // Bitcoin Mempool & Network Fees Intent
  if (/^(?:what are\s+)?(?:bitcoin|btc)\s+(?:mempool|network)?\s*(?:fees|fee rates)\??$/i.test(trimmed) || /^(?:mempool|btc fees|bitcoin fees)$/i.test(trimmed)) {
    return { tool: 'get_crypto_terminal', args: { asset: 'btc_fees' }, label: 'Fetched Bitcoin network fees and mempool stats.' };
  }

  // Crypto Sentiment / Fear & Greed Intent
  if (/^(?:what is\s+)?(?:the\s+)?(?:crypto\s+)?(?:fear and greed|market sentiment)\??$/i.test(trimmed) || /^(?:fear and greed|crypto sentiment)$/i.test(trimmed)) {
    return { tool: 'get_crypto_terminal', args: { asset: 'fear_and_greed' }, label: 'Fetched Fear & Greed sentiment index.' };
  }

  return null;
}

export function resolveSlashCommand(prompt) {
  if (!prompt || typeof prompt !== 'string') return null;
  const slashMatch = prompt.match(/^\/([a-z]+)(?:\s+(.*))?/i);
  if (!slashMatch) return null;

  const command = slashMatch[1].toLowerCase();
  const arg = slashMatch[2] || '';

  let toolToCall = null;
  let argsPayload = {};
  let isWebSearch = false;
  let overrideText = null;

  if (command === 'movies' || command === 'upcoming') {
    toolToCall = 'discover_movies';
    argsPayload = { query: arg || '2026 movies', year: arg && /^\d{4}$/.test(arg.trim()) ? arg.trim() : '2026' };
  } else if (command === 'movie' || command === 'film') {
    if (/^\d{4}$/.test((arg || '').trim())) {
      toolToCall = 'discover_movies';
      argsPayload = { year: arg.trim(), query: `${arg.trim()} movies` };
    } else {
      toolToCall = 'get_movie_info';
      argsPayload = { title: arg || 'Interstellar' };
    }
  } else if (command === 'stock' || command === 'chart' || command === 'ticker') {
    toolToCall = 'get_stock_chart';
    argsPayload = { query: arg || 'Google' };
  } else if (command === 'mempool') {
    toolToCall = 'get_crypto_terminal';
    argsPayload = { asset: 'btc_fees' };
  } else if (command === 'fear' || command === 'sentiment') {
    toolToCall = 'get_crypto_terminal';
    argsPayload = { asset: 'fear_and_greed' };
  } else if (command === 'web') {
    isWebSearch = true;
    overrideText = arg;
  } else if (command === 'define' || command === 'dict') {
    toolToCall = 'define_word';
    argsPayload = { word: arg || 'intelligence' };
  } else if (command === 'reddit') {
    toolToCall = 'get_reddit_posts';
    argsPayload = { subreddit: arg || 'news' };
  } else if (command === 'weather') {
    toolToCall = 'get_weather';
    argsPayload = { city: arg || 'London' };
  } else if (command === 'space' || command === 'spacenews') {
    toolToCall = 'get_space_news';
    argsPayload = { topic: arg || '' };
  } else if (command === 'news' || command === 'headlines') {
    toolToCall = 'get_news_headlines';
    argsPayload = { topic: arg || 'top stories' };
  } else if (command === 'bible' || command === 'verse') {
    toolToCall = 'get_bible_verse';
    argsPayload = { reference: arg || 'John 3:16' };
  } else if (command === 'joke') {
    toolToCall = 'tell_joke';
    argsPayload = {};
  } else if (command === 'advice') {
    toolToCall = 'give_advice';
    argsPayload = {};
  } else if (command === 'currency' || command === 'convert') {
    const parts = arg.split(' ').map(p => p.trim()).filter(Boolean);
    toolToCall = 'convert_currency';
    const convertMatch = arg.match(/(\d+(?:\.\d+)?)\s*([a-z]{3})\s+(?:to|in|into)?\s*([a-z]{3})/i);
    argsPayload = convertMatch
      ? { amount: parseFloat(convertMatch[1]), from: convertMatch[2].toUpperCase(), to: convertMatch[3].toUpperCase() }
      : { amount: parseFloat(parts[0]) || 1, from: parts[1] || 'USD', to: (parts[2] || parts[3]) || 'EUR' };
  } else if (command === 'math') {
    toolToCall = 'solve_math';
    argsPayload = { expression: arg || '2+2', operation: 'simplify' };
  } else if (command === 'image') {
    toolToCall = 'search_images';
    const numMatch = (arg || '').match(/^(\d+)\s+(.+)$/);
    if (numMatch) {
      argsPayload = {
        limit: Math.min(Math.max(parseInt(numMatch[1], 10) || 8, 1), 12),
        query: numMatch[2].trim()
      };
    } else {
      argsPayload = { query: arg || 'beautiful landscape', limit: 8 };
    }
  } else if (command === 'qr' || command === 'generateqr') {
    toolToCall = 'generate_qr';
    argsPayload = { data: arg || 'Atlas Intelligence' };
  } else if (command === 'scanqr' || command === 'qrscan') {
    toolToCall = 'scan_qr';
    argsPayload = {};
  } else if (command === 'ocr') {
    toolToCall = 'scan_ocr';
    argsPayload = {};
  } else if (command === 'time') {
    toolToCall = 'get_current_time';
    argsPayload = { timezone: arg || '' };
  } else if (command === 'unit') {
    const unitMatch = arg.match(/(-?\d+(?:\.\d+)?)\s*([a-zA-Z°/ ]{1,22})\s+(?:to|in|into)\s+([a-zA-Z°/ ]{1,22})/i);
    toolToCall = 'convert_units';
    argsPayload = unitMatch
      ? { value: parseFloat(unitMatch[1]), from: unitMatch[2].trim(), to: unitMatch[3].trim() }
      : { value: 1, from: 'km', to: 'miles' };
  } else if (command === 'places' || command === 'place') {
    const nearMatch = arg.match(/(.+?)\s+(?:near|in)\s+(.+)$/i);
    toolToCall = 'search_places';
    argsPayload = nearMatch
      ? { query: nearMatch[1].trim(), near: nearMatch[2].trim() }
      : { query: arg || 'coffee shop' };
  } else {
    // Unrecognized slash command; do not hijack, let main reasoning engine handle
    return null;
  }

  return {
    command,
    toolToCall,
    argsPayload,
    isWebSearch,
    overrideText,
    label: `Executed local command \`/${command}\`.`
  };
}

export async function runLocalWidget(toolToCall, argsPayload, statusText, context) {
  const { session, bubble, widgetsContainer, statusAnimator, accumulatedWidgets } = context;

  if (statusAnimator) {
    statusAnimator.stop();
  }

  const res = await fetch(`${API_BASE}/api/widget/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: state.abortController ? state.abortController.signal : undefined,
    body: JSON.stringify({ tool: toolToCall, args: argsPayload })
  });

  if (!res.ok) {
    let errorMsg = `Widget service failed with status ${res.status}`;
    try {
      const errData = await res.json();
      if (errData?.error) errorMsg = errData.error;
    } catch (_) {}
    throw new Error(errorMsg);
  }
  const widgetResult = await res.json();

  accumulatedWidgets.push(widgetResult);

  const renderer = (typeof renderWidget === 'function' ? renderWidget : window.atlasRenderWidget);
  const mounter = (typeof mountWidget === 'function' ? mountWidget : window.atlasMountWidget);

  if (renderer) {
    try {
      const widgetHtml = renderer(widgetResult.type, widgetResult.data);
      if (widgetHtml && widgetsContainer) {
        const widgetBox = document.createElement('div');
        widgetBox.className = 'widget-mount-point';
        widgetBox.innerHTML = widgetHtml;
        widgetsContainer.appendChild(widgetBox);
        if (mounter) {
          try {
            mounter(widgetBox, widgetResult.type, widgetResult.data);
          } catch (mErr) {
            console.warn('[Atlas Widgets] Widget mount error:', mErr);
          }
        }
      }
    } catch (rErr) {
      console.warn('[Atlas Widgets] Widget render error:', rErr);
    }
  }

  bubble.innerHTML = parseMarkdownSafely(statusText, false);

  session.messages.push({
    role: 'assistant',
    content: statusText,
    widgets: accumulatedWidgets
  });
  session.updatedAt = new Date().toISOString();
  saveSessions();
  updateSessionMetrics();

  scrollToBottom(true);
}

/**
 * Balanced Autonomous Need Classifier
 * Detects if a prompt genuinely requires real-time web grounding or deep reasoning.
 * Carefully guarded with negative exclusions so it never triggers on standard coding, creative writing, or basic Q&A.
 */
export function detectAutonomousNeed(text) {
  if (!text || typeof text !== 'string') return { needsWeb: false, needsReasoning: false, reason: null };
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Exclusions: Never auto-trigger on coding, web design, or programming tasks
  if (state.activeMode === 'build' || /\b(build|write|create|code|html|css|js|javascript|python|component|website|app|portfolio|page|function|class|regex|sql|docker|git|bug|fix)\b/i.test(lower)) {
    return { needsWeb: false, needsReasoning: false, reason: null };
  }

  // 2. Exclusions: Static STEM / historical knowledge definitions / creative / conversational
  if (
    /^(?:explain|what is|how does|define)\s+(?:photosynthesis|gravity|calculus|mitosis|relativity|tcp|http|dns|binary search|recursion|a black hole)\b/i.test(lower) ||
    /^(?:write|compose)\s+(?:a poem|a story|an essay|an email|a letter)\b/i.test(lower) ||
    /^(?:hi|hello|hey|who are you|what can you do|good morning)\b/i.test(lower)
  ) {
    return { needsWeb: false, needsReasoning: false, reason: null };
  }

  let needsWeb = false;
  let needsReasoning = false;
  let reason = null;

  // A. Explicit web search request
  if (/\b(search (?:the )?(?:web|internet|online)|look up (?:online|on the web)|google (?:it|this)|check (?:the )?(?:web|news|internet))\b/i.test(lower)) {
    needsWeb = true;
    reason = 'Explicit web search requested';
  }

  // B. Temporal signals (future or post-cutoff years, current release dates, trailers)
  const futureOrCurrentYear = /\b(202[5-9]|2030)\b/.test(lower);
  const temporalStatus = /\b(current(?:ly)?|latest|recent(?:ly)?|today|tonight|this week|this month|breaking news|upcoming)\b/i.test(lower);
  
  // C. Highly dynamic real-time domains (release dates, trailers, game announcements, sports scores, live launches, flight tests, upcoming films)
  const dynamicTopics = /\b(release date|confirmed date|trailer details|trailer|box office|spacex|starship|falcon 9|artemis|gta\s*6|grand theft auto|nfl|nba|premier league|champions league|world cup|election|stock price|earnings report|movies?|films?|theatrical|cinema|releases?)\b/i.test(lower);

  if (!needsWeb && ((futureOrCurrentYear && (dynamicTopics || temporalStatus)) || (temporalStatus && dynamicTopics))) {
    needsWeb = true;
    reason = 'Real-time temporal grounding required';
  }

  // D. Deep Reasoning signals: formal mathematical proofs, complex logic puzzles, multi-step game theory
  const deepReasoningSignals = /\b(prove that|formal proof|step-by-step proof|derive (?:the|an) equation|solve (?:this|the) (?:logic )?puzzle|game theory equilibrium|knights and knaves|monty hall problem)\b/i.test(lower);
  if (deepReasoningSignals) {
    needsReasoning = true;
    reason = reason ? `${reason} & Complex Multi-Step Reasoning` : 'Complex Multi-Step Reasoning required';
  }

  return { needsWeb, needsReasoning, reason };
}
