import { createWidgetShell, escapeHtml } from './widget-utils.js';

export function renderMathWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const content = `
        <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase; font-weight: 600;">
            ${escapeHtml(data.operation)}
        </div>
        <div style="font-size: 1.1rem; margin-bottom: 12px; font-family: 'JetBrains Mono', monospace;">
            ${escapeHtml(data.expression)}
        </div>
        <div style="font-size: 1.8rem; font-weight: 700; color: var(--accent); font-family: 'JetBrains Mono', monospace;">
            = ${escapeHtml(data.result)}
        </div>
    `;

    return createWidgetShell('math', '<i class="fa-solid fa-calculator"></i>', 'Math Solver', content);
}
