import { createWidgetShell, escapeHtml } from './widget-utils.js';

export function renderWeatherWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const { current, name, country } = data;
    const temp = current.temperature;
    
    // Choose icon based on weather code
    const code = current.weathercode;
    let icon = '🌤️';
    if (code <= 3) icon = '☀️';
    else if (code <= 48) icon = '☁️';
    else if (code <= 67) icon = '🌧️';
    else if (code <= 77) icon = '❄️';
    else if (code <= 99) icon = '⛈️';

    const content = `
        <div class="atlas-weather-main">
            <span class="atlas-weather-temp">${temp}°C</span>
            <span class="atlas-weather-desc">${icon}</span>
        </div>
        <div class="atlas-weather-details">
            <span>Wind: ${current.windspeed} km/h</span>
            <span>Dir: ${current.winddirection}°</span>
        </div>
    `;

    return createWidgetShell('weather', '<i class="fa-solid fa-cloud"></i>', `Weather: ${name}, ${country}`, content);
}
