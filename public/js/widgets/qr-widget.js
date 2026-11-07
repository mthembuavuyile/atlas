/**
 * qr-widget.js
 * Adaptive QR Code Studio widget:
 * - Supports both "Standard" (clean, universal) and "Branded" (Vylex Navy #051B38 + center emblem)
 * - Interactive QR Studio templates: Text/URL, Wi-Fi Network, Contact vCard, and WhatsApp Link
 * - 1-click toggle between Standard & Branded on the fly
 * - Level H error correction (30% redundancy) for branded mode
 * - Workspace actions: Download PNG, Copy Data, Send to Prompt
 */

export function renderQrWidget(data) {
    const qrId = 'qr-' + Math.random().toString(36).substring(2, 9);
    let activePayload = data?.text || '';
    const initialPreset = data?.presetType || (/^WIFI:/i.test(activePayload) ? 'wifi' : (/^BEGIN:VCARD/i.test(activePayload) ? 'vcard' : (/wa\.me\//i.test(activePayload) ? 'whatsapp' : 'text')));

    // Default to branded if explicitly requested via data.branded or if text is a vylex URL
    const initiallyBranded = Boolean(data?.branded || data?.isBranded || (typeof activePayload === 'string' && activePayload.toLowerCase().includes('vylex.co.za')));
    let currentStyle = initiallyBranded ? 'branded' : 'standard';
    let currentPreset = initialPreset;

    if (typeof document !== 'undefined') setTimeout(() => {
        const container = document.getElementById(qrId);
        const widgetWrapper = document.getElementById(`widget-${qrId}`);
        const headerLabel = widgetWrapper?.querySelector('.qr-header-label');
        const payloadDisplay = widgetWrapper?.querySelector('.qr-payload-display');
        const styleBtns = widgetWrapper?.querySelectorAll('.qr-style-btn');
        const presetBtns = widgetWrapper?.querySelectorAll('.qr-preset-tab');
        const presetForms = widgetWrapper?.querySelectorAll('.qr-preset-form');

        function renderMatrix(style, payload = activePayload) {
            if (!container || !window.QRCode) return;
            const isBranded = style === 'branded';
            const targetText = (payload || '').trim() || 'https://atlas.vylex.co.za';

            window.QRCode.toCanvas(container, targetText, {
                width: 240,
                margin: 2,
                errorCorrectionLevel: isBranded ? 'H' : 'M',
                color: {
                    dark: isBranded ? '#051B38' : '#000000',
                    light: '#FFFFFF'
                }
            }, (error) => {
                if (error) {
                    console.error('QR rendering error:', error);
                    return;
                }
                if (isBranded) {
                    drawVylexBrandEmblem(container);
                }
            });

            if (headerLabel) {
                headerLabel.textContent = isBranded ? 'Branded QR Code • Vylex Level H' : 'Standard QR Code';
            }
            if (payloadDisplay) {
                payloadDisplay.textContent = targetText;
            }
        }

        function computePayloadFromActiveForm() {
            if (!widgetWrapper) return activePayload;
            if (currentPreset === 'wifi') {
                const ssid = (widgetWrapper.querySelector('.qr-input-ssid')?.value || '').trim();
                const pass = (widgetWrapper.querySelector('.qr-input-pass')?.value || '').trim();
                const enc = widgetWrapper.querySelector('.qr-input-enc')?.value || 'WPA';
                if (!ssid) return activePayload;
                return `WIFI:T:${enc};S:${ssid};P:${pass};;`;
            }
            if (currentPreset === 'vcard') {
                const name = (widgetWrapper.querySelector('.qr-input-vname')?.value || '').trim();
                const phone = (widgetWrapper.querySelector('.qr-input-vphone')?.value || '').trim();
                const email = (widgetWrapper.querySelector('.qr-input-vemail')?.value || '').trim();
                const org = (widgetWrapper.querySelector('.qr-input-vorg')?.value || '').trim();
                if (!name && !phone && !email) return activePayload;
                return [
                    'BEGIN:VCARD',
                    'VERSION:3.0',
                    `FN:${name || 'Contact'}`,
                    ...(org ? [`ORG:${org}`] : []),
                    ...(phone ? [`TEL;TYPE=CELL:${phone}`] : []),
                    ...(email ? [`EMAIL:${email}`] : []),
                    'END:VCARD'
                ].join('\n');
            }
            if (currentPreset === 'whatsapp') {
                const phone = (widgetWrapper.querySelector('.qr-input-waphone')?.value || '').replace(/[^\d]/g, '');
                const msg = (widgetWrapper.querySelector('.qr-input-wamsg')?.value || '').trim();
                if (!phone) return activePayload;
                return msg ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/${phone}`;
            }
            const textVal = (widgetWrapper.querySelector('.qr-input-text')?.value || '').trim();
            return textVal || activePayload;
        }

        // Initial render
        renderMatrix(currentStyle, activePayload);

        // Style switcher listeners (Standard vs Branded)
        styleBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetStyle = btn.getAttribute('data-style');
                if (targetStyle === currentStyle) return;
                currentStyle = targetStyle;

                styleBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-style') === currentStyle));
                renderMatrix(currentStyle, activePayload);
            });
        });

        // Preset template tabs (Text/URL, Wi-Fi, vCard, WhatsApp)
        presetBtns?.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetPreset = tab.getAttribute('data-preset');
                if (!targetPreset) return;
                currentPreset = targetPreset;

                presetBtns.forEach(t => t.classList.toggle('active', t.getAttribute('data-preset') === currentPreset));
                presetForms?.forEach(f => {
                    f.style.display = f.getAttribute('data-form') === currentPreset ? 'grid' : 'none';
                });
            });
        });

        // Live input listeners inside QR Studio forms
        widgetWrapper?.querySelectorAll('.qr-studio-input').forEach(inp => {
            inp.addEventListener('input', () => {
                activePayload = computePayloadFromActiveForm();
                renderMatrix(currentStyle, activePayload);
            });
        });

        // Action buttons
        if (widgetWrapper) {
            const dlBtn = widgetWrapper.querySelector('.qr-btn-download');
            const copyBtn = widgetWrapper.querySelector('.qr-btn-copy');
            const sendBtn = widgetWrapper.querySelector('.qr-btn-send');

            dlBtn?.addEventListener('click', () => {
                if (container) {
                    const link = document.createElement('a');
                    link.download = currentStyle === 'branded' ? 'vylex-branded-qr.png' : 'qrcode.png';
                    link.href = container.toDataURL('image/png');
                    link.click();
                }
            });

            copyBtn?.addEventListener('click', () => {
                navigator.clipboard.writeText(activePayload).then(() => {
                    const span = copyBtn.querySelector('span');
                    if (span) {
                        const orig = span.textContent;
                        span.textContent = 'Copied!';
                        setTimeout(() => { span.textContent = orig; }, 1500);
                    }
                }).catch(() => {});
            });

            sendBtn?.addEventListener('click', () => {
                const input = document.getElementById('messageInput') || document.getElementById('chatInput');
                if (input) {
                    input.value = input.value.trim() ? `${input.value.trim()}\n\n${activePayload}` : activePayload;
                    input.focus();
                    input.dispatchEvent(new Event('input'));
                }
            });
        }
    }, 50);

    const inputStyle = 'width:100%; padding:6px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.12); background:rgba(2,11,24,0.65); color:var(--text-main,#f8fafc); font-size:0.78rem; font-family:inherit; outline:none;';

    return `
        <div class="atlas-widget qr-widget" id="widget-${qrId}">
            <div class="widget-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px; vertical-align:text-bottom;"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01"></path></svg>
                    <span class="qr-header-label">${initiallyBranded ? 'Branded QR Code • Vylex Level H' : 'Standard QR Code'}</span>
                </div>
                <div class="qr-style-toggle-group">
                    <button type="button" class="qr-style-btn ${!initiallyBranded ? 'active' : ''}" data-style="standard" title="Clean, unbranded matrix">Standard</button>
                    <button type="button" class="qr-style-btn ${initiallyBranded ? 'active' : ''}" data-style="branded" title="Vylex Navy + Brand Emblem">Branded</button>
                </div>
            </div>
            <div class="widget-body" style="display:flex; flex-direction:column; align-items:center; padding: 18px 20px;">
                <div class="qr-preset-tabs" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px; justify-content:center;">
                    <button type="button" class="qr-style-btn qr-preset-tab ${initialPreset === 'text' || initialPreset === 'url' ? 'active' : ''}" data-preset="text">URL / Text</button>
                    <button type="button" class="qr-style-btn qr-preset-tab ${initialPreset === 'wifi' ? 'active' : ''}" data-preset="wifi">Wi-Fi</button>
                    <button type="button" class="qr-style-btn qr-preset-tab ${initialPreset === 'vcard' ? 'active' : ''}" data-preset="vcard">Business Card</button>
                    <button type="button" class="qr-style-btn qr-preset-tab ${initialPreset === 'whatsapp' ? 'active' : ''}" data-preset="whatsapp">WhatsApp</button>
                </div>

                <div style="width:100%; max-width:340px; margin-bottom:14px;">
                    <div class="qr-preset-form" data-form="text" style="display:${initialPreset === 'text' || initialPreset === 'url' ? 'grid' : 'none'}; gap:6px;">
                        <input type="text" class="qr-studio-input qr-input-text" value="${escapeHtml(activePayload)}" placeholder="https://atlas.vylex.co.za or text..." style="${inputStyle}" aria-label="QR URL or Text">
                    </div>
                    <div class="qr-preset-form" data-form="wifi" style="display:${initialPreset === 'wifi' ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap:6px;">
                        <input type="text" class="qr-studio-input qr-input-ssid" placeholder="Wi-Fi Network (SSID)" style="${inputStyle}" aria-label="Wi-Fi SSID">
                        <input type="text" class="qr-studio-input qr-input-pass" placeholder="Password" style="${inputStyle}" aria-label="Wi-Fi Password">
                        <select class="qr-studio-input qr-input-enc" style="${inputStyle} grid-column: span 2;" aria-label="Wi-Fi Security">
                            <option value="WPA">WPA / WPA2 / WPA3</option>
                            <option value="WEP">WEP</option>
                            <option value="nopass">Open (No Password)</option>
                        </select>
                    </div>
                    <div class="qr-preset-form" data-form="vcard" style="display:${initialPreset === 'vcard' ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap:6px;">
                        <input type="text" class="qr-studio-input qr-input-vname" placeholder="Full Name" style="${inputStyle}" aria-label="Contact Full Name">
                        <input type="text" class="qr-studio-input qr-input-vorg" placeholder="Company / Role" style="${inputStyle}" aria-label="Company">
                        <input type="tel" class="qr-studio-input qr-input-vphone" placeholder="Phone (+27...)" style="${inputStyle}" aria-label="Phone Number">
                        <input type="email" class="qr-studio-input qr-input-vemail" placeholder="Email Address" style="${inputStyle}" aria-label="Email Address">
                    </div>
                    <div class="qr-preset-form" data-form="whatsapp" style="display:${initialPreset === 'whatsapp' ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap:6px;">
                        <input type="tel" class="qr-studio-input qr-input-waphone" placeholder="Phone (+2782...)" style="${inputStyle}" aria-label="WhatsApp Number">
                        <input type="text" class="qr-studio-input qr-input-wamsg" placeholder="Pre-filled message" style="${inputStyle}" aria-label="WhatsApp Message">
                    </div>
                </div>

                <div style="background: #ffffff; padding: 12px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.25); display: flex; justify-content: center; align-items: center; border: 1px solid rgba(255, 255, 255, 0.1);">
                    <canvas id="${qrId}" style="display:block; max-width: 100%; height: auto;"></canvas>
                </div>
                <div class="qr-payload-display" style="margin-top: 12px; font-size: 0.78rem; color: var(--text-secondary); text-align: center; word-break: break-all; max-width: 92%; font-family: var(--font-mono, monospace); white-space: pre-wrap;">${escapeHtml(activePayload)}</div>
                <div class="qr-widget-actions" style="margin-top: 14px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
                    <button class="primary-modal-btn qr-btn-download" type="button" style="padding: 6px 12px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        <span>Download PNG</span>
                    </button>
                    <button class="secondary-modal-btn qr-btn-copy" type="button" style="padding: 6px 12px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        <span>Copy Data</span>
                    </button>
                    <button class="secondary-modal-btn qr-btn-send" type="button" style="padding: 6px 12px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 6px;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <span>Send to Prompt</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function drawVylexBrandEmblem(canvas) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const badgeSize = 44;
    const x = (canvas.width - badgeSize) / 2;
    const y = (canvas.height - badgeSize) / 2;
    const radius = 8;

    ctx.save();

    // 1. Draw rounded white badge plate
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FBA919';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, badgeSize, badgeSize, radius);
    } else {
        ctx.rect(x, y, badgeSize, badgeSize);
    }
    ctx.fill();
    ctx.stroke();

    // 2. Draw Vylex Brand Gradient Icon
    const grad = ctx.createLinearGradient(x, y, x + badgeSize, y + badgeSize);
    grad.addColorStop(0, '#FBA919');
    grad.addColorStop(1, '#D97706');
    ctx.fillStyle = grad;

    // Stylized Vylex 'V' glyph
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 9);
    ctx.lineTo(cx, cy + 9);
    ctx.lineTo(cx + 10, cy - 9);
    ctx.lineTo(cx + 5, cy - 9);
    ctx.lineTo(cx, cy - 1);
    ctx.lineTo(cx - 5, cy - 9);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
