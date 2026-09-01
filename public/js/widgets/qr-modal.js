class QRScannerManager {
    constructor() {
        this.stream = null;
        this.scanning = false;
        
        this.modal = document.getElementById('qrModalOverlay');
        this.video = document.getElementById('qrVideo');
        this.canvas = document.getElementById('qrCanvas');
        this.preview = document.getElementById('qrPreview');
        this.statusText = document.getElementById('qrScanStatus');
        
        this.btnCamera = document.getElementById('qrBtnCamera');
        this.btnUpload = document.getElementById('qrBtnUpload');
        this.btnClose = document.getElementById('qrBtnClose');
        
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = 'image/*';
        
        this.initEventListeners();
        
        document.addEventListener('atlas:open-qr-scanner', () => this.open());
    }
    
    initEventListeners() {
        if (!this.modal) return;
        this.btnClose?.addEventListener('click', () => this.close());
        this.btnCamera?.addEventListener('click', () => this.startCamera());
        this.btnUpload?.addEventListener('click', () => this.fileInput.click());

        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.stopCamera();
                const reader = new FileReader();
                reader.onload = (ev) => {
                    if (this.preview) {
                        this.preview.src = ev.target.result;
                        this.preview.style.display = 'block';
                    }
                    if (this.video) this.video.style.display = 'none';
                    if (this.statusText) this.statusText.innerText = "Scanning uploaded image...";
                    this.scanImageFile(ev.target.result);
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

    open() {
        if (this.modal) {
            this.modal.classList.add('active');
            if (this.statusText) this.statusText.innerText = "Ready to scan.";
            if (this.preview) this.preview.style.display = 'none';
            if (this.video) this.video.style.display = 'none';
        }
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('active');
            this.stopCamera();
        }
    }

    async startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            if (this.statusText) this.statusText.innerText = "Camera not supported by your browser.";
            return;
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if (this.video) {
                this.video.srcObject = this.stream;
                this.video.setAttribute("playsinline", true); // required for iOS Safari
                this.video.style.display = 'block';
            }
            if (this.preview) this.preview.style.display = 'none';
            if (this.statusText) this.statusText.innerText = "Looking for QR code...";
            
            this.scanning = true;
            requestAnimationFrame(() => this.tick());
        } catch (err) {
            console.error('QR Camera Error:', err);
            if (this.statusText) this.statusText.innerText = "Could not access camera.";
        }
    }

    stopCamera() {
        this.scanning = false;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.video) {
            this.video.style.display = 'none';
        }
    }

    tick() {
        if (!this.scanning) return;
        
        if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            if (!this.canvas) return;
            const context = this.canvas.getContext("2d");
            this.canvas.height = this.video.videoHeight;
            this.canvas.width = this.video.videoWidth;
            context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            const imageData = context.getImageData(0, 0, this.canvas.width, this.canvas.height);
            if (window.jsQR) {
                const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                
                if (code && code.data) {
                    this.onQRCodeFound(code.data);
                    return; // Stop ticking
                }
            }
        }
        requestAnimationFrame(() => this.tick());
    }

    scanImageFile(dataUrl) {
        const img = new Image();
        img.onload = () => {
            if (!this.canvas) return;
            const context = this.canvas.getContext("2d");
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            context.drawImage(img, 0, 0, img.width, img.height);
            
            const imageData = context.getImageData(0, 0, img.width, img.height);
            if (window.jsQR) {
                const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "attemptBoth",
                });
                
                if (code && code.data) {
                    this.onQRCodeFound(code.data);
                } else {
                    if (this.statusText) this.statusText.innerText = "No QR code found in this image.";
                }
            }
        };
        img.src = dataUrl;
    }

    onQRCodeFound(data) {
        this.stopCamera();
        
        // Populate chat input directly
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.value = data;
            chatInput.style.height = 'auto';
            chatInput.style.height = (chatInput.scrollHeight) + 'px';
            chatInput.focus();
        }
        
        if (this.statusText) {
            this.statusText.innerHTML = `<span style="color:var(--vylex-success, #10b981);">QR Code Detected!</span>`;
        }
        
        // Auto-close modal after brief delay
        setTimeout(() => {
            this.close();
        }, 800);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.atlasQRManager = new QRScannerManager();
});
