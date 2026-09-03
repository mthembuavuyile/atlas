/**
 * message-renderer.js
 * Message bubble rendering, reasoning accordion, status animations,
 * LaTeX/KaTeX enhancement, code block mount points, and feed autoscroll.
 */

import { state } from '../state/store.js';
import { dom } from './dom.js';
import { ICONS, INVESTIGATION_STATUS_TERMS } from '../config/constants.js';
import { parseMarkdownSafely, enhanceCodeBlocks, renderMathSafely, escapeHtml } from '../markdown/parser.js';
import { openCodeInCanvas } from './canvas.js';
import { updateDynamicGreeting } from './theme.js';
import { getActiveSession, saveSessions, updateSessionMetrics, updateContextEstimator } from './session-manager.js';

let regenerateCallback = null;

export function setRegenerateCallback(fn) {
  regenerateCallback = fn;
}

export function scrollToBottom(force = false) {
  if (!dom.messagesContainer) return;
  const distanceFromBottom = dom.messagesContainer.scrollHeight - dom.messagesContainer.scrollTop - dom.messagesContainer.clientHeight;
  if (force || distanceFromBottom < 150) {
    dom.messagesContainer.scrollTop = dom.messagesContainer.scrollHeight;
  }
}

export function startStatusAnimation(bubble, modeId) {
  const terms = INVESTIGATION_STATUS_TERMS[modeId] || INVESTIGATION_STATUS_TERMS.default;
  let stepIndex = 0;

  const loader = document.createElement('div');
  loader.className = 'bubble-status-loader';
  loader.innerHTML = `<span class="status-spinner"></span><span class="bubble-status-text">${escapeHtml(terms[0])}</span>`;
  bubble.innerHTML = '';
  bubble.appendChild(loader);

  const textElem = loader.querySelector('.bubble-status-text');

  const intervalId = setInterval(() => {
    stepIndex = (stepIndex + 1) % terms.length;
    const currentTerm = terms[stepIndex];
    if (textElem && textElem.isConnected) {
      textElem.style.opacity = '0';
      setTimeout(() => {
        if (textElem && textElem.isConnected) {
          textElem.textContent = currentTerm;
          textElem.style.opacity = '1';
        }
      }, 150);
    }
  }, 2000);

  return {
    stop: () => {
      clearInterval(intervalId);
      if (loader.parentNode === bubble) {
        loader.remove();
      }
    }
  };
}

export function renderMessageItem(role, content = '', reasoning = '', shouldScroll = true, widgets = [], attachments = []) {
  if (dom.welcomeScreen && dom.welcomeScreen.parentNode) {
    dom.welcomeScreen.style.display = 'none';
  }

  const row = document.createElement('div');
  row.className = `message-row ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'user' ? 'U' : 'A';

  const wrapper = document.createElement('div');
  wrapper.className = 'message-content-wrapper';

  let reasoningDetails = null;
  let reasoningBody = null;

  function setReasoning(text) {
    if (!text || !text.trim()) return;
    if (!reasoningDetails) {
      reasoningDetails = document.createElement('details');
      reasoningDetails.className = 'reasoning-accordion';
      reasoningDetails.open = true;
      reasoningDetails.innerHTML = `
        <summary>Thought Process</summary>
        <div class="reasoning-body"></div>
      `;
      wrapper.insertBefore(reasoningDetails, wrapper.firstChild);
      reasoningBody = reasoningDetails.querySelector('.reasoning-body');
    }
    if (reasoningBody) {
      reasoningBody.textContent = text;
    }
  }

  if (role === 'assistant' && reasoning) {
    setReasoning(reasoning);
  }

  const widgetsContainer = document.createElement('div');
  widgetsContainer.className = 'message-widgets-container';
  wrapper.appendChild(widgetsContainer);

  if (Array.isArray(widgets) && widgets.length > 0) {
    widgets.forEach(w => {
      if (window.atlasRenderWidget) {
        const wHtml = window.atlasRenderWidget(w.type, w.data);
        if (wHtml) {
          const wBox = document.createElement('div');
          wBox.className = 'widget-mount-point';
          wBox.innerHTML = wHtml;
          widgetsContainer.appendChild(wBox);
        }
      }
    });
  }

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.innerHTML = parseMarkdownSafely(content, false);

  enhanceCodeBlocks(bubble, openCodeInCanvas);
  renderMathSafely(bubble);
  wrapper.appendChild(bubble);

  if (role === 'user' && Array.isArray(attachments) && attachments.length > 0) {
    const attachmentBlock = document.createElement('div');
    attachmentBlock.className = 'message-attachments';
    attachmentBlock.innerHTML = `
      <div class="message-attachments-heading">
        <span class="message-attachments-icon" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h3l2 2h6A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"></path></svg>
        </span>
        <span>${attachments.length} attached file${attachments.length === 1 ? '' : 's'}</span>
      </div>
      <div class="message-attachments-list"></div>
    `;
    const attachmentList = attachmentBlock.querySelector('.message-attachments-list');
    attachments.slice(0, 5).forEach(attachment => {
      const fileName = document.createElement('span');
      fileName.className = 'message-attachment-name';
      fileName.textContent = attachment.path || 'Attached file';
      attachmentList.appendChild(fileName);
    });
    if (attachments.length > 5) {
      const remaining = document.createElement('span');
      remaining.className = 'message-attachment-more';
      remaining.textContent = `+${attachments.length - 5} more`;
      attachmentList.appendChild(remaining);
    }
    wrapper.insertBefore(attachmentBlock, bubble);
  }

  if (role === 'user') {
    const userActions = document.createElement('div');
    userActions.className = 'user-message-actions';

    const copyUserBtn = document.createElement('button');
    copyUserBtn.className = 'user-action-btn';
    copyUserBtn.innerHTML = `${ICONS.copy} Copy`;
    copyUserBtn.title = 'Copy prompt';
    copyUserBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(content);
        copyUserBtn.innerHTML = `${ICONS.check} Copied`;
        setTimeout(() => { copyUserBtn.innerHTML = `${ICONS.copy} Copy`; }, 1500);
      } catch (e) {
        console.warn('Clipboard write failed', e);
      }
    });

    const editUserBtn = document.createElement('button');
    editUserBtn.className = 'user-action-btn';
    editUserBtn.innerHTML = `${ICONS.edit} Edit`;
    editUserBtn.title = 'Edit prompt and re-run';
    editUserBtn.addEventListener('click', () => {
      if (state.isGenerating) return;
      const session = getActiveSession();
      if (!session) return;
      const msgIdx = session.messages.findIndex(m => m.role === 'user' && m.content === content);
      if (msgIdx >= 0) {
        if (dom.messageInput) {
          dom.messageInput.value = content;
          dom.messageInput.style.height = 'auto';
          dom.messageInput.style.height = `${Math.min(dom.messageInput.scrollHeight, 200)}px`;
          dom.messageInput.focus();
        }
        session.messages = session.messages.slice(0, msgIdx);
        saveSessions();
        renderSessionMessages(session);
        updateSessionMetrics();
        updateContextEstimator();
      }
    });

    userActions.appendChild(copyUserBtn);
    userActions.appendChild(editUserBtn);
    wrapper.appendChild(userActions);
  }

  if (role === 'assistant') {
    const actionsBar = document.createElement('div');
    actionsBar.className = 'message-actions-bar';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'action-btn copy-btn';
    copyBtn.innerHTML = ICONS.copy || 'Copy';
    copyBtn.title = 'Copy response';

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(bubble.innerText);
        copyBtn.innerHTML = ICONS.check || 'Copied';
        setTimeout(() => { copyBtn.innerHTML = ICONS.copy || 'Copy'; }, 2000);
      } catch (e) {
        console.warn('Clipboard write failed', e);
      }
    });

    const speakBtn = document.createElement('button');
    speakBtn.className = 'action-btn speak-btn';
    speakBtn.innerHTML = ICONS.speaker || 'Speak';
    speakBtn.title = 'Speak response';

    const setSpeechButtonState = (isSpeaking) => {
      speakBtn.classList.toggle('is-speaking', isSpeaking);
      speakBtn.title = isSpeaking ? 'Stop reading response' : 'Speak response';
      speakBtn.innerHTML = isSpeaking ? (ICONS.stop || 'Stop') : (ICONS.speaker || 'Speak');
    };

    speakBtn.addEventListener('click', () => {
      if (!('speechSynthesis' in window)) return;

      if (state.isReadingResponse && state.activeSpeechButton === speakBtn) {
        window.speechSynthesis.cancel();
        state.isReadingResponse = false;
        state.activeSpeechButton = null;
        setSpeechButtonState(false);
        return;
      }

      if (state.activeSpeechButton && state.activeSpeechButton !== speakBtn) {
        state.activeSpeechButton.innerHTML = ICONS.speaker || 'Speak';
        state.activeSpeechButton.title = 'Speak response';
        state.activeSpeechButton.classList.remove('is-speaking');
      }

      const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      const selectedVoice = voices.find(v => v.name === state.defaultVoiceName)
        || voices.find(v => v.name.toLowerCase() === (state.defaultVoiceName || '').toLowerCase())
        || voices.find(v => v.default)
        || voices[0]
        || null;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(bubble.innerText);
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => {
        if (state.activeSpeechButton === speakBtn) {
          state.isReadingResponse = false;
          state.activeSpeechButton = null;
          setSpeechButtonState(false);
        }
      };
      utterance.onerror = () => {
        if (state.activeSpeechButton === speakBtn) {
          state.isReadingResponse = false;
          state.activeSpeechButton = null;
          setSpeechButtonState(false);
        }
      };

      state.isReadingResponse = true;
      state.activeSpeechButton = speakBtn;
      setSpeechButtonState(true);
      window.speechSynthesis.speak(utterance);
    });

    const regenBtn = document.createElement('button');
    regenBtn.className = 'action-btn regenerate-btn';
    regenBtn.innerHTML = ICONS.regenerate || 'Retry';
    regenBtn.title = 'Regenerate response';
    regenBtn.addEventListener('click', () => {
      if (state.isGenerating) return;
      if (typeof regenerateCallback === 'function') {
        regenerateCallback();
      }
    });

    actionsBar.appendChild(copyBtn);
    actionsBar.appendChild(speakBtn);
    actionsBar.appendChild(regenBtn);
    wrapper.appendChild(actionsBar);
  }

  row.appendChild(avatar);
  row.appendChild(wrapper);

  dom.messagesContainer.appendChild(row);

  if (shouldScroll) {
    scrollToBottom(true);
  }

  return { row, bubble, wrapper, widgetsContainer, setReasoning };
}

export function renderSessionMessages(session) {
  if (!dom.messagesContainer) return;
  dom.messagesContainer.innerHTML = '';

  if (!session || !session.messages || session.messages.length === 0) {
    if (dom.welcomeScreen) {
      dom.messagesContainer.appendChild(dom.welcomeScreen);
      dom.welcomeScreen.style.display = 'flex';
      updateDynamicGreeting(state.activeMode);
    }
    return;
  }

  if (dom.welcomeScreen && dom.welcomeScreen.parentNode) {
    dom.welcomeScreen.style.display = 'none';
  }

  session.messages.forEach(msg => {
    renderMessageItem(msg.role, msg.content, msg.reasoning, false, msg.widgets || [], msg.attachments || []);
  });

  scrollToBottom(true);
}
