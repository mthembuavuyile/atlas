/**
 * Atlas Central Widget Registry
 * ─────────────────────────────────────────────────────────────
 * Unifies all modular widget components and legacy renderers
 * with lifecycle mounting support (e.g. script injection for TradingView).
 */

import { renderWeatherWidget } from './weather-widget.js';
import { renderCryptoWidget } from './crypto-widget.js';
import { renderBibleWidget } from './bible-widget.js';
import { renderImageWidget } from './image-widget.js';
import { renderNewsWidget } from './news-widget.js';
import { renderRedditWidget } from './reddit-widget.js';
import { renderDictionaryWidget } from './dictionary-widget.js';
import { renderCurrencyWidget } from './currency-widget.js';
import { renderMathWidget } from './math-widget.js';
import { renderJokeWidget } from './joke-widget.js';
import { renderAdviceWidget } from './advice-widget.js';
import { renderTimeWidget } from './time-widget.js';
import { renderUnitWidget } from './unit-widget.js';
import { renderPlacesWidget } from './places-widget.js';
import { renderQrWidget } from './qr-widget.js';
import { renderGenerateImageWidget } from './generate-image-widget.js';

// Modular Component Widgets
import { movieWidget } from './components/movie-widget.js';
import { movieCollectionWidget } from './components/movie-collection-widget.js';
import { stockWidget } from './components/stock-widget.js';
import { cryptoTerminalWidget } from './components/crypto-terminal-widget.js';

const WIDGET_REGISTRY = new Map();

// Helper to register standard function renderer
function registerRenderer(type, renderFn, mountFn = null) {
  WIDGET_REGISTRY.set(type, {
    render: renderFn,
    mount: mountFn
  });
}

// Helper to register modular component object
function registerComponent(component) {
  if (!component || !component.type) return;
  WIDGET_REGISTRY.set(component.type, {
    render: (data) => component.render(data),
    mount: component.mount ? (container, data) => component.mount(container, data) : null
  });
}

// 1. Register Legacy Renderers
registerRenderer('time', renderTimeWidget);
registerRenderer('unit', renderUnitWidget);
registerRenderer('places', renderPlacesWidget);
registerRenderer('weather', renderWeatherWidget);
registerRenderer('crypto', renderCryptoWidget);
registerRenderer('bible', renderBibleWidget);
registerRenderer('image', renderImageWidget);
registerRenderer('news', renderNewsWidget);
registerRenderer('reddit', renderRedditWidget);
registerRenderer('dictionary', renderDictionaryWidget);
registerRenderer('currency', renderCurrencyWidget);
registerRenderer('math', renderMathWidget);
registerRenderer('joke', renderJokeWidget);
registerRenderer('advice', renderAdviceWidget);
registerRenderer('generate_image', renderGenerateImageWidget);
registerRenderer('generate_qr', renderQrWidget);

// 2. Register New Modular Components
registerComponent(movieWidget);
registerComponent(movieCollectionWidget);
registerComponent(stockWidget);
registerComponent(cryptoTerminalWidget);

/**
 * Render widget HTML by type and data
 * @param {string} type
 * @param {object} data
 * @returns {string|null}
 */
export function renderWidget(type, data) {
  const widget = WIDGET_REGISTRY.get(type);
  if (!widget) {
    if (type === 'ocr') {
      document.dispatchEvent(new CustomEvent('atlas:open-ocr'));
      return null;
    }
    if (type === 'scan_qr') {
      document.dispatchEvent(new CustomEvent('atlas:open-qr-scanner'));
      return null;
    }
    console.warn(`[Atlas Widgets] No widget renderer registered for type: "${type}"`);
    return null;
  }
  return widget.render(data);
}

/**
 * Run post-render mount lifecycle on a widget container
 * @param {HTMLElement} container
 * @param {string} type
 * @param {object} data
 */
export function mountWidget(container, type, data) {
  const widget = WIDGET_REGISTRY.get(type);
  if (widget && typeof widget.mount === 'function' && container) {
    try {
      widget.mount(container, data);
    } catch (err) {
      console.error(`[Atlas Widgets] Mount lifecycle error for ${type}:`, err);
    }
  }
}

export { WIDGET_REGISTRY };
