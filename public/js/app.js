/**
 * Atlas — Scientific Intelligence Platform by Vylex Technologies
 * https://vylex.co.za
 * Technical Reasoning · Multi-Model Deliberation · Action Execution Layer
 */

import { state } from './state/store.js';
import { dom } from './ui/dom.js';
import { configureMarked } from './markdown/parser.js';
import {
  applyTheme,
  initInvestigationModes,
  renderModelOptions,
  syncModelDisplay,
  checkBackendHealth,
  updateDynamicGreeting
} from './ui/theme.js';
import {
  getActiveSession,
  saveSessions,
  updateSessionMetrics,
  updateContextEstimator,
  createNewSession,
  loadSession,
  renderHistoryTree,
  fetchSessionTitle,
  setRenderSessionMessagesCallback
} from './ui/session-manager.js';
import {
  renderSessionMessages,
  setRegenerateCallback
} from './ui/message-renderer.js';
import { initCanvas } from './ui/canvas.js';
import {
  initModals,
  loadSavedSettings,
  autoResizeTextarea,
  openUnifiedSettings,
  toggleShortcutsModal
} from './ui/modals.js';
import { initVoiceDictation } from './audio/voice.js';
import {
  executeChatTurn,
  regenerateLastResponse,
  initChatService
} from './services/chat-service.js';

// Connect circular UI callbacks
setRenderSessionMessagesCallback(renderSessionMessages);
setRegenerateCallback(regenerateLastResponse);

const availableSlashCommands = [
  { cmd: '/web', desc: 'Search the web for current information', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>' },
  { cmd: '/image', desc: 'Search visual references', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>' },
  { cmd: '/analyze', desc: 'Deep analysis of uploaded files', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' },
  { cmd: '/code', desc: 'Generate advanced codebase', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>' },
  { cmd: '/reddit', desc: 'Search Reddit discussions', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
  { cmd: '/crypto', desc: 'Check live crypto prices', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 6v2"/><path d="M12 16v2"/></svg>' },
  { cmd: '/weather', desc: 'Get local weather forecasts', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>' },
  { cmd: '/news', desc: 'Get latest general headlines', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>' },
  { cmd: '/space', desc: 'Get space and NASA intelligence', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 3-2 3s1.74-.5 3-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>' },
  { cmd: '/math', desc: 'Solve mathematical equations', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>' },
  { cmd: '/convert', desc: 'Convert currency values', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>' },
  { cmd: '/unit', desc: 'Convert measurements', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>' },
  { cmd: '/time', desc: 'Resolve live time and date', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
  { cmd: '/places', desc: 'Search places and landmarks', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' },
  { cmd: '/define', desc: 'Get precise dictionary definitions', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>' },
  { cmd: '/bible', desc: 'Look up Bible verses', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M12 8v6"/><path d="M10 10h4"/></svg>' },
  { cmd: '/joke', desc: 'Hear a joke or humor', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>' },
  { cmd: '/advice', desc: 'Get wisdom and advice', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>' },
  { cmd: '/qr', desc: 'Generate branded QR code', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01"></path></svg>' },
  { cmd: '/scanqr', desc: 'Scan QR code via camera or file', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01"></path></svg>' },
  { cmd: '/ocr', desc: 'Extract text from images', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>' },
  { cmd: '/clear', desc: 'Clear conversation history', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>' },
  { cmd: '/exit', desc: 'Exit to new session', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>' },
  { cmd: '/settings', desc: 'Open unified settings', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>' },
  { cmd: '/shortcuts', desc: 'Show keyboard shortcuts', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="8" x2="6.01" y2="8"></line><line x1="10" y1="8" x2="10.01" y2="8"></line><line x1="14" y1="8" x2="14.01" y2="8"></line><line x1="18" y1="8" x2="18.01" y2="8"></line><line x1="6" y1="12" x2="6.01" y2="12"></line><line x1="18" y1="12" x2="18.01" y2="12"></line><line x1="7" y1="16" x2="17" y2="16"></line></svg>' }
];

let slashSelectedIndex = 0;

function updateSlashCommandSelection(items) {
  items.forEach((item, index) => {
    if (index === slashSelectedIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

function handleSlashCommandInput() {
  if (!dom.messageInput) return;
  const val = dom.messageInput.value;
  const popup = document.getElementById('slashCommandsPopup');
  if (!popup) return;

  if (val.startsWith('/')) {
    const query = val.toLowerCase();
    const filtered = availableSlashCommands.filter(c => c.cmd.startsWith(query));

    if (filtered.length > 0) {
      popup.innerHTML = '';
      filtered.forEach((cmd, idx) => {
        const item = document.createElement('div');
        item.className = 'slash-command-item' + (idx === 0 ? ' selected' : '');
        item.innerHTML = `
          <div class="slash-command-icon">${cmd.icon}</div>
          <div class="slash-command-info">
            <span class="slash-command-name">${cmd.cmd}</span>
            <span class="slash-command-desc">${cmd.desc}</span>
          </div>
        `;
        item.addEventListener('click', () => {
          dom.messageInput.value = cmd.cmd + ' ';
          dom.messageInput.focus();
          popup.style.display = 'none';
        });
        item.addEventListener('mouseenter', () => {
          slashSelectedIndex = idx;
          updateSlashCommandSelection(popup.querySelectorAll('.slash-command-item'));
        });
        popup.appendChild(item);
      });
      slashSelectedIndex = 0;
      popup.style.display = 'flex';
    } else {
      popup.style.display = 'none';
    }
  } else {
    popup.style.display = 'none';
  }
}

async function handleChatSubmit(e) {
  if (e) e.preventDefault();
  if (!dom.messageInput) return;
  const prompt = dom.messageInput.value.trim();
  if (!prompt || state.isGenerating) return;

  if (prompt.toLowerCase().trim() === '/settings') {
    dom.messageInput.value = '';
    autoResizeTextarea();
    openUnifiedSettings();
    return;
  }

  if (prompt.toLowerCase().trim() === '/shortcuts') {
    dom.messageInput.value = '';
    autoResizeTextarea();
    toggleShortcutsModal(true);
    return;
  }

  if (prompt.toLowerCase().trim() === '/clear') {
    dom.messageInput.value = '';
    autoResizeTextarea();
    const session = getActiveSession();
    if (session && confirm('Clear all messages in this investigation?')) {
      session.messages = [];
      saveSessions();
      renderHistoryTree();
      loadSession(session.id);
    }
    return;
  }

  if (prompt.toLowerCase().trim() === '/exit') {
    dom.messageInput.value = '';
    autoResizeTextarea();
    createNewSession();
    return;
  }

  let session = getActiveSession();
  if (!session) {
    createNewSession();
    session = getActiveSession();
  }

  const attachedFiles = state.projectFiles && state.projectFiles.length ? [...state.projectFiles] : [];
  session.messages.push({
    role: 'user',
    content: prompt,
    attachments: attachedFiles
  });
  session.updatedAt = new Date().toISOString();
  state.lastUserPrompt = prompt;

  if (session.messages.filter(m => m.role === 'user').length === 1) {
    session.title = prompt.slice(0, 45) + (prompt.length > 45 ? '...' : '');
    fetchSessionTitle(prompt, session.id);
  }

  saveSessions();
  renderHistoryTree();
  renderSessionMessages(session);
  updateSessionMetrics();

  dom.messageInput.value = '';
  autoResizeTextarea();
  updateContextEstimator();

  executeChatTurn(session);
}

function initComposerListeners() {
  dom.chatForm?.addEventListener('submit', handleChatSubmit);
  dom.newChatBtn?.addEventListener('click', () => createNewSession());

  dom.historySearchInput?.addEventListener('input', (e) => {
    renderHistoryTree(e.target.value.trim());
  });

  dom.messageInput?.addEventListener('input', () => {
    autoResizeTextarea();
    handleSlashCommandInput();
    updateContextEstimator();
  });

  dom.messageInput?.addEventListener('keydown', (e) => {
    const popup = document.getElementById('slashCommandsPopup');
    const isPopupVisible = popup && popup.style.display === 'flex';

    if (isPopupVisible) {
      const items = popup.querySelectorAll('.slash-command-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        slashSelectedIndex = (slashSelectedIndex + 1) % items.length;
        updateSlashCommandSelection(items);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        slashSelectedIndex = (slashSelectedIndex - 1 + items.length) % items.length;
        updateSlashCommandSelection(items);
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[slashSelectedIndex]) {
          items[slashSelectedIndex].click();
        }
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        popup.style.display = 'none';
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!state.isGenerating && dom.messageInput.value.trim().length > 0) {
        dom.chatForm?.dispatchEvent(new Event('submit'));
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      createNewSession();
    }
  });
}

function init() {
  configureMarked();
  applyTheme(state.theme);
  renderHistoryTree();
  initInvestigationModes();
  renderModelOptions();
  syncModelDisplay(state.currentModel);
  loadSavedSettings();
  updateDynamicGreeting();

  initCanvas();
  initModals();
  initComposerListeners();
  initVoiceDictation();
  initChatService();

  updateContextEstimator();
  checkBackendHealth();

  if (state.sessions.length > 0) {
    loadSession(state.sessions[0].id);
  } else {
    createNewSession();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
