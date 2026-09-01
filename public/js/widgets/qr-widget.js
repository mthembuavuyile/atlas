export function renderQrWidget(data) {
    const qrId = 'qr-' + Math.random().toString(36).substring(2, 9);
    const rawText = data?.text || '';
    
    // The HTML is returned synchronously and injected via innerHTML.
    // We use setTimeout to ensure the DOM has the canvas before we render to it.
    setTimeout(() => {
        const container = document.getElementById(qrId);
        if (container && window.QRCode) {
            window.QRCode.toCanvas(container, rawText, {
                width: 240,
                margin: 2,
                errorCorrectionLevel: 'H',
                color: {
                    dark: '#051B38', // Vylex Navy
                    light: '#FFFFFF'
                }
            }, (error) => {
                if (error) console.error('QR rendering error:', error);
            });
        }
    }, 50);

    return `
        <div class="atlas-widget qr-widget">
            <div class="widget-header">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px; vertical-align:text-bottom;"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01"></path></svg>
                QR Code Generated
            </div>
            <div class="widget-body" style="display:flex; flex-direction:column; align-items:center; padding: 20px;">
                <div style="background: #ffffff; padding: 10px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.25); display: flex; justify-content: center; align-items: center;">
                    <canvas id="${qrId}" style="display:block; max-width: 100%; height: auto;"></canvas>
                </div>
                <div style="margin-top: 14px; font-size: 0.8rem; color: var(--text-secondary); text-align: center; word-break: break-all; max-width: 90%; font-family: var(--font-mono, monospace);">
                    ${rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </div>
                <button class="primary-modal-btn" style="margin-top: 16px; padding: 6px 14px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 6px;" onclick="
                    const canvas = document.getElementById('${qrId}');
                    if (canvas) {
                        const link = document.createElement('a');
                        link.download = 'atlas-qr.png';
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                    }
                ">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Download PNG
                </button>
            </div>
        </div>
    `;
}
