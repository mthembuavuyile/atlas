/**
 * modals.js
 * Modals controller: Unified Settings (Studio Parameters & General Preferences),
 * Keyboard Shortcuts dialog, Export/Import managers, and attachment popups.
 */

import { state } from '../state/store.js';
import { dom } from './dom.js';
import { PERSONA_PRESETS } from '../config/constants.js';
import { getActiveSession, saveSessions, loadSession, createNewSession, renderHistoryTree, closeMobileSidebar } from './session-manager.js';

export function toggleShortcutsModal(show) {
  if (!dom.shortcutsModal) return;
  const isVisible = dom.shortcutsModal.style.display === 'flex';
  const shouldShow = typeof show === 'boolean' ? show : !isVisible;
  dom.shortcutsModal.style.display = shouldShow ? 'flex' : 'none';
}

export function initKeyboardShortcuts() {
  dom.closeShortcutsModalBtn?.addEventListener('click', () => toggleShortcutsModal(false));
  dom.shortcutsModal?.addEventListener('click', (e) => {
    if (e.target === dom.shortcutsModal) toggleShortcutsModal(false);
  });

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      toggleShortcutsModal();
    } else if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      toggleShortcutsModal(true);
    } else if (e.key === 'Escape') {
      if (dom.shortcutsModal && dom.shortcutsModal.style.display === 'flex') {
        dom.shortcutsModal.style.display = 'none';
      }
    }
  });
}

export function populateVoiceOptions() {
  if (!dom.defaultVoiceSelect) return;

  const voices = typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.getVoices
    ? window.speechSynthesis.getVoices()
    : [];
  const currentValue = state.defaultVoiceName || '';

  dom.defaultVoiceSelect.innerHTML = '';

  const browserDefaultOption = document.createElement('option');
  browserDefaultOption.value = '';
  browserDefaultOption.textContent = 'Use browser default';
  dom.defaultVoiceSelect.appendChild(browserDefaultOption);

  voices.forEach(voice => {
    const option = document.createElement('option');
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    dom.defaultVoiceSelect.appendChild(option);
  });

  if (voices.length === 0) {
    const loadingOption = document.createElement('option');
    loadingOption.value = '';
    loadingOption.textContent = 'Voice list not ready yet';
    dom.defaultVoiceSelect.appendChild(loadingOption);
  }

  const selectedVoiceExists = voices.some(voice => voice.name === currentValue);
  dom.defaultVoiceSelect.value = selectedVoiceExists ? currentValue : '';
  if (dom.voiceStatusHint) {
    dom.voiceStatusHint.textContent = currentValue && !selectedVoiceExists
      ? 'Saved voice is unavailable in this browser. Choose another voice or use the browser default.'
      : '';
  }
}

export function openUnifiedSettings(defaultTab = 'studio-parameters') {
  if (dom.customSystemPrompt) dom.customSystemPrompt.value = state.systemPrompt;
  if (dom.temperatureSlider) dom.temperatureSlider.value = state.temperature;
  if (dom.tempValBadge) dom.tempValBadge.textContent = state.temperature;
  if (dom.presetPills) dom.presetPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-preset') === state.activePreset));

  if (dom.customApiKeyInput) dom.customApiKeyInput.value = state.apiKey || '';
  if (dom.apiKeyStatusHint) {
    dom.apiKeyStatusHint.style.display = state.apiKey ? 'block' : 'none';
    dom.apiKeyStatusHint.textContent = state.apiKey ? 'Custom key active in this browser.' : '';
  }
  if (dom.accountNameInput) dom.accountNameInput.value = (state.accountName || '').trim() || 'Your Name';
  populateVoiceOptions();

  const tabToSelect = Array.from(dom.settingsNavBtns).find(btn => btn.getAttribute('data-tab') === defaultTab);
  if (tabToSelect) {
    tabToSelect.click();
  }

  dom.unifiedSettingsModal?.classList.add('show');
}

export function closeUnifiedSettings() {
  dom.unifiedSettingsModal?.classList.remove('show');
}

export function updateActivePromptLabel() {
  if (!dom.activePromptLabel) return;
  const presetNames = {
    scientist: 'Scientist',
    mathematician: 'Math',
    engineer: 'Engineer',
    builder: 'Builder',
    reasoner: 'Reasoner',
    concise: 'Concise'
  };
  dom.activePromptLabel.textContent = presetNames[state.activePreset] || 'Personalization';
}

export function syncWebSearchUI() {
  if (!dom.webSearchToggleBtn) return;
  dom.webSearchToggleBtn.classList.toggle('active-web', state.isWebSearch);
  const webSearchLabel = document.getElementById('webSearchLabel');
  if (webSearchLabel) {
    webSearchLabel.textContent = state.isWebSearch ? 'Web Active' : 'Web Off';
  }
}

export function syncSidebarProfileUI() {
  const displayName = (state.accountName || '').trim() || 'Your Name';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || 'U';

  if (dom.sidebarProfileAvatar) dom.sidebarProfileAvatar.textContent = initials;
  if (dom.profileMenuAvatar) dom.profileMenuAvatar.textContent = initials;
  if (dom.profileMenuName) dom.profileMenuName.textContent = displayName;
  if (dom.accountNameInput) dom.accountNameInput.value = displayName;
}

export function syncProjectContextUI() {
  const fileCount = state.projectFiles.length;
  if (dom.projectContextBar) dom.projectContextBar.hidden = fileCount === 0;
  if (dom.projectContextLabel) {
    dom.projectContextLabel.textContent = fileCount
      ? `${fileCount} file${fileCount === 1 ? '' : 's'} attached for analysis`
      : 'Attached files';
  }
}

export function autoResizeTextarea() {
  if (!dom.messageInput) return;
  dom.messageInput.style.height = 'auto';
  dom.messageInput.style.height = Math.min(dom.messageInput.scrollHeight, 140) + 'px';
}

export function exportConversation(format) {
  const session = getActiveSession();
  if (!session || session.messages.length === 0) {
    alert('No messages to export.');
    return;
  }

  let dataStr = '';
  let filename = `atlas_investigation_${Date.now()}.${format}`;

  if (format === 'json') {
    dataStr = JSON.stringify(session, null, 2);
  } else {
    dataStr = `# ${session.title}\n\n*Exported from Atlas Reasoning Studio on ${new Date().toLocaleString()}*\n\n---\n\n`;
    session.messages.forEach(m => {
      dataStr += `### ${m.role.toUpperCase()}\n\n${m.content}\n\n`;
      if (m.reasoning) {
        dataStr += `> **Reasoning**:\n> ${m.reasoning.replace(/\n/g, '\n> ')}\n\n`;
      }
    });
  }

  const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export function loadSavedSettings() {
  syncWebSearchUI();
  syncSidebarProfileUI();
  updateActivePromptLabel();
  if (dom.deepThinkToggleBtn) {
    dom.deepThinkToggleBtn.classList.toggle('active-web', state.isDeepReasoning);
  }
}

export function initModals() {
  initKeyboardShortcuts();

  dom.sidebarCollapseBtn?.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      closeMobileSidebar();
    } else {
      dom.sidebar.classList.toggle('collapsed');
    }
  });

  dom.sidebarToggleBtn?.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      dom.sidebar.classList.toggle('mobile-open');
      dom.sidebarBackdrop.classList.toggle('active', dom.sidebar.classList.contains('mobile-open'));
    } else {
      dom.sidebar.classList.toggle('collapsed');
    }
  });

  dom.sidebarBackdrop?.addEventListener('click', closeMobileSidebar);

  dom.modelPillTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = document.getElementById('modelDropdownMenu');
    if (menu) menu.classList.toggle('show');
  });

  dom.exportMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('exportMenuPopup')?.classList.toggle('show');
  });

  dom.exportMarkdownBtn?.addEventListener('click', () => exportConversation('md'));
  dom.exportJsonBtn?.addEventListener('click', () => exportConversation('json'));
  dom.importJsonBtn?.addEventListener('click', () => {
    document.getElementById('exportMenuPopup')?.classList.remove('show');
    dom.importJsonFileInput?.click();
  });

  dom.importJsonFileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const importedList = Array.isArray(parsed)
          ? parsed
          : (parsed.sessions && Array.isArray(parsed.sessions) ? parsed.sessions : [parsed]);

        let importCount = 0;
        importedList.forEach(imp => {
          if (imp && (imp.messages || imp.title)) {
            const sessionObj = {
              id: imp.id || ('inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)),
              title: imp.title || 'Imported Session',
              mode: imp.mode || 'auto',
              isPinned: Boolean(imp.isPinned),
              createdAt: imp.createdAt || new Date().toISOString(),
              updatedAt: imp.updatedAt || new Date().toISOString(),
              messages: Array.isArray(imp.messages) ? imp.messages : []
            };

            const existingIdx = state.sessions.findIndex(s => s.id === sessionObj.id);
            if (existingIdx >= 0) {
              state.sessions[existingIdx] = sessionObj;
            } else {
              state.sessions.unshift(sessionObj);
            }
            importCount++;
          }
        });

        if (importCount > 0) {
          saveSessions();
          renderHistoryTree();
          loadSession(state.sessions[0].id);
        } else {
          alert('No valid investigations found in this JSON file.');
        }
      } catch (err) {
        console.error('Import failed:', err);
        alert('Failed to parse JSON backup file. Please ensure it is valid Atlas export format.');
      }
      dom.importJsonFileInput.value = '';
    };
    reader.readAsText(file);
  });

  dom.clearCurrentChatBtn?.addEventListener('click', () => {
    const session = getActiveSession();
    if (session && confirm('Clear all messages in this investigation?')) {
      session.messages = [];
      saveSessions();
      loadSession(session.id);
    }
  });

  dom.deepThinkToggleBtn?.addEventListener('click', () => {
    state.isDeepReasoning = !state.isDeepReasoning;
    localStorage.setItem('omni_deep_reasoning', state.isDeepReasoning.toString());
    dom.deepThinkToggleBtn.classList.toggle('active-web', state.isDeepReasoning);
  });

  dom.webSearchToggleBtn?.addEventListener('click', () => {
    state.isWebSearch = !state.isWebSearch;
    localStorage.setItem('omni_web_search', state.isWebSearch.toString());
    syncWebSearchUI();
  });

  dom.stopGenerationBtn?.addEventListener('click', () => {
    if (state.abortController) {
      state.abortController.abort();
    }
    state.isGenerating = false;
    if (dom.stopGenerationBtn) dom.stopGenerationBtn.style.display = 'none';
    if (dom.sendBtn) dom.sendBtn.style.display = 'flex';
    if (dom.streamingIndicator) dom.streamingIndicator.style.display = 'none';
  });

  dom.composerAttachBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = dom.composerAttachMenu ? dom.composerAttachMenu.hidden : true;
    if (dom.composerAttachMenu) {
      dom.composerAttachMenu.hidden = !isHidden;
      dom.composerAttachBtn.setAttribute('aria-expanded', String(isHidden));
    }
  });

  document.addEventListener('click', (e) => {
    if (dom.composerAttachMenu && !dom.composerAttachMenu.hidden) {
      if (!e.target.closest('.composer-attach-wrapper')) {
        dom.composerAttachMenu.hidden = true;
        dom.composerAttachBtn?.setAttribute('aria-expanded', 'false');
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dom.composerAttachMenu && !dom.composerAttachMenu.hidden) {
      dom.composerAttachMenu.hidden = true;
      dom.composerAttachBtn?.setAttribute('aria-expanded', 'false');
    }
  });

  dom.attachOptionFile?.addEventListener('click', () => {
    if (dom.composerAttachMenu) dom.composerAttachMenu.hidden = true;
    dom.composerAttachBtn?.setAttribute('aria-expanded', 'false');

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.html,.css,.js,.json,.md,.txt,.py,.ts,.jsx,.tsx,.csv,.xml,.yml,.yaml,.pdf';
    fileInput.multiple = true;
    fileInput.onchange = (e) => {
      const files = Array.from(e.target.files || []).filter(file => file.size <= 500000);
      if (!files.length) return;

      Promise.all(files.map(file => new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          path: file.webkitRelativePath || file.name,
          content: String(reader.result || '')
        });
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
      }))).then(importedFiles => {
        const validFiles = importedFiles.filter(Boolean);
        if (validFiles.length) {
          const existing = state.projectFiles || [];
          const combined = [...existing, ...validFiles];
          const seen = new Set();
          state.projectFiles = combined.filter(f => {
            if (seen.has(f.path)) return false;
            seen.add(f.path);
            return true;
          }).sort((a, b) => a.path.localeCompare(b.path));
          syncProjectContextUI();
        }
      });
    };
    fileInput.click();
  });

  dom.attachOptionQR?.addEventListener('click', () => {
    if (dom.composerAttachMenu) dom.composerAttachMenu.hidden = true;
    dom.composerAttachBtn?.setAttribute('aria-expanded', 'false');
    document.dispatchEvent(new CustomEvent('atlas:open-qr-scanner'));
  });

  dom.attachOptionOCR?.addEventListener('click', () => {
    if (dom.composerAttachMenu) dom.composerAttachMenu.hidden = true;
    dom.composerAttachBtn?.setAttribute('aria-expanded', 'false');
    document.dispatchEvent(new CustomEvent('atlas:open-ocr'));
  });

  document.addEventListener('atlas:ocr-result', (e) => {
    if (dom.messageInput) {
      dom.messageInput.value = (dom.messageInput.value ? dom.messageInput.value + '\n\n' : '') + e.detail;
      autoResizeTextarea();
      dom.messageInput.focus();
    }
  });

  document.addEventListener('atlas:qr-result', (e) => {
    if (dom.messageInput) {
      const prefix = dom.messageInput.value ? dom.messageInput.value + '\n\n' : '';
      dom.messageInput.value = `${prefix}QR result:\n\n${e.detail}`;
      autoResizeTextarea();
      dom.messageInput.focus();
    }
  });

  dom.clearProjectContextBtn?.addEventListener('click', () => {
    state.projectFiles = [];
    syncProjectContextUI();
  });

  dom.openSysPromptModalBtn?.addEventListener('click', () => openUnifiedSettings('studio-parameters'));
  dom.settingsSidebarBtn?.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = dom.sidebarProfileMenu && !dom.sidebarProfileMenu.hidden;
    if (dom.sidebarProfileMenu) {
      dom.sidebarProfileMenu.hidden = isOpen;
    }
    if (dom.settingsSidebarBtn) {
      dom.settingsSidebarBtn.setAttribute('aria-expanded', String(!isOpen));
    }
  });

  dom.profileSettingsBtn?.addEventListener('click', () => {
    if (dom.sidebarProfileMenu) dom.sidebarProfileMenu.hidden = true;
    if (dom.settingsSidebarBtn) dom.settingsSidebarBtn.setAttribute('aria-expanded', 'false');
    openUnifiedSettings('general-settings');
  });

  dom.closeUnifiedSettingsBtn?.addEventListener('click', () => closeUnifiedSettings());

  dom.settingsNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      dom.settingsNavBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      dom.settingsPanes.forEach(pane => pane.classList.remove('active'));
      const activePane = document.getElementById(`pane-${targetTab}`);
      if (activePane) activePane.classList.add('active');

      if (dom.activeSettingsTitle && dom.activeSettingsDesc) {
        if (targetTab === 'studio-parameters') {
          dom.activeSettingsTitle.textContent = 'Personalization';
          dom.activeSettingsDesc.textContent = 'Configure model instructions, temperature, and domain presets';
        } else if (targetTab === 'general-settings') {
          dom.activeSettingsTitle.textContent = 'General';
          dom.activeSettingsDesc.textContent = 'Manage your application data and preferences';
        }
      }
    });
  });

  dom.saveProfileNameBtn?.addEventListener('click', () => {
    const nextName = (dom.accountNameInput?.value || '').trim() || 'Your Name';
    state.accountName = nextName;
    localStorage.setItem('atlas_account_name', nextName);
    syncSidebarProfileUI();
    if (dom.accountNameInput) dom.accountNameInput.value = nextName;
  });

  dom.saveGeneralSettingsBtn?.addEventListener('click', () => {
    const nextName = (dom.accountNameInput?.value || '').trim() || 'Your Name';
    const nextApiKey = (dom.customApiKeyInput?.value || '').trim();
    const nextVoiceName = dom.defaultVoiceSelect?.value || '';

    state.accountName = nextName;
    state.apiKey = nextApiKey;
    state.defaultVoiceName = nextVoiceName;
    localStorage.setItem('atlas_account_name', nextName);
    localStorage.setItem('atlas_default_voice', nextVoiceName);

    if (nextApiKey) {
      localStorage.setItem('atlas_openrouter_api_key', nextApiKey);
    } else {
      localStorage.removeItem('atlas_openrouter_api_key');
    }

    syncSidebarProfileUI();
    if (dom.apiKeyStatusHint) {
      dom.apiKeyStatusHint.textContent = nextApiKey
        ? 'Custom API key saved and active.'
        : 'Custom key cleared. Default server key active.';
      dom.apiKeyStatusHint.style.display = 'block';
    }
    if (dom.voiceStatusHint) {
      dom.voiceStatusHint.textContent = nextVoiceName ? 'Voice preference saved.' : 'Browser default voice saved.';
    }

    const originalText = dom.saveGeneralSettingsBtn.textContent;
    dom.saveGeneralSettingsBtn.textContent = 'Saved';
    setTimeout(() => {
      dom.saveGeneralSettingsBtn.textContent = originalText;
      closeUnifiedSettings();
    }, 700);
  });

  dom.saveApiKeyBtn?.addEventListener('click', () => {
    const val = (dom.customApiKeyInput?.value || '').trim();
    state.apiKey = val;
    if (val) {
      localStorage.setItem('atlas_openrouter_api_key', val);
      if (dom.apiKeyStatusHint) {
        dom.apiKeyStatusHint.textContent = 'Custom API key saved and active.';
        dom.apiKeyStatusHint.style.display = 'block';
      }
    } else {
      localStorage.removeItem('atlas_openrouter_api_key');
      if (dom.apiKeyStatusHint) {
        dom.apiKeyStatusHint.textContent = 'Custom key cleared. Default server key active.';
        dom.apiKeyStatusHint.style.display = 'block';
      }
    }
  });

  dom.clearAllDataBtn?.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all chats and clear all local storage? This action cannot be undone.')) {
      localStorage.clear();
      state.sessions = [];
      state.activeSessionId = null;
      saveSessions();
      window.location.reload();
    }
  });

  dom.presetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      dom.presetPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const presetKey = pill.getAttribute('data-preset');
      state.activePreset = presetKey;
      if (dom.customSystemPrompt) dom.customSystemPrompt.value = PERSONA_PRESETS[presetKey] || '';
    });
  });

  dom.resetModalPromptBtn?.addEventListener('click', () => {
    if (dom.customSystemPrompt) dom.customSystemPrompt.value = PERSONA_PRESETS.auto;
  });

  dom.temperatureSlider?.addEventListener('input', (e) => {
    if (dom.tempValBadge) dom.tempValBadge.textContent = e.target.value;
  });

  dom.saveSettingsBtn?.addEventListener('click', () => {
    state.systemPrompt = dom.customSystemPrompt.value.trim();
    state.temperature = parseFloat(dom.temperatureSlider.value);
    state.defaultVoiceName = dom.defaultVoiceSelect ? dom.defaultVoiceSelect.value : '';
    localStorage.setItem('omni_sys_prompt', state.systemPrompt);
    localStorage.setItem('omni_preset', state.activePreset);
    localStorage.setItem('omni_temp', state.temperature.toString());
    localStorage.setItem('atlas_default_voice', state.defaultVoiceName);
    updateActivePromptLabel();

    const originalText = dom.saveSettingsBtn.textContent;
    dom.saveSettingsBtn.textContent = 'Applied';
    setTimeout(() => {
      dom.saveSettingsBtn.textContent = originalText;
      closeUnifiedSettings();
    }, 200);
  });

  dom.unifiedSettingsModal?.addEventListener('click', (e) => {
    if (e.target === dom.unifiedSettingsModal) {
      closeUnifiedSettings();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dom.unifiedSettingsModal?.classList.contains('show')) {
      closeUnifiedSettings();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.model-dropdown-capsule')) {
      const menu = document.getElementById('modelDropdownMenu');
      if (menu) menu.classList.remove('show');
    }
    if (!e.target.closest('.export-dropdown-wrapper')) {
      document.getElementById('exportMenuPopup')?.classList.remove('show');
    }
    if (dom.sidebarProfileMenu && !e.target.closest('.sidebar-profile-wrapper') && !e.target.closest('.profile-settings-btn')) {
      dom.sidebarProfileMenu.hidden = true;
      if (dom.settingsSidebarBtn) dom.settingsSidebarBtn.setAttribute('aria-expanded', 'false');
    }
    const msgImg = e.target.closest('.message-bubble img');
    if (msgImg) {
      e.preventDefault();
      if (window.atlasOpenLightbox) {
        window.atlasOpenLightbox(msgImg.src, msgImg.alt || 'Visual reference', '', 'Visual Reference');
      }
    }
  });

  // Offline banner listeners
  const offlineBanner = document.getElementById('offlineBanner');
  window.addEventListener('offline', () => {
    if (offlineBanner) offlineBanner.style.display = 'flex';
  });
  window.addEventListener('online', () => {
    if (offlineBanner) offlineBanner.style.display = 'none';
  });

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = populateVoiceOptions;
  }
}
