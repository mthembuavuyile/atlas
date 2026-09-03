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
      speechRecognizer.continuous = true;
      speechRecognizer.interimResults = true;
      speechRecognizer.lang = 'en-US';

      speechRecognizer.onstart = () => {
        isListening = true;
        dom.voiceDictationBtn.classList.add('is-listening');
        dom.voiceDictationBtn.title = 'Listening... Click to stop';
      };

      speechRecognizer.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0].transcript.trim();
            if (text && dom.messageInput) {
              dom.messageInput.value = (dom.messageInput.value ? dom.messageInput.value + ' ' : '') + text;
              dom.messageInput.style.height = 'auto';
              dom.messageInput.style.height = `${Math.min(dom.messageInput.scrollHeight, 200)}px`;
              updateContextEstimator();
            }
          }
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
