import { createWidgetShell, escapeHtml, WIDGET_ICONS } from './widget-utils.js';

export function renderJokeWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    let content = '';
    if (data.type === 'single') {
        content = `<div class="atlas-joke-text">${escapeHtml(data.joke)}</div>`;
    } else {
        content = `
            <div class="atlas-joke-setup">${escapeHtml(data.setup || '')}</div>
            <div class="atlas-joke-delivery">${escapeHtml(data.delivery || '')}</div>
        `;
    }

    return createWidgetShell('joke', WIDGET_ICONS.joke, `Humour${data.category ? `: ${data.category}` : ''}`, content);
}
