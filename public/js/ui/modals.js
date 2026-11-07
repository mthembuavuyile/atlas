/**
 * modals.js
 * Modals controller: Unified Settings (Studio Parameters & General Preferences),
 * Keyboard Shortcuts dialog, Export/Import managers, and attachment popups.
 */

import { state } from '../state/store.js';
import { dom } from './dom.js';
import { PERSONA_PRESETS } from '../config/constants.js';
import { ELEVENLABS_VOICE_OPTIONS } from '../audio/speech-pill.js';
import { getActiveSession, saveSessions, loadSession, createNewSession, renderHistoryTree, closeMobileSidebar, updateContextEstimator } from './session-manager.js';

/**
 * Parses a CSV string and prepends a structured Document Intelligence header
 * with row count, column headers, and automatic numeric column statistics.
 */
export function summarizeCsvContent(csvText, filename = 'data.csv') {
  const raw = String(csvText || '').trim();
  if (!raw) return '';

  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return raw;

  const parseCsvRow = (row) => {
    const cells = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const headers = parseCsvRow(lines[0]);
  const dataRows = lines.slice(1, 2001).map(parseCsvRow);
  const numericStats = [];

  headers.forEach((headerName, colIdx) => {
    if (!headerName) return;
    const nums = [];
    for (const row of dataRows) {
      const cell = (row[colIdx] || '').replace(/[$€£R,\s]/g, '');
      if (cell !== '' && !Number.isNaN(Number(cell))) {
        nums.push(Number(cell));
      }
    }
    if (nums.length > 0 && nums.length >= Math.min(3, dataRows.length)) {
      const sum = nums.reduce((a, b) => a + b, 0);
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const avg = sum / nums.length;
      numericStats.push(
        `- ${headerName}: count=${nums.length}, sum=${Number(sum.toFixed(2))}, avg=${Number(avg.toFixed(2))}, min=${min}, max=${max}`
      );
    }
  });

  const summaryHeader = [
    `[CSV Document Intelligence: ${filename} — ${lines.length - 1} rows, ${headers.length} columns]`,
    `Columns: ${headers.join(', ')}`,
    ...(numericStats.length ? ['Numeric Summary:', ...numericStats] : []),
    '--- Raw CSV Data ---'
  ].join('\n');

  return `${summaryHeader}\n${raw.slice(0, 180000)}`;
}

/**
 * Fallback lightweight PDF text extractor from an ArrayBuffer or string when pdf.js is offline.
 */
export function extractPdfTextFromBuffer(bufferOrString, filename = 'document.pdf') {
  let raw = '';
  if (typeof bufferOrString === 'string') {
    raw = bufferOrString;
  } else if (bufferOrString instanceof ArrayBuffer || ArrayBuffer.isView(bufferOrString)) {
    const bytes = bufferOrString instanceof ArrayBuffer ? new Uint8Array(bufferOrString) : new Uint8Array(bufferOrString.buffer);
    const decoder = new TextDecoder('latin1');
    raw = decoder.decode(bytes);
  }

  const fragments = [];
  const parenRegex = /\(([^()\\]{2,240}(?:\\.[^()\\]*)*)\)/g;
  let match;
  while ((match = parenRegex.exec(raw)) !== null) {
    const cleaned = match[1]
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/[^\x20-\x7E\n]/g, '')
      .trim();
    if (cleaned.length >= 2 && /[a-zA-Z0-9]{2,}/.test(cleaned)) {
      fragments.push(cleaned);
    }
  }

  const body = fragments.join(' ').replace(/\s+/g, ' ').trim();
  if (!body) {
    return `[PDF Document: ${filename}]\n(Scanned or encrypted PDF — use Atlas OCR tool for image-based pages.)`;
  }
  return `[PDF Document: ${filename}]\n${body.slice(0, 150000)}`;
}

let pdfJsLoadPromise = null;
function ensurePdfJsLoaded() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfJsLoadPromise) return pdfJsLoadPromise;

  pdfJsLoadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        resolve(null);
      }
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return pdfJsLoadPromise;
}

export async function extractPdfTextClientSide(file) {
  const filename = file.webkitRelativePath || file.name || 'document.pdf';
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await ensurePdfJsLoaded();
    if (pdfjsLib && typeof pdfjsLib.getDocument === 'function') {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const maxPages = Math.min(pdf.numPages || 1, 40);
      const pagesText = [];
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const strings = (textContent.items || []).map(item => item.str || '').join(' ').replace(/\s+/g, ' ').trim();
        if (strings) {
          pagesText.push(`--- Page ${pageNum} ---\n${strings}`);
        }
      }
      if (pagesText.length > 0) {
        return `[PDF Document: ${filename} — ${pdf.numPages} page${pdf.numPages === 1 ? '' : 's'}]\n${pagesText.join('\n\n')}`;
      }
    }
    return extractPdfTextFromBuffer(arrayBuffer, filename);
  } catch (err) {
    return `[PDF Document: ${filename}]\nUnable to parse PDF binary directly (${err?.message || 'unknown error'}).`;
  }
}

/**
 * Returns the `<input type="file" accept="...">` attribute for Attach Files.
 * On Android, `.ts` is mapped by Android's system MimeTypeMap to `video/mp2ts`
 * (MPEG-2 Transport Stream video), which causes Android browsers to prompt
 * the Camcorder and "Photos and videos" picker instead of opening Files/Documents.
 */
export function getAttachFileAcceptAttribute(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '') {
  const isAndroid = /Android/i.test(String(userAgent || ''));
  if (isAndroid) {
    return 'application/pdf,text/plain,text/csv,text/markdown,text/html,text/css,text/javascript,application/json,application/xml,text/xml,.pdf,.csv,.txt,.md,.json,.js,.py,.html,.css,.xml,.yml,.yaml';
  }
  return 'application/pdf,text/plain,text/csv,text/markdown,text/html,text/css,text/javascript,application/json,application/xml,.html,.css,.js,.json,.md,.txt,.py,.ts,.jsx,.tsx,.csv,.xml,.yml,.yaml,.pdf';
}

export async function processAttachedFile(file) {
  if (!file) return null;
  const path = file.webkitRelativePath || file.name || 'unnamed';
  const lower = path.toLowerCase();
  const mime = String(file.type || '').toLowerCase();

  // Reject unsupported video/audio media streams (unless it is a .ts/.tsx TypeScript source file)
  if ((mime.startsWith('video/') || mime.startsWith('audio/')) && !lower.endsWith('.ts') && !lower.endsWith('.tsx')) {
    return null;
  }

  const isPdf = lower.endsWith('.pdf') || mime === 'application/pdf';
  const isCsv = lower.endsWith('.csv') || mime === 'text/csv' || mime === 'text/comma-separated-values';

  const maxSize = isPdf ? 10 * 1024 * 1024 : (isCsv ? 2 * 1024 * 1024 : 500000);
  if (file.size > maxSize) return null;

  if (isPdf) {
    const content = await extractPdfTextClientSide(file);
    return { path, content };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rawText = String(reader.result || '');
      const content = isCsv ? summarizeCsvContent(rawText, path) : rawText;
      resolve({ path, content });
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}

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
  browserDefaultOption.textContent = 'Use browser default (Google / System Speech)';
  dom.defaultVoiceSelect.appendChild(browserDefaultOption);

  // 1. ElevenLabs AI Voices (Free Tier API)
  const elevenLabsGroup = document.createElement('optgroup');
  elevenLabsGroup.label = 'ElevenLabs Voices';
  ELEVENLABS_VOICE_OPTIONS.forEach((voice) => {
    const option = document.createElement('option');
    option.value = voice.value;
    option.textContent = voice.label;
    elevenLabsGroup.appendChild(option);
  });
  dom.defaultVoiceSelect.appendChild(elevenLabsGroup);

  // 2. Google & Browser Web Speech Voices
  const browserGroup = document.createElement('optgroup');
  browserGroup.label = 'Google & Browser Voices';
  voices.forEach((voice) => {
    const option = document.createElement('option');
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    browserGroup.appendChild(option);
  });
  if (voices.length > 0) {
    dom.defaultVoiceSelect.appendChild(browserGroup);
  }

  const isElevenLabsSelected = ELEVENLABS_VOICE_OPTIONS.some((v) => v.value === currentValue);
  const isBrowserVoiceSelected = voices.some((voice) => voice.name === currentValue);
  const selectedVoiceExists = isElevenLabsSelected || isBrowserVoiceSelected;

  dom.defaultVoiceSelect.value = selectedVoiceExists ? currentValue : '';
  if (dom.voiceStatusHint) {
    if (currentValue && !selectedVoiceExists && voices.length > 0) {
      dom.voiceStatusHint.textContent = 'Saved voice is unavailable in this browser. Choose another voice or use the browser default.';
    } else if (isElevenLabsSelected) {
      const matched = ELEVENLABS_VOICE_OPTIONS.find((v) => v.value === currentValue);
      dom.voiceStatusHint.textContent = `ElevenLabs (${matched ? matched.name : 'AI'}) active for Read Aloud.`;
    } else {
      dom.voiceStatusHint.textContent = '';
    }
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

export function formatProjectContextLabel(files = []) {
  const list = Array.isArray(files) ? files : [];
  const fileCount = list.length;
  if (fileCount === 0) return 'Attached files';

  const names = list.map(f => {
    const rawPath = String(f?.path || f?.name || 'file').trim();
    return rawPath.split(/[\\/]/).pop() || rawPath;
  });

  if (fileCount === 1) {
    return `${names[0]} (1 file attached for analysis)`;
  }
  if (fileCount <= 3) {
    return `${names.join(', ')} (${fileCount} files attached for analysis)`;
  }
  return `${names.slice(0, 3).join(', ')} +${fileCount - 3} more (${fileCount} files attached for analysis)`;
}

export function syncProjectContextUI() {
  const files = Array.isArray(state.projectFiles) ? state.projectFiles : [];
  const fileCount = files.length;
  if (typeof document === 'undefined') return;
  if (dom.projectContextBar) dom.projectContextBar.hidden = fileCount === 0;
  if (dom.projectContextLabel) {
    dom.projectContextLabel.textContent = formatProjectContextLabel(files);
    dom.projectContextLabel.title = fileCount
      ? files.map(f => f.path || f.name || '').filter(Boolean).join(', ')
      : '';
  }
  updateContextEstimator();
}

let customComposerHeight = 0;
let isDraggingComposer = false;
let composerStartY = 0;
let composerStartHeight = 0;

export function resetComposerHeight() {
  customComposerHeight = 0;
  if (dom.messageInput) {
    dom.messageInput.style.height = '';
  }
}

export function autoResizeTextarea() {
  if (!dom.messageInput) return;
  dom.messageInput.style.height = 'auto';
  const naturalHeight = dom.messageInput.scrollHeight;
  const targetHeight = customComposerHeight > 0
    ? Math.max(customComposerHeight, Math.min(naturalHeight, 420))
    : Math.min(naturalHeight, 140);
  dom.messageInput.style.height = `${targetHeight}px`;
}

export function initComposerResizer() {
  const sash = dom.composerResizerSash;
  const textarea = dom.messageInput;
  if (!sash || !textarea) return;

  sash.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    isDraggingComposer = true;
    sash.setPointerCapture(e.pointerId);
    composerStartY = e.clientY;
    composerStartHeight = textarea.offsetHeight;
    sash.classList.add('dragging');
    document.body.classList.add('is-resizing-composer');
  });

  sash.addEventListener('pointermove', (e) => {
    if (!isDraggingComposer) return;
    // Dragging UP increases height; dragging DOWN decreases height
    const deltaY = composerStartY - e.clientY;
    let newHeight = composerStartHeight + deltaY;
    const minHeight = 38;
    const maxHeight = Math.min(420, Math.floor(window.innerHeight * 0.5));
    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
    customComposerHeight = newHeight;
    textarea.style.height = `${newHeight}px`;
    sash.setAttribute('aria-valuenow', Math.round(newHeight));
  });

  const stopDraggingComposer = (e) => {
    if (!isDraggingComposer) return;
    isDraggingComposer = false;
    sash.classList.remove('dragging');
    document.body.classList.remove('is-resizing-composer');
    try {
      if (e && e.pointerId) sash.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  sash.addEventListener('pointerup', stopDraggingComposer);
  sash.addEventListener('pointercancel', stopDraggingComposer);
  window.addEventListener('pointerup', stopDraggingComposer);
  window.addEventListener('pointercancel', stopDraggingComposer);
  window.addEventListener('blur', stopDraggingComposer);

  sash.addEventListener('dblclick', () => {
    resetComposerHeight();
    autoResizeTextarea();
  });

  sash.addEventListener('keydown', (e) => {
    const currentHeight = textarea.offsetHeight;
    const step = e.shiftKey ? 40 : 15;
    const minHeight = 38;
    const maxHeight = Math.min(420, Math.floor(window.innerHeight * 0.5));

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newHeight = Math.min(maxHeight, currentHeight + step);
      customComposerHeight = newHeight;
      textarea.style.height = `${newHeight}px`;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newHeight = Math.max(minHeight, currentHeight - step);
      customComposerHeight = newHeight;
      textarea.style.height = `${newHeight}px`;
    } else if (e.key === 'Home' || e.key === 'Enter') {
      e.preventDefault();
      resetComposerHeight();
      autoResizeTextarea();
    }
  });
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
    if (dom.sidebar?.classList.contains('mobile-open') || window.innerWidth <= 768) {
      closeMobileSidebar();
    } else {
      dom.sidebar?.classList.toggle('collapsed');
    }
  });

  dom.sidebarToggleBtn?.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      dom.sidebar?.classList.toggle('mobile-open');
      dom.sidebarBackdrop?.classList.toggle('active', dom.sidebar?.classList.contains('mobile-open'));
    } else {
      dom.sidebar?.classList.toggle('collapsed');
    }
  });

  dom.sidebarBackdrop?.addEventListener('click', closeMobileSidebar);
  dom.sidebarBackdrop?.addEventListener('touchend', (e) => {
    e.preventDefault();
    closeMobileSidebar();
  });

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
    fileInput.accept = getAttachFileAcceptAttribute();
    fileInput.multiple = true;
    fileInput.onchange = (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      Promise.all(files.map(file => processAttachedFile(file))).then(importedFiles => {
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
    if (window.innerWidth <= 768) closeMobileSidebar();
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

  dom.defaultVoiceSelect?.addEventListener('change', () => {
    const nextVoiceName = dom.defaultVoiceSelect?.value || '';
    state.defaultVoiceName = nextVoiceName;
    localStorage.setItem('atlas_default_voice', nextVoiceName);
    if (dom.voiceStatusHint) {
      if (nextVoiceName.startsWith('elevenlabs:')) {
        const matched = ELEVENLABS_VOICE_OPTIONS.find((v) => v.value === nextVoiceName);
        dom.voiceStatusHint.textContent = `ElevenLabs (${matched ? matched.name : 'AI'}) saved for Read Aloud.`;
      } else {
        dom.voiceStatusHint.textContent = nextVoiceName
          ? 'Google / Browser voice preference saved.'
          : 'Browser default voice saved.';
      }
    }
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
    if (e.key === 'Escape') {
      if (dom.sidebar?.classList.contains('mobile-open')) {
        closeMobileSidebar();
      }
      if (dom.unifiedSettingsModal?.classList.contains('show')) {
        closeUnifiedSettings();
      }
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
