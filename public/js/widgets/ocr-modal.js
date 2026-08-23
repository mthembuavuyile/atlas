class OCRManager {
    constructor() {
        this.worker = null;
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
        this.btnClose.addEventListener('click', () => this.close());
        this.btnCamera.addEventListener('click', () => this.startCamera());
        this.btnUpload.addEventListener('click', () => this.fileInput.click());
        this.btnCapture.addEventListener('click', () => this.capture());
        this.btnSend.addEventListener('click', () => this.sendToChat());
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.stopCamera();
                const reader = new FileReader();
                reader.onload = (ev) => {
                    this.preview.src = ev.target.result;
                    this.preview.style.display = 'block';
                    this.video.style.display = 'none';
                    this.btnCapture.style.display = 'none';
                    this.textarea.value = "Scanning image...";
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
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (let item of items) {
                if (item.type.indexOf('image') === 0) {
                    const blob = item.getAsFile();
                    this.open();
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        this.preview.src = ev.target.result;
                        this.preview.style.display = 'block';
                        this.video.style.display = 'none';
                        this.btnCapture.style.display = 'none';
                        this.textarea.value = "Scanning pasted image...";
                        this.performOCR(ev.target.result);
                    };
                    reader.readAsDataURL(blob);
                }
            }
        });
    }

    async initWorker() {
        if (!this.worker) {
            this.textarea.value = "Loading OCR Engine...";
            try {
                this.worker = await Tesseract.createWorker('eng');
            } catch (e) {
                console.error(e);
                this.textarea.value = "Failed to load OCR engine. Ensure Tesseract.js is included.";
            }
        }
    }

    open() {
        if (!this.modal) return;
        this.modal.classList.add('active');
        this.initWorker();
        this.textarea.value = "";
        this.preview.style.display = 'none';
    }

    close() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
        this.stopCamera();
    }

    async startCamera() {
        this.preview.style.display = 'none';
        this.video.style.display = 'block';
        this.btnCapture.style.display = 'block';
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                this.video.srcObject = this.stream;
                this.textarea.value = "Camera active. Point at text and capture.";
            } catch (err) {
                this.textarea.value = "Camera access denied or unavailable.";
            }
        } else {
            this.textarea.value = "Camera not supported on this device/browser.";
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    capture() {
        if (!this.stream) return;
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        const ctx = this.canvas.getContext('2d');
        ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        const dataUrl = this.canvas.toDataURL('image/jpeg');
        this.stopCamera();
        
        this.preview.src = dataUrl;
        this.preview.style.display = 'block';
        this.video.style.display = 'none';
        this.btnCapture.style.display = 'none';
        
        this.textarea.value = "Scanning image...";
        this.performOCR(dataUrl);
    }

    async performOCR(imageSrc) {
        await this.initWorker();
        if (!this.worker) return;
        
        try {
            const { data: { text } } = await this.worker.recognize(imageSrc);
            this.textarea.value = text.trim() || "No text detected in this image.";
        } catch (e) {
            this.textarea.value = "Error during text recognition.";
        }
    }

    sendToChat() {
        const text = this.textarea.value.trim();
        if (text && text !== "No text detected in this image." && !text.startsWith("Scanning") && !text.startsWith("Camera") && !text.startsWith("Loading")) {
            // Dispatch event to app.js
            document.dispatchEvent(new CustomEvent('atlas:ocr-result', { detail: text }));
            this.close();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.atlasOcrManager = new OCRManager();
});
