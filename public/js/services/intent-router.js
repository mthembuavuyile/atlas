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

  const image = pickMatch([/^(?:show me|find|search)\s+(?:an?\s+)?(?:images?|photos?|pictures?)\s+(?:of|for)\s+(.+)$/i, /^photos?\s+(?:of|for)\s+(.+)$/i]);
  if (image && !/\b(website|portfolio|button|page|component)\b/i.test(image)) {
    return { tool: 'search_images', args: { query: image }, label: 'Fetched visual references.' };
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

  if (command === 'crypto') {
    toolToCall = 'get_crypto_price';
    argsPayload = { coin: arg || 'bitcoin' };
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
    argsPayload = { query: arg || 'beautiful landscape' };
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

  if (!res.ok) throw new Error('Widget service failed');
  const widgetResult = await res.json();

  accumulatedWidgets.push(widgetResult);

  if (window.atlasRenderWidget) {
    const widgetHtml = window.atlasRenderWidget(widgetResult.type, widgetResult.data);
    if (widgetHtml && widgetsContainer) {
      const widgetBox = document.createElement('div');
      widgetBox.className = 'widget-mount-point';
      widgetBox.innerHTML = widgetHtml;
      widgetsContainer.appendChild(widgetBox);
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
