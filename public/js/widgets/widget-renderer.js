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

const RENDERERS = {
    time: renderTimeWidget,
    unit: renderUnitWidget,
    places: renderPlacesWidget,
    weather: renderWeatherWidget,
    crypto: renderCryptoWidget,
    bible: renderBibleWidget,
    image: renderImageWidget,
    news: renderNewsWidget,
    reddit: renderRedditWidget,
    dictionary: renderDictionaryWidget,
    currency: renderCurrencyWidget,
    math: renderMathWidget,
    joke: renderJokeWidget,
    advice: renderAdviceWidget,
    generate_image: renderGenerateImageWidget,
    generate_qr: renderQrWidget
};

export function renderWidget(type, data) {
    const renderer = RENDERERS[type];
    if (!renderer) {
        if (type === 'ocr') {
            // OCR triggers an event to open the modal, it doesn't render inline HTML
            document.dispatchEvent(new CustomEvent('atlas:open-ocr'));
            return null;
        }
        if (type === 'scan_qr') {
            document.dispatchEvent(new CustomEvent('atlas:open-qr-scanner'));
            return null;
        }
        console.warn(`No widget renderer found for type: ${type}`);
        return null;
    }
    return renderer(data);
}
