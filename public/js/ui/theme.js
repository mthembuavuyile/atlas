/**
 * theme.js
 * Theme management, dynamic greetings engine, investigation mode selector,
 * model dropdown rendering, and backend health validation.
 */

import { state } from '../state/store.js';
import { dom } from './dom.js';
import { INVESTIGATION_MODES, FREE_MODELS, getModelIcon, API_BASE } from '../config/constants.js';
import { escapeHtml } from '../markdown/parser.js';

export function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('omni_theme', theme);

  dom.themeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme-val') === theme);
  });
}

export function formatBadge(badge) {
  return String(badge || '').replace(/\s*FREE\s*/gi, '').trim() || 'PRO';
}

export function updateDynamicGreeting(modeId) {
  if (!dom.dynamicTimeGreeting) return;
  const hour = new Date().getHours();
  let salutation = 'Good evening';
  let isLateNight = false;

  if (hour >= 5 && hour < 12) {
    salutation = 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    salutation = 'Good afternoon';
  } else if (hour >= 17 && hour < 22) {
    salutation = 'Good evening';
  } else {
    salutation = 'Working late?';
    isLateNight = true;
  }

  dom.dynamicTimeGreeting.textContent = salutation;

  const punctElem = document.getElementById('greetingPunct');
  if (punctElem) {
    punctElem.textContent = isLateNight ? '' : ',';
  }

  const actionElem = document.getElementById('dynamicGreetingAction');
  if (actionElem) {
    const targetModeId = modeId || state.activeMode;
    const mode = (targetModeId && INVESTIGATION_MODES[targetModeId]) ? INVESTIGATION_MODES[targetModeId] : null;
    if (mode && mode.actionHint) {
      actionElem.textContent = isLateNight
        ? `Let's investigate: ${mode.actionHint}`
        : mode.actionHint;
    } else {
      if (isLateNight) {
        actionElem.textContent = "Let's work through it together.";
      } else if (hour >= 5 && hour < 9) {
        actionElem.textContent = 'what would you like to work on today?';
      } else if (hour >= 9 && hour < 12) {
        actionElem.textContent = 'what would you like to work on today?';
      } else if (hour >= 12 && hour < 17) {
        actionElem.textContent = 'what challenge shall we tackle?';
      } else {
        actionElem.textContent = 'what would be useful to work through?';
      }
    }
  }
}

export function syncModeDisplay(modeId) {
  const mode = INVESTIGATION_MODES[modeId] || INVESTIGATION_MODES.auto;

  if (dom.modeSelectorGrid) {
    dom.modeSelectorGrid.querySelectorAll('.mode-card-pill').forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-mode') === mode.id);
    });
  }

  if (dom.activeModeTag) dom.activeModeTag.textContent = `Mode: ${mode.name}`;
  if (dom.activeModeDesc) dom.activeModeDesc.textContent = mode.desc;

  updateDynamicGreeting(mode.id);

  if (dom.suggestionPillsContainer && mode.suggestions) {
    dom.suggestionPillsContainer.innerHTML = '';
    mode.suggestions.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'prompt-card suggestion-pill';
      btn.setAttribute('data-prompt', item.prompt);
      btn.textContent = item.label;
      btn.addEventListener('click', () => {
        if (dom.messageInput) {
          dom.messageInput.value = item.prompt;
          dom.messageInput.style.height = 'auto';
          dom.messageInput.style.height = `${Math.min(dom.messageInput.scrollHeight, 200)}px`;
          dom.messageInput.focus();
        }
      });
      dom.suggestionPillsContainer.appendChild(btn);
    });
  }
}

export function selectMode(modeId) {
  if (!INVESTIGATION_MODES[modeId]) return;
  state.activeMode = modeId;
  localStorage.setItem('atlas_mode', modeId);
  syncModeDisplay(modeId);

  const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
  if (activeSession && activeSession.messages && activeSession.messages.length === 0) {
    activeSession.mode = modeId;
    const valid = state.sessions.filter(s => s && Array.isArray(s.messages) && s.messages.length > 0);
    localStorage.setItem('atlas_investigations', JSON.stringify(valid));
  }
}

export function initInvestigationModes() {
  syncModeDisplay(state.activeMode);

  dom.modeSelectorGrid?.querySelectorAll('.mode-card-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const modeId = pill.getAttribute('data-mode');
      selectMode(modeId);
    });
  });
}

export function syncModelDisplay(modelId) {
  const model = state.models.find(m => m.id === modelId) || FREE_MODELS[0];
  if (dom.modelCurrentName) dom.modelCurrentName.textContent = model.name;
  if (dom.modelPillBadge) dom.modelPillBadge.textContent = formatBadge(model.badge);
  if (dom.hintModelName) dom.hintModelName.textContent = model.id;
  if (dom.modelSparkIcon) dom.modelSparkIcon.innerHTML = getModelIcon(model.id);
}

export function selectModel(modelId) {
  state.currentModel = modelId;
  localStorage.setItem('omni_model', modelId);
  syncModelDisplay(modelId);
  renderModelOptions();
}

export function renderModelOptions() {
  if (!dom.modelOptionsList) return;
  dom.modelOptionsList.innerHTML = '';

  state.models.forEach(model => {
    const item = document.createElement('div');
    item.className = `model-option-item ${model.id === state.currentModel ? 'selected' : ''}`;
    item.innerHTML = `
      <div class="model-option-title">
        <span style="display: flex; align-items: center; gap: 6px;">
          ${getModelIcon(model.id)}
          <span>${escapeHtml(model.name)}</span>
        </span>
        <span class="model-pill-badge">${formatBadge(model.badge)}</span>
      </div>
      <div class="model-option-desc">${escapeHtml(model.description || model.desc || '')}</div>
    `;

    item.addEventListener('click', () => {
      selectModel(model.id);
      const menu = document.getElementById('modelDropdownMenu');
      if (menu) menu.classList.remove('show');
    });

    dom.modelOptionsList.appendChild(item);
  });
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const mRes = await fetch(`${API_BASE}/api/models`);
    const mData = await mRes.json();
    if (mData.models && Array.isArray(mData.models) && mData.models.length > 0) {
      state.models = mData.models;
      renderModelOptions();
      syncModelDisplay(state.currentModel);
    }
  } catch (err) {
    console.warn('Backend offline:', err);
  }
}
