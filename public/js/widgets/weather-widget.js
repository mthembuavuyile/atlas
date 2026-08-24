import { createWidgetShell, escapeHtml, WIDGET_ICONS } from './widget-utils.js';

export function renderWeatherWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const { current, name, country } = data;
    const temp = current.temperature;
    
    // Choose clean SVG icon based on weather code (no emojis)
    const code = current.weathercode;
    let weatherSvg = WIDGET_ICONS.sun;
    let weatherLabel = 'Clear';
    
    if (code <= 3) {
        weatherSvg = WIDGET_ICONS.sun;
        weatherLabel = 'Sunny / Clear';
    } else if (code <= 48) {
        weatherSvg = WIDGET_ICONS.cloud;
        weatherLabel = 'Partly Cloudy / Overcast';
    } else if (code <= 67) {
        weatherSvg = WIDGET_ICONS.rain;
        weatherLabel = 'Rain / Drizzle';
    } else if (code <= 77) {
        weatherSvg = WIDGET_ICONS.snow;
        weatherLabel = 'Snow';
    } else if (code <= 99) {
        weatherSvg = WIDGET_ICONS.lightning;
        weatherLabel = 'Thunderstorm';
    }

    let timeStr = '';
    if (current && current.time) {
        const parts = String(current.time).split('T');
        if (parts[1]) {
            timeStr = parts[1].slice(0, 5);
        }
    }

    const content = `
        <div class="atlas-weather-main">
            <div class="weather-temp-group">
                <span class="atlas-weather-temp">${temp}°C</span>
                <span class="weather-condition-label">${weatherLabel}</span>
            </div>
            <div class="weather-icon-visual">${weatherSvg}</div>
        </div>
        <div class="atlas-weather-details">
            <span>Wind: ${current.windspeed} km/h</span>
            ${timeStr ? `<span>Time: ${escapeHtml(timeStr)}${data.timezone_abbreviation ? ` (${escapeHtml(data.timezone_abbreviation)})` : ''}</span>` : `<span>Direction: ${current.winddirection}°</span>`}
        </div>
    `;

    return createWidgetShell('weather', WIDGET_ICONS.weather, `Weather: ${name}, ${country}`, content);
}
