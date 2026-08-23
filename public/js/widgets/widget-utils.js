export function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

export function formatNumber(num) {
    return Number(num).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    });
}

export function createWidgetShell(type, icon, title, content) {
    return `
        <div class="atlas-widget atlas-widget-${type}">
            <div class="atlas-widget-header">
                <span class="atlas-widget-icon">${icon}</span>
                <span class="atlas-widget-title">${escapeHtml(title)}</span>
            </div>
            <div class="atlas-widget-body">
                ${content}
            </div>
        </div>
    `;
}
