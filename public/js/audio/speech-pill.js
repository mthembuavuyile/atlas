/**
 * speech-pill.js
 * Floating speech playback pill with animated audio frequency waves.
 * Supports ElevenLabs Text-to-Speech API voices in addition to Google / Browser Web Speech synthesis,
 * with pause/resume, stop controls, and automatic fallback.
 */

import { state } from '../state/store.js';
import { dom } from '../ui/dom.js';
import { ICONS } from '../config/constants.js';

export const ELEVENLABS_VOICE_OPTIONS = [
  {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    value: 'elevenlabs:JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    label: 'ElevenLabs — George (Warm Narrative)'
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    value: 'elevenlabs:EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    label: 'ElevenLabs — Sarah (Soft & Clear)'
  },
  {
    id: 'onwK4e9ZLuTAKqWW03F9',
    value: 'elevenlabs:onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel',
    label: 'ElevenLabs — Daniel (Authoritative)'
  },
  {
    id: 'XB0fDUnXU5powFXDhCwa',
    value: 'elevenlabs:XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    label: 'ElevenLabs — Charlotte (Conversational)'
  },
  {
    id: 'XrExE9yKIg1WjnnlVkGX',
    value: 'elevenlabs:XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda',
    label: 'ElevenLabs — Matilda (Friendly & Articulate)'
  },
  {
    id: 'cjVigY5qzO86Huf0OWal',
    value: 'elevenlabs:cjVigY5qzO86Huf0OWal',
    name: 'Eric',
    label: 'ElevenLabs — Eric (Smooth & Balanced)'
  }
];

let activeUtterance = null;
let activeAudio = null;
let activeAudioUrl = null;
let activeAbortController = null;
let audioWaveInterval = null;
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
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isReadingResponse) {
        stopSpeakingResponse();
      }
    });
  }
}

/**
 * Cancels any ongoing ElevenLabs audio stream or Web Speech synthesis without hiding the pill immediately.
 */
function cancelActivePlaybackHandles() {
  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch (_) {}
    activeAbortController = null;
  }

  if (audioWaveInterval) {
    clearInterval(audioWaveInterval);
    audioWaveInterval = null;
  }

  if (activeAudio) {
    try {
      activeAudio.onplay = null;
      activeAudio.onpause = null;
      activeAudio.onended = null;
      activeAudio.onerror = null;
      activeAudio.pause();
      activeAudio.src = '';
    } catch (_) {}
    activeAudio = null;
  }

  if (activeAudioUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    try {
      URL.revokeObjectURL(activeAudioUrl);
    } catch (_) {}
    activeAudioUrl = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
  }
}

/**
 * Starts reading out an assistant message response using either ElevenLabs TTS or Browser/Google Speech.
 * @param {Object} options
 * @param {string} options.text - Text to read
 * @param {HTMLButtonElement} [options.sourceBtn] - Message speak action button
 * @param {string} [options.voiceName] - Custom voice override
 */
export function startSpeakingResponse({ text, sourceBtn = null, voiceName = '' }) {
  if (typeof window === 'undefined') return false;

  // If already speaking this exact message, toggle stop
  if (state.isReadingResponse && state.activeSpeechButton === sourceBtn && sourceBtn !== null) {
    stopSpeakingResponse();
    return true;
  }

  // Halt any previous playback without hiding immediately
  cancelActivePlaybackHandles();
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

  const targetVoiceName = voiceName || state.defaultVoiceName || '';

  if (targetVoiceName.startsWith('elevenlabs:')) {
    const voiceId = targetVoiceName.slice('elevenlabs:'.length).trim() || 'JBFqnCBsd6RMkjVDRZzb';
    const matchedVoice = ELEVENLABS_VOICE_OPTIONS.find(
      (v) => v.value === targetVoiceName || v.id === voiceId
    );
    const pillVoiceObj = {
      name: matchedVoice ? `ElevenLabs · ${matchedVoice.name}` : 'ElevenLabs Voice'
    };

    isManuallyPaused = false;
    state.isReadingResponse = true;
    state.activeSpeechButton = sourceBtn;

    if (sourceBtn) {
      sourceBtn.classList.add('is-speaking');
      sourceBtn.title = 'Stop reading response';
      sourceBtn.innerHTML = ICONS.stop || 'Stop';
    }

    showSpeechPill(pillVoiceObj);
    startElevenLabsPlayback(cleanText, voiceId, pillVoiceObj, sourceBtn);
    return true;
  }

  return startBrowserSpeechSynthesis(cleanText, targetVoiceName, sourceBtn);
}

/**
 * Streams MP3 audio from the backend ElevenLabs TTS endpoint and plays it in the speech pill.
 * Falls back to browser speech synthesis if the network or API quota is unavailable.
 */
async function startElevenLabsPlayback(cleanText, voiceId, pillVoiceObj, sourceBtn) {
  const controller = new AbortController();
  activeAbortController = controller;

  try {
    const response = await fetch('/api/tts/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText.slice(0, 4500),
        voiceId
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS HTTP ${response.status}`);
    }

    const audioBlob = await response.blob();
    if (controller.signal.aborted || !state.isReadingResponse) {
      return;
    }

    activeAudioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(activeAudioUrl);
    activeAudio = audio;

    audio.onplay = () => {
      showSpeechPill(pillVoiceObj);
      if (audioWaveInterval) clearInterval(audioWaveInterval);
      audioWaveInterval = setInterval(() => {
        if (activeAudio && !activeAudio.paused && !isManuallyPaused) {
          triggerWaveSurge();
        }
      }, 240);
    };

    audio.onpause = () => {
      if (activeAudio && !activeAudio.ended && state.isReadingResponse) {
        updatePillPausedState(true);
      }
    };

    audio.onended = () => {
      cleanupSpeechState();
    };

    audio.onerror = () => {
      console.warn('[Atlas Speech] ElevenLabs audio playback error; falling back to browser speech.');
      cancelActivePlaybackHandles();
      if (state.isReadingResponse) {
        startBrowserSpeechSynthesis(cleanText, '', sourceBtn);
      }
    };

    await audio.play();
  } catch (err) {
    if (err?.name === 'AbortError') return;
    console.warn('[Atlas Speech] ElevenLabs TTS unavailable, falling back to browser speech:', err?.message || err);
    cancelActivePlaybackHandles();
    if (state.isReadingResponse && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      startBrowserSpeechSynthesis(cleanText, '', sourceBtn);
    } else {
      cleanupSpeechState();
    }
  }
}

/**
 * Speaks response using the browser's built-in Web Speech API (Google / System voices).
 */
function startBrowserSpeechSynthesis(cleanText, targetVoiceName, sourceBtn) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    cleanupSpeechState();
    return false;
  }

  const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
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
  cancelActivePlaybackHandles();
  cleanupSpeechState();
}

/**
 * Pauses active speech synthesis or ElevenLabs audio.
 */
export function pauseSpeakingResponse() {
  if (activeAudio && !activeAudio.paused) {
    activeAudio.pause();
    isManuallyPaused = true;
    updatePillPausedState(true);
    return;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    isManuallyPaused = true;
    updatePillPausedState(true);
  }
}

/**
 * Resumes paused speech synthesis or ElevenLabs audio.
 */
export function resumeSpeakingResponse() {
  if (activeAudio && activeAudio.paused) {
    isManuallyPaused = false;
    updatePillPausedState(false);
    activeAudio.play().catch(() => {});
    return;
  }
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
  if (audioWaveInterval) {
    clearInterval(audioWaveInterval);
    audioWaveInterval = null;
  }
  if (surgeTimeout) {
    clearTimeout(surgeTimeout);
    surgeTimeout = null;
  }

  if (activeAudio) {
    try {
      activeAudio.onplay = null;
      activeAudio.onpause = null;
      activeAudio.onended = null;
      activeAudio.onerror = null;
      activeAudio.pause();
    } catch (_) {}
    activeAudio = null;
  }

  if (activeAudioUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    try {
      URL.revokeObjectURL(activeAudioUrl);
    } catch (_) {}
    activeAudioUrl = null;
  }

  activeAbortController = null;
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
