/**
 * voice.js
 * Speech-to-Text dictation engine powered by the Web Speech API.
 * Captures interim/final voice transcripts and pipes directly into the composer.
 */

import { dom } from '../ui/dom.js';
import { updateContextEstimator } from '../ui/session-manager.js';

export function initVoiceDictation() {
  const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SpeechRecognition) {
    if (dom.voiceDictationBtn) {
      dom.voiceDictationBtn.title = 'Speech-to-Text not supported in this browser';
      dom.voiceDictationBtn.style.opacity = '0.5';
    }
    return;
  }

  let speechRecognizer = null;
  let isListening = false;

  const stopListening = () => {
    isListening = false;
    if (dom.voiceDictationBtn) {
      dom.voiceDictationBtn.classList.remove('is-listening');
      dom.voiceDictationBtn.title = 'Dictate Prompt (Speech to Text)';
    }
  };

  dom.voiceDictationBtn?.addEventListener('click', () => {
    if (isListening) {
      speechRecognizer?.stop();
      stopListening();
      return;
    }

    try {
      speechRecognizer = new SpeechRecognition();
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
      speechRecognizer.continuous = !isMobile;
      speechRecognizer.interimResults = true;
      speechRecognizer.lang = navigator.language || 'en-US';

      let initialPrefix = '';

      speechRecognizer.onstart = () => {
        isListening = true;
        initialPrefix = dom.messageInput ? dom.messageInput.value.trim() : '';
        if (initialPrefix) initialPrefix += ' ';
        dom.voiceDictationBtn?.classList.add('is-listening');
        dom.voiceDictationBtn.title = 'Listening... Click to stop';
      };

      speechRecognizer.onresult = (event) => {
        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0].transcript.trim();
          if (res.isFinal) {
            // Deduplicate cumulative Android chunks (e.g. "what is" superseding "what")
            if (!sessionFinal) {
              sessionFinal = text;
            } else if (text.toLowerCase().startsWith(sessionFinal.toLowerCase())) {
              sessionFinal = text;
            } else if (!sessionFinal.toLowerCase().includes(text.toLowerCase())) {
              sessionFinal += ' ' + text;
            }
          } else {
            sessionInterim += (sessionInterim ? ' ' : '') + text;
          }
        }

        const recognizedText = sessionFinal + (sessionInterim ? (sessionFinal ? ' ' : '') + sessionInterim : '');
        if (dom.messageInput && recognizedText) {
          dom.messageInput.value = initialPrefix + recognizedText;
          dom.messageInput.style.height = 'auto';
          dom.messageInput.style.height = `${Math.min(dom.messageInput.scrollHeight, 200)}px`;
          updateContextEstimator();
        }
      };

      speechRecognizer.onerror = (event) => {
        console.warn('[Atlas Speech] Recognition error:', event.error);
        stopListening();
      };

      speechRecognizer.onend = () => {
        stopListening();
      };

      speechRecognizer.start();
    } catch (err) {
      console.warn('[Atlas Speech] Failed to start:', err);
      stopListening();
    }
  });
}
