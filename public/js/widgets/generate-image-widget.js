import { createWidgetShell, escapeHtml, WIDGET_ICONS } from './widget-utils.js';

export function renderGenerateImageWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const prompt = data.prompt || 'Generated Image';
    const safeUrl = escapeHtml(data.url || '');
    const aspectRatio = escapeHtml(data.aspectRatio || '1:1');
    const width = data.width || 800;
    const height = data.height || 800;

    const metaBadgeHtml = `<span class="atlas-widget-count-badge">AI Generated (${aspectRatio})</span>`;
    
    // We compute a padding-bottom percentage to keep aspect ratio before image loads
    const paddingBottom = (height / width) * 100;

    const content = `
        <div class="atlas-gen-image-container" style="position: relative; width: 100%; border-radius: 8px; overflow: hidden; background: var(--surface-2, rgba(255, 255, 255, 0.05));">
            <div class="atlas-gen-image-skeleton" style="position: relative; width: 100%; padding-bottom: ${paddingBottom}%;">
                <div class="skeleton-shimmer" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); animation: shimmer 2s infinite; background-size: 200% 100%;"></div>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--text-muted, rgba(255,255,255,0.4)); font-family: var(--font-mono); font-size: 11px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    <span>Generating Pixels...</span>
                </div>
            </div>
            <img 
                src="${safeUrl}" 
                alt="${escapeHtml(prompt)}" 
                title="${escapeHtml(prompt)}"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.5s ease; cursor: zoom-in;"
                onload="this.style.opacity = '1'; this.previousElementSibling.style.display = 'none';"
                onerror="this.previousElementSibling.innerHTML = '<div style=\\'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #ff6b6b; font-family: var(--font-mono); font-size: 11px;\\'>Generation Failed</div>';"
                onclick="window.atlasOpenLightbox && window.atlasOpenLightbox(this.src, this.title, 'AI Generator', 'Pollinations.ai', this.src)"
            />
        </div>
        <div class="atlas-gen-image-prompt" style="margin-top: 12px; padding-left: 8px; border-left: 2px solid var(--accent, #6366f1); font-size: 13px; color: var(--text-secondary, rgba(255,255,255,0.7)); font-style: italic; line-height: 1.4;">
            "${escapeHtml(prompt)}"
        </div>
    `;

    return createWidgetShell('generate-image', WIDGET_ICONS.image, `Generated Image`, content, metaBadgeHtml);
}
