/**
 * session-manager.js
 * Investigation session CRUD operations, date categorization, history tree rendering,
 * real-time token estimator, and AI session title generation.
 */

import { state } from '../state/store.js';
import { dom } from './dom.js';
import { ICONS, INVESTIGATION_MODES, API_BASE } from '../config/constants.js';
import { escapeHtml } from '../markdown/parser.js';
import { selectMode } from './theme.js';

let renderSessionMessagesCallback = null;

export function setRenderSessionMessagesCallback(fn) {
  renderSessionMessagesCallback = fn;
}

export function closeMobileSidebar() {
  if (dom.sidebar) dom.sidebar.classList.remove('open');
  if (dom.sidebarBackdrop) dom.sidebarBackdrop.classList.remove('show');
}

export function getActiveSession() {
  return state.sessions.find(s => s.id === state.activeSessionId);
}

export function saveSessions() {
  const validSessions = state.sessions.filter(s => s && Array.isArray(s.messages) && s.messages.length > 0);
  localStorage.setItem('atlas_investigations', JSON.stringify(validSessions));
}

export function updateSessionMetrics() {
  const session = getActiveSession();
  const count = session ? session.messages.length : 0;
  if (dom.sessionMetricBadge) {
    dom.sessionMetricBadge.textContent = `${count} msg${count === 1 ? '' : 's'}`;
  }
}

export function updateContextEstimator() {
  if (!dom.contextTokenEstimator) return;
  const session = getActiveSession();
  let totalChars = 0;
  if (session && Array.isArray(session.messages)) {
    for (const m of session.messages) {
      totalChars += (m.content ? m.content.length : 0);
      if (m.reasoning) totalChars += m.reasoning.length;
    }
  }
  if (Array.isArray(state.projectFiles)) {
    for (const f of state.projectFiles) {
      totalChars += (f.content ? f.content.length : 0);
    }
  }
  if (dom.messageInput && dom.messageInput.value) {
    totalChars += dom.messageInput.value.length;
  }

  const estimatedTokens = Math.round(totalChars / 4);
  if (estimatedTokens >= 1000000) {
    dom.contextTokenEstimator.textContent = `~${(estimatedTokens / 1000000).toFixed(1)}M tokens`;
  } else if (estimatedTokens >= 1000) {
    dom.contextTokenEstimator.textContent = `~${(estimatedTokens / 1000).toFixed(1)}k tokens`;
  } else {
    dom.contextTokenEstimator.textContent = `~${estimatedTokens} tokens`;
  }
}

export function getSessionDateCategory(session) {
  const rawDate = session.createdAt || session.updatedAt;
  if (!rawDate) return 'previous';

  const sessionDate = new Date(rawDate);
  if (isNaN(sessionDate.getTime())) return 'previous';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const itemDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

  if (itemDay.getTime() === today.getTime()) {
    return 'today';
  } else if (itemDay.getTime() === yesterday.getTime()) {
    return 'yesterday';
  }
  return 'previous';
}

export function createNewSession() {
  const active = getActiveSession();
  if (active && (!active.messages || active.messages.length === 0)) {
    if (renderSessionMessagesCallback) renderSessionMessagesCallback(active);
    updateSessionMetrics();
    if (dom.messageInput) dom.messageInput.focus();
    if (window.innerWidth <= 768) closeMobileSidebar();
    return;
  }

  // Clean up any empty sessions
  state.sessions = state.sessions.filter(s => s && Array.isArray(s.messages) && s.messages.length > 0);

  const newSession = {
    id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    title: 'New Session',
    mode: state.activeMode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  };

  state.sessions.unshift(newSession);
  state.activeSessionId = newSession.id;
  saveSessions();
  renderHistoryTree();
  if (renderSessionMessagesCallback) renderSessionMessagesCallback(newSession);
  updateSessionMetrics();
  updateContextEstimator();

  if (dom.messageInput) dom.messageInput.focus();
  if (window.innerWidth <= 768) {
    closeMobileSidebar();
  }
}

export function loadSession(sessionId) {
  const session = state.sessions.find(s => s.id === sessionId);
  if (!session) return;

  state.activeSessionId = sessionId;
  if (session.mode && INVESTIGATION_MODES[session.mode]) {
    selectMode(session.mode);
  }

  renderHistoryTree();
  if (renderSessionMessagesCallback) renderSessionMessagesCallback(session);
  updateSessionMetrics();
  updateContextEstimator();

  if (dom.messageInput) dom.messageInput.focus();
}

export function deleteSession(sessionId) {
  state.sessions = state.sessions.filter(s => s.id !== sessionId);
  saveSessions();
  const remainingValid = state.sessions.filter(s => s.messages && s.messages.length > 0);
  if (state.activeSessionId === sessionId) {
    if (remainingValid.length > 0) loadSession(remainingValid[0].id);
    else createNewSession();
  } else {
    renderHistoryTree();
  }
}

export function renderHistoryTree(searchQuery = '') {
  if (!dom.historyListToday || !dom.historyListYesterday || !dom.historyListPrevious) return;

  if (dom.historyListPinned) dom.historyListPinned.innerHTML = '';
  dom.historyListToday.innerHTML = '';
  dom.historyListYesterday.innerHTML = '';
  dom.historyListPrevious.innerHTML = '';

  const query = searchQuery.toLowerCase();
  const validSessions = state.sessions.filter(s => s && Array.isArray(s.messages) && s.messages.length > 0);
  const filtered = validSessions.filter(s => {
    const title = s.title || s.messages.find(m => m.role === 'user' && m.content)?.content || 'New Session';
    return !query || title.toLowerCase().includes(query) || (s.messages && s.messages.some(m => m.content && m.content.toLowerCase().includes(query)));
  });

  if (filtered.length === 0) {
    if (dom.emptyHistoryState) dom.emptyHistoryState.style.display = 'block';
    if (dom.historyGroupPinned) dom.historyGroupPinned.style.display = 'none';
    if (dom.historyGroupToday) dom.historyGroupToday.style.display = 'none';
    if (dom.historyGroupYesterday) dom.historyGroupYesterday.style.display = 'none';
    if (dom.historyGroupPrevious) dom.historyGroupPrevious.style.display = 'none';
    return;
  }
  if (dom.emptyHistoryState) dom.emptyHistoryState.style.display = 'none';

  filtered.forEach(session => {
    let targetList = dom.historyListPrevious;
    if (session.isPinned && dom.historyListPinned) {
      targetList = dom.historyListPinned;
    } else {
      const category = getSessionDateCategory(session);
      if (category === 'today') targetList = dom.historyListToday;
      else if (category === 'yesterday') targetList = dom.historyListYesterday;
    }

    const item = document.createElement('div');
    item.className = `history-item ${session.id === state.activeSessionId ? 'active' : ''}`;
    const sessionTitle = session.title || session.messages.find(m => m.role === 'user' && m.content)?.content || 'New Session';

    item.innerHTML = `
      <span class="history-item-title" title="${escapeHtml(sessionTitle)}">${escapeHtml(sessionTitle.slice(0, 60))}</span>
      <div class="history-item-actions">
        <button class="history-item-pin-btn ${session.isPinned ? 'pinned' : ''}" title="${session.isPinned ? 'Unpin session' : 'Pin session'}" aria-label="Pin">
          ${ICONS.pin || 'Pin'}
        </button>
        <button class="history-item-rename-btn" title="Rename" aria-label="Rename">
          ${ICONS.edit || 'Rename'}
        </button>
        <button class="history-item-del-btn" title="Delete" aria-label="Delete">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `;

    const titleSpan = item.querySelector('.history-item-title');
    const startRename = () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'history-item-rename-input';
      input.value = session.title || sessionTitle;
      titleSpan.replaceWith(input);
      input.focus();
      input.select();

      let isSaved = false;
      const saveRename = () => {
        if (isSaved) return;
        isSaved = true;
        const newTitle = input.value.trim();
        if (newTitle) {
          session.title = newTitle;
          saveSessions();
        }
        renderHistoryTree(searchQuery);
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveRename();
        } else if (e.key === 'Escape') {
          isSaved = true;
          renderHistoryTree(searchQuery);
        }
      });
      input.addEventListener('blur', saveRename);
    };

    titleSpan.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startRename();
    });

    item.querySelector('.history-item-rename-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      startRename();
    });

    item.querySelector('.history-item-pin-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      session.isPinned = !session.isPinned;
      saveSessions();
      renderHistoryTree(searchQuery);
    });

    item.querySelector('.history-item-del-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSession(session.id);
    });

    item.addEventListener('click', (e) => {
      if (!e.target.closest('.history-item-actions') && !e.target.closest('.history-item-rename-input')) {
        loadSession(session.id);
        if (window.innerWidth <= 768) closeMobileSidebar();
      }
    });

    targetList.appendChild(item);
  });

  if (dom.historyGroupPinned) dom.historyGroupPinned.style.display = (dom.historyListPinned && dom.historyListPinned.children.length > 0) ? 'block' : 'none';
  if (dom.historyGroupToday) dom.historyGroupToday.style.display = dom.historyListToday.children.length > 0 ? 'block' : 'none';
  if (dom.historyGroupYesterday) dom.historyGroupYesterday.style.display = dom.historyListYesterday.children.length > 0 ? 'block' : 'none';
  if (dom.historyGroupPrevious) dom.historyGroupPrevious.style.display = dom.historyListPrevious.children.length > 0 ? 'block' : 'none';
}

export async function fetchSessionTitle(userPrompt, sessionId) {
  try {
    const res = await fetch(`${API_BASE}/api/title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(state.apiKey ? { 'X-OpenRouter-Key': state.apiKey } : {})
      },
      body: JSON.stringify({
        message: userPrompt,
        model: state.currentModel,
        apiKey: state.apiKey || undefined
      })
    });
    if (!res.ok) throw new Error(`Title request failed with status ${res.status}`);
    const data = await res.json();
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    if (title) {
      const session = state.sessions.find(s => s.id === sessionId);
      if (session) {
        session.title = title;
        saveSessions();
        renderHistoryTree();
      }
    }
  } catch (e) {}
}
