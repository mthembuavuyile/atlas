import { createWidgetShell, escapeHtml, WIDGET_ICONS } from './widget-utils.js';

export function renderTimeWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const content = `
        <div class="time-widget-display">
            <div class="time-main-row">
                <span class="time-value-highlight">${escapeHtml(data.time24)}</span>
                <span class="time-12h-label">${escapeHtml(data.time12)}</span>
            </div>
            <div class="time-date-row">
                <span class="time-day-badge">${escapeHtml(data.day)}</span>
                <span class="time-date-text">${escapeHtml(data.date)}</span>
            </div>
            <div class="time-zone-meta">
                <span class="widget-badge">${escapeHtml(data.timezoneAbbr || 'TZ')}</span>
                <span class="time-tz-name">${escapeHtml(data.timezone)}</span>
            </div>
        </div>
    `;

    return createWidgetShell('time', WIDGET_ICONS.time, 'Chronometer · Live Time', content);
}
