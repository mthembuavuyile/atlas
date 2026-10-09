/**
 * speech-pill.js
 * Premium floating speech playback pill with animated audio frequency waves.
 * Controls Web Speech API synthesis, pause/resume, and real-time visualizer state.
 */

import { state } from '../state/store.js';
import { dom } from '../ui/dom.js';
import { ICONS } from '../config/constants.js';

let activeUtterance = null;
let heartbeatTimer = null;
let surgeTimeout = null;
let isManuallyPaused = false;

/**
 * Initializes listeners for the speech pill playback controls and keyboard shortcuts.
 */
export function initSpeechPill() {
  if (dom.speechPillPauseBtn) {
    dom.speechPillPauseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePauseResume();
    });
  }

  if (dom.speechPillStopBtn) {
    dom.speechPillStopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      stopSpeakingResponse();
    });
  }

  // Keyboard shortcut: Escape halts active speech playback
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.isReadingResponse) {
      stopSpeakingResponse();
    }
  });
}

/**
 * Starts reading out an assistant message response.
 * @param {Object} options
 * @param {string} options.text - Text to read
 * @param {HTMLButtonElement} [options.sourceBtn] - Message speak action button
 * @param {string} [options.voiceName] - Custom voice override
 */
export function startSpeakingResponse({ text, sourceBtn = null, voiceName = '' }) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  // If already speaking this exact message, toggle stop
  if (state.isReadingResponse && state.activeSpeechButton === sourceBtn && sourceBtn !== null) {
    stopSpeakingResponse();
    return true;
  }

  // Halt any previous playback without hiding immediately
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    window.speechSynthesis.cancel();
  }
  resetActiveSourceButton();

  const cleanText = text
    ? text
        .replace(/```[\s\S]*?```/g, 'Code block omitted.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_~#>]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    : '';

  if (!cleanText) return false;

  const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
  const targetVoiceName = voiceName || state.defaultVoiceName || '';
  const selectedVoice = voices.find(v => v.name === targetVoiceName)
    || voices.find(v => v.name.toLowerCase() === targetVoiceName.toLowerCase())
    || voices.find(v => v.default)
    || voices[0]
    || null;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  utterance.rate = 1;
  utterance.pitch = 1;

  activeUtterance = utterance;
  isManuallyPaused = false;
  state.isReadingResponse = true;
  state.activeSpeechButton = sourceBtn;

  if (sourceBtn) {
    sourceBtn.classList.add('is-speaking');
    sourceBtn.title = 'Stop reading response';
    sourceBtn.innerHTML = ICONS.stop || 'Stop';
  }

  showSpeechPill(selectedVoice);

  utterance.onstart = () => {
    showSpeechPill(selectedVoice);
  };

  utterance.onboundary = (event) => {
    if (event.name === 'word') {
      triggerWaveSurge();
    }
  };

  utterance.onpause = () => {
    updatePillPausedState(true);
  };

  utterance.onresume = () => {
    updatePillPausedState(false);
  };

  utterance.onend = () => {
    cleanupSpeechState();
  };

  utterance.onerror = (e) => {
    if (e.error !== 'canceled' && e.error !== 'interrupted') {
      console.warn('[Atlas Speech] Playback error:', e.error);
    }
    cleanupSpeechState();
  };

  // Chromium bug workaround: Keep background synthesis alive on long text
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    if (!state.isReadingResponse || !window.speechSynthesis.speaking) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
      return;
    }
    if (!isManuallyPaused && typeof window.speechSynthesis.pause === 'function') {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000);

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Halts active speech synthesis and hides the pill.
 */
export function stopSpeakingResponse() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  cleanupSpeechState();
}

/**
 * Pauses active speech synthesis.
 */
export function pauseSpeakingResponse() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    isManuallyPaused = true;
    updatePillPausedState(true);
  }
}

/**
 * Resumes paused speech synthesis.
 */
export function resumeSpeakingResponse() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.resume();
    isManuallyPaused = false;
    updatePillPausedState(false);
  }
}

/**
 * Toggles speech pause / resume.
 */
export function togglePauseResume() {
  if (isManuallyPaused) {
    resumeSpeakingResponse();
  } else {
    pauseSpeakingResponse();
  }
}

/**
 * Shows and animates the speech playback pill.
 */
function showSpeechPill(selectedVoice) {
  const pill = dom.speechResponsePill;
  if (!pill) return;

  pill.hidden = false;
  pill.classList.remove('is-paused');
  pill.classList.add('is-active');

  if (dom.speechPillPrimary) {
    dom.speechPillPrimary.textContent = 'Speaking response';
  }

  if (dom.speechPillSecondary) {
    let voiceLabel = 'Atlas Voice';
    if (selectedVoice && selectedVoice.name) {
      const clean = selectedVoice.name
        .replace(/(Microsoft|Google|Apple|Desktop|Natural|Online \(Natural\))\s*/gi, '')
        .trim();
      voiceLabel = clean.length > 0 ? clean : selectedVoice.name;
    }
    dom.speechPillSecondary.textContent = voiceLabel;
  }

  updatePauseBtnIcon(false);
}

/**
 * Brief dynamic intensity surge on word boundaries for organic voice reactivity.
 */
function triggerWaveSurge() {
  const freq = dom.speechPillFrequency;
  if (!freq || isManuallyPaused) return;

  freq.classList.add('is-surging');
  if (surgeTimeout) clearTimeout(surgeTimeout);
  surgeTimeout = setTimeout(() => {
    freq.classList.remove('is-surging');
  }, 120);
}

/**
 * Updates visual paused state on pill and frequency waves.
 */
function updatePillPausedState(isPaused) {
  const pill = dom.speechResponsePill;
  if (!pill) return;

  if (isPaused) {
    pill.classList.add('is-paused');
    if (dom.speechPillPrimary) dom.speechPillPrimary.textContent = 'Paused';
    updatePauseBtnIcon(true);
  } else {
    pill.classList.remove('is-paused');
    if (dom.speechPillPrimary) dom.speechPillPrimary.textContent = 'Speaking response';
    updatePauseBtnIcon(false);
  }
}

/**
 * Updates the pause/resume icon in the pill controls.
 */
function updatePauseBtnIcon(isPaused) {
  const btn = dom.speechPillPauseBtn;
  if (!btn) return;

  const pauseSvg = btn.querySelector('.speech-pause-svg');
  const playSvg = btn.querySelector('.speech-play-svg');
  if (pauseSvg && playSvg) {
    pauseSvg.style.display = isPaused ? 'none' : 'block';
    playSvg.style.display = isPaused ? 'block' : 'none';
  }
  btn.title = isPaused ? 'Resume speech' : 'Pause speech';
  btn.setAttribute('aria-label', isPaused ? 'Resume speech' : 'Pause speech');
}

/**
 * Clears speech tracking and animates out the pill dock.
 */
function cleanupSpeechState() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (surgeTimeout) {
    clearTimeout(surgeTimeout);
    surgeTimeout = null;
  }

  activeUtterance = null;
  isManuallyPaused = false;
  resetActiveSourceButton();

  state.isReadingResponse = false;

  const pill = dom.speechResponsePill;
  if (pill) {
    pill.classList.remove('is-active', 'is-paused');
    setTimeout(() => {
      if (!state.isReadingResponse) {
        pill.hidden = true;
      }
    }, 280);
  }
}

/**
 * Resets the active message speak button state.
 */
function resetActiveSourceButton() {
  if (state.activeSpeechButton) {
    state.activeSpeechButton.classList.remove('is-speaking');
    state.activeSpeechButton.title = 'Speak response';
    state.activeSpeechButton.innerHTML = ICONS.speaker || 'Speak';
    state.activeSpeechButton = null;
  }
}
