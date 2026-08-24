class OCRManager {
    constructor() {
        this.stream = null;
        this.modal = document.getElementById('ocrModalOverlay');
        this.video = document.getElementById('ocrVideo');
        this.canvas = document.getElementById('ocrCanvas');
        this.preview = document.getElementById('ocrPreview');
        this.textarea = document.getElementById('ocrResultText');
        
        this.btnCamera = document.getElementById('ocrBtnCamera');
        this.btnUpload = document.getElementById('ocrBtnUpload');
        this.btnCapture = document.getElementById('ocrBtnCapture');
        this.btnSend = document.getElementById('ocrBtnSend');
        this.btnClose = document.getElementById('ocrBtnClose');
        
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = 'image/*';
        
        this.initEventListeners();
        
        document.addEventListener('atlas:open-ocr', () => this.open());
    }
    
    initEventListeners() {
        if (!this.modal) return;
        this.btnClose?.addEventListener('click', () => this.close());
        this.btnCamera?.addEventListener('click', () => this.startCamera());
        this.btnUpload?.addEventListener('click', () => this.fileInput.click());
        this.btnCapture?.addEventListener('click', () => this.capture());
        this.btnSend?.addEventListener('click', () => this.sendToChat());

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
                    if (this.btnCapture) this.btnCapture.style.display = 'none';
                    if (this.textarea) this.textarea.value = "Scanning image...";
                    this.performOCR(ev.target.result);
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
        
        // Drag and drop support
        document.addEventListener('dragover', (e) => { e.preventDefault(); });
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];
                if (file.type.startsWith('image/')) {
                    this.open();
                    this.fileInput.files = e.dataTransfer.files;
                    this.fileInput.dispatchEvent(new Event('change'));
                }
            }
        });

        // Paste support
        document.addEventListener('paste', (e) => {
            const items = (e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData))?.items;
            if (!items) return;
            for (let item of items) {
                if (item.type && item.type.indexOf('image') === 0) {
                    const blob = item.getAsFile();
                    if (!blob) continue;
                    this.open();
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (this.preview) {
                            this.preview.src = ev.target.result;
                            this.preview.style.display = 'block';
                        }
                        if (this.video) this.video.style.display = 'none';
                        if (this.btnCapture) this.btnCapture.style.display = 'none';
                        if (this.textarea) this.textarea.value = "Scanning pasted image...";
                        this.performOCR(ev.target.result);
                    };
                    reader.readAsDataURL(blob);
                    break;
                }
            }
        });
    }

    open() {
        if (!this.modal) return;
        this.modal.classList.add('active');
        if (this.textarea) this.textarea.value = "";
        if (this.preview) this.preview.style.display = 'none';
        if (this.video) this.video.style.display = 'none';
        if (this.btnCapture) this.btnCapture.style.display = 'none';
    }

    close() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
        this.stopCamera();
    }

    async startCamera() {
        if (this.preview) this.preview.style.display = 'none';
        if (this.video) this.video.style.display = 'block';
        if (this.btnCapture) this.btnCapture.style.display = 'inline-block';
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                this.video.srcObject = this.stream;
                if (this.textarea) this.textarea.value = "Camera active. Point at document/text and press Capture.";
            } catch (err) {
                if (this.textarea) this.textarea.value = "Camera access denied or unavailable.";
            }
        } else {
            if (this.textarea) this.textarea.value = "Camera not supported in this browser environment.";
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    capture() {
        if (!this.stream || !this.video || !this.canvas) return;
        this.canvas.width = this.video.videoWidth || 640;
        this.canvas.height = this.video.videoHeight || 480;
        const ctx = this.canvas.getContext('2d');
        ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        const dataUrl = this.canvas.toDataURL('image/jpeg');
        this.stopCamera();
        
        if (this.preview) {
            this.preview.src = dataUrl;
            this.preview.style.display = 'block';
        }
        if (this.video) this.video.style.display = 'none';
        if (this.btnCapture) this.btnCapture.style.display = 'none';
        
        if (this.textarea) this.textarea.value = "Scanning captured image...";
        this.performOCR(dataUrl);
    }

    async performOCR(imageSrc) {
        if (!window.Tesseract) {
            if (this.textarea) this.textarea.value = "OCR engine is loading or unavailable. Please check internet connection.";
            return;
        }
        
        if (this.textarea) this.textarea.value = "Initializing OCR analysis...";
        
        try {
            const res = await window.Tesseract.recognize(
                imageSrc,
                'eng',
                {
                    logger: m => {
                        if (m && m.status === 'recognizing text' && m.progress !== undefined) {
                            const pct = Math.round(m.progress * 100);
                            if (this.textarea) this.textarea.value = `Recognizing text... ${pct}%`;
                        } else if (m && m.status) {
                            const msg = m.status.charAt(0).toUpperCase() + m.status.slice(1).replace(/_/g, ' ');
                            if (this.textarea) this.textarea.value = `${msg}...`;
                        }
                    }
                }
            );

            const text = (res && res.data && res.data.text) ? res.data.text.trim() : '';
            if (this.textarea) {
                this.textarea.value = text || "No legible text detected in this image.";
            }
        } catch (e) {
            console.error('[OCR Error]:', e);
            if (this.textarea) {
                this.textarea.value = `Error during text recognition: ${e.message || 'Unknown error'}`;
            }
        }
    }

    sendToChat() {
        const text = this.textarea ? this.textarea.value.trim() : '';
        if (text && text !== "No legible text detected in this image." && !text.startsWith("Initializing") && !text.startsWith("Recognizing") && !text.startsWith("Scanning") && !text.startsWith("Camera") && !text.startsWith("Loading")) {
            // Dispatch event to app.js
            document.dispatchEvent(new CustomEvent('atlas:ocr-result', { detail: text }));
            this.close();
        }
    }
}

// Initialize immediately or when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.atlasOcrManager = new OCRManager();
    });
} else {
    window.atlasOcrManager = new OCRManager();
}

