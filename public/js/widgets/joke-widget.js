import { createWidgetShell, escapeHtml } from './widget-utils.js';

export function renderJokeWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    let content = '';
    if (data.type === 'single') {
        content = `<div style="font-size: 1.1rem; line-height: 1.5;">${escapeHtml(data.joke)}</div>`;
    } else {
        content = `
            <div style="font-size: 1.1rem; line-height: 1.5; margin-bottom: 12px;">${escapeHtml(data.setup)}</div>
            <div style="font-size: 1.1rem; line-height: 1.5; font-weight: 600; color: var(--accent);">${escapeHtml(data.delivery)}</div>
        `;
    }

    return createWidgetShell('joke', '<i class="fa-solid fa-face-laugh-squint"></i>', `Joke: ${data.category}`, content);
}
