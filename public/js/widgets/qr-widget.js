export function renderQrWidget(data) {
    const qrId = 'qr-' + Math.random().toString(36).substring(2, 9);
    
    // The HTML is returned synchronously and injected via innerHTML.
    // We use setTimeout to ensure the DOM has the canvas before we render to it.
    setTimeout(() => {
        const container = document.getElementById(qrId);
        if (container && window.QRCode) {
            window.QRCode.toCanvas(container, data.text, {
                width: 240,
                margin: 2,
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
                <i class="fa-solid fa-qrcode"></i> QR Code Generated
            </div>
            <div class="widget-body" style="display:flex; flex-direction:column; align-items:center; padding: 24px;">
                <div style="position: relative; background: #fff; padding: 8px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                    <canvas id="${qrId}" style="display:block;"></canvas>
                    <!-- Small orange accent dot in the center to fit brand specs loosely -->
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: #FBA919; border: 3px solid #fff; border-radius: 4px;"></div>
                </div>
                <div style="margin-top: 16px; font-size: 0.85rem; color: var(--text-secondary); text-align: center; word-break: break-all; max-width: 90%;">
                    ${data.text}
                </div>
                <button class="primary-modal-btn" style="margin-top: 20px; padding: 8px 16px;" onclick="
                    const canvas = document.getElementById('${qrId}');
                    if (canvas) {
                        const link = document.createElement('a');
                        link.download = 'vylex-qr.png';
                        link.href = canvas.toDataURL();
                        link.click();
                    }
                "><i class="fa-solid fa-download"></i> Download PNG</button>
            </div>
        </div>
    `;
}
