/**
 * canvas.js
 * Living Artifact Canvas Panel:
 * - Multi-file artifact shelf
 * - In-place bi-directional code editor
 * - Live HTML/JS preview
 * - Unified diff inspector with Web File System Access (local folder sync)
 * - Agent execution objectives & live terminal feed
 */

import { state } from '../state/store.js';
import { dom } from './dom.js';
import { escapeHtml, parseMarkdownSafely, enhanceCodeBlocks, renderMathSafely } from '../markdown/parser.js';

let isEditingCode = false;
let currentActiveDiff = '';

// ─────────────────────────────────────────────────────────────
// MULTI-FILE ARTIFACT SHELF
// ─────────────────────────────────────────────────────────────

export function renderFileShelf() {
  if (!dom.canvasFileShelf) return;
  const artifacts = state.artifacts || [];
  if (artifacts.length <= 1) {
    dom.canvasFileShelf.style.display = 'none';
    dom.canvasFileShelf.innerHTML = '';
    return;
  }

  dom.canvasFileShelf.style.display = 'flex';
  dom.canvasFileShelf.innerHTML = artifacts.map((art, idx) => {
    const isActive = idx === state.activeArtifactIndex;
    const title = art.title || `File ${idx + 1}`;
    const lang = (art.language || 'txt').toLowerCase();
    return `
      <button class="file-shelf-pill ${isActive ? 'active' : ''}" data-index="${idx}" title="${escapeHtml(title)}">
        <span class="file-pill-lang">${escapeHtml(lang)}</span>
        <span class="file-pill-title">${escapeHtml(title)}</span>
      </button>
    `;
  }).join('');

  dom.canvasFileShelf.querySelectorAll('.file-shelf-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      selectArtifactByIndex(idx);
    });
  });
}

export function selectArtifactByIndex(index) {
  if (!state.artifacts || !state.artifacts[index]) return;
  state.activeArtifactIndex = index;
  const art = state.artifacts[index];
  displayArtifact(art);
  renderFileShelf();
}

// ─────────────────────────────────────────────────────────────
// DIFF VIEWER & LOCAL FILE SYSTEM ACCESS SYNC
// ─────────────────────────────────────────────────────────────

export function renderDiffInCanvas(diffText) {
  currentActiveDiff = diffText || '';
  if (!dom.diffViewerContainer) return;
  if (!diffText || !diffText.trim()) {
    if (dom.diffHeaderBar) dom.diffHeaderBar.style.display = 'none';
    dom.diffViewerContainer.innerHTML = '<div class="diff-empty-notice">No diff active. Load a unified diff or ask Atlas to propose code edits to view line changes here.</div>';
    return;
  }

  // Detect target filename from diff headers
  let detectedFile = 'Unified Diff';
  const fileMatch = diffText.match(/(?:\+\+\+\s+b\/|---\s+a\/)([^\r\n]+)/);
  if (fileMatch && fileMatch[1]) {
    detectedFile = fileMatch[1].trim();
  }

  if (dom.diffHeaderBar) {
    dom.diffHeaderBar.style.display = 'flex';
    if (dom.diffTargetFileTitle) dom.diffTargetFileTitle.textContent = detectedFile;
  }

  const lines = diffText.split('\n');
  let html = '';
  lines.forEach((line) => {
    let lineClass = '';
    if (line.startsWith('+++') || line.startsWith('---')) {
      lineClass = 'diff-meta';
    } else if (line.startsWith('@@')) {
      lineClass = 'diff-hunk';
    } else if (line.startsWith('+')) {
      lineClass = 'diff-add';
    } else if (line.startsWith('-')) {
      lineClass = 'diff-del';
    }
    html += `<div class="diff-line ${lineClass}">${escapeHtml(line)}</div>`;
  });
  dom.diffViewerContainer.innerHTML = html;
}

export async function applyDiffToLocalFolder() {
  if (!currentActiveDiff) {
    logAgentExecution('No active diff to apply.', 'error');
    return;
  }

  // Check Web File System Access API support
  if ('showDirectoryPicker' in window) {
    try {
      logAgentExecution('Requesting local directory access to apply diff...', 'system');
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      if (!dirHandle) return;

      logAgentExecution(`Access granted to directory: [${dirHandle.name}]. Applying patch...`, 'system');

      // Parse diff hunks to identify modified files
      const fileBlocks = currentActiveDiff.split(/^diff --git /m);
      let appliedCount = 0;

      for (const block of fileBlocks) {
        if (!block.trim()) continue;
        const targetMatch = block.match(/\+\+\+\s+b\/([^\r\n]+)/);
        if (!targetMatch) continue;

        const relativePath = targetMatch[1].trim();
        logAgentExecution(`Patching file: ${relativePath}...`, 'tool');

        // Extract added lines or updated content
        const lines = block.split('\n');
        const reconstructedLines = [];
        for (const line of lines) {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            reconstructedLines.push(line.substring(1));
          } else if (!line.startsWith('-') && !line.startsWith('---') && !line.startsWith('@@') && !line.startsWith('index ')) {
            reconstructedLines.push(line);
          }
        }

        // Navigate nested directories if needed
        const pathSegments = relativePath.split(/[/\\]/).filter(Boolean);
        let currentHandle = dirHandle;
        for (let i = 0; i < pathSegments.length - 1; i++) {
          currentHandle = await currentHandle.getDirectoryHandle(pathSegments[i], { create: true });
        }
        const fileName = pathSegments[pathSegments.length - 1];
        const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(reconstructedLines.join('\n'));
        await writable.close();
        appliedCount++;
        logAgentExecution(`Successfully updated: ${relativePath}`, 'success');
      }

      logAgentExecution(`Patch application completed: ${appliedCount} file(s) updated in ${dirHandle.name}.`, 'success');
      alertFeedback('Diff successfully applied to local folder!');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Directory write error:', err);
        logAgentExecution(`Failed to apply diff: ${err.message}`, 'error');
        downloadPatchFallback(currentActiveDiff);
      }
    }
  } else {
    // Fallback: download as .patch file
    downloadPatchFallback(currentActiveDiff);
  }
}

function downloadPatchFallback(diffText) {
  const blob = new Blob([diffText], { type: 'text/x-diff;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `atlas_patch_${Date.now()}.patch`;
  a.click();
  logAgentExecution('Browser does not support direct directory write. Downloaded .patch file instead.', 'system');
  alertFeedback('Downloaded patch file.');
}

// ─────────────────────────────────────────────────────────────
// TAB SWITCHING & ARTIFACT DISPLAY
// ─────────────────────────────────────────────────────────────

export function switchCanvasTab(tabKey) {
  dom.canvasTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabKey));
  if (dom.canvasCodePane) dom.canvasCodePane.classList.toggle('active', tabKey === 'code');
  if (dom.canvasPreviewPane) dom.canvasPreviewPane.classList.toggle('active', tabKey === 'preview');
  if (dom.canvasDiffPane) dom.canvasDiffPane.classList.toggle('active', tabKey === 'diff');
  if (dom.canvasMarkdownPane) dom.canvasMarkdownPane.classList.toggle('active', tabKey === 'markdown');
  if (dom.canvasAgentPane) dom.canvasAgentPane.classList.toggle('active', tabKey === 'agent');
}

export function buildLivePreviewHtml(activeArtifact, artifacts = []) {
  if (!activeArtifact && (!artifacts || artifacts.length === 0)) return '';

  // 1. Identify primary HTML file (either active or from shelf)
  let htmlArt = null;
  if (activeArtifact && (activeArtifact.language === 'html' || activeArtifact.codeText?.includes('<!DOCTYPE') || activeArtifact.codeText?.includes('<html'))) {
    htmlArt = activeArtifact;
  } else {
    htmlArt = artifacts.find(a => a.language === 'html' || a.title?.endsWith('.html') || a.codeText?.includes('<!DOCTYPE') || a.codeText?.includes('<html'));
  }

  if (!htmlArt || !htmlArt.codeText) {
    return activeArtifact?.codeText || '';
  }

  let bundled = htmlArt.codeText;

  // 2. Inline all CSS artifacts from the shelf (e.g. style.css)
  const cssArtifacts = artifacts.filter(a => a.language === 'css' || (a.title && a.title.endsWith('.css')));
  cssArtifacts.forEach(cssArt => {
    const filename = (cssArt.title || 'style.css').replace(/^.*[/\\]/, '');
    const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const linkRegex = new RegExp(`<link[^>]+href=["'](?:\\.\\/)?${escaped}["'][^>]*>`, 'gi');
    if (linkRegex.test(bundled)) {
      bundled = bundled.replace(linkRegex, `<style data-source="${filename}">\n/* Inlined from ${filename} */\n${cssArt.codeText}\n</style>`);
    } else {
      // Also match any un-inlined local relative stylesheet link (e.g. href="style.css" or href="./theme.css")
      const genericRelCssRegex = /<link[^>]+href=["'](?!\/\/|https?:\/\/)(?:(?:\.\/)?[^'"]+\.css)["'][^>]*>/i;
      if (genericRelCssRegex.test(bundled)) {
        bundled = bundled.replace(genericRelCssRegex, `<style data-source="${filename}">\n/* Inlined from ${filename} */\n${cssArt.codeText}\n</style>`);
      } else if (!bundled.includes(`data-source="${filename}"`)) {
        if (bundled.includes('</head>')) {
          bundled = bundled.replace(/<\/head>/i, `<style data-source="${filename}">\n/* Inlined from ${filename} */\n${cssArt.codeText}\n</style></head>`);
        } else {
          bundled = `<style data-source="${filename}">\n/* Inlined from ${filename} */\n${cssArt.codeText}\n</style>` + bundled;
        }
      }
    }
  });

  // 3. Inline all JS artifacts from the shelf (e.g. script.js, timer.js, app.js)
  const jsArtifacts = artifacts.filter(a => (a.language === 'javascript' || a.language === 'js' || (a.title && a.title.endsWith('.js'))) && a !== htmlArt);
  jsArtifacts.forEach(jsArt => {
    const filename = (jsArt.title || 'script.js').replace(/^.*[/\\]/, '');
    const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const scriptRegex = new RegExp(`<script[^>]+src=["'](?:\\.\\/)?${escaped}["'][^>]*>\\s*<\\/script>`, 'gi');
    if (scriptRegex.test(bundled)) {
      bundled = bundled.replace(scriptRegex, `<script data-source="${filename}">\n/* Inlined from ${filename} */\n${jsArt.codeText}\n</script>`);
    } else {
      // Also match any un-inlined local relative script tag (e.g. src="script.js" or src="./timer.js")
      const genericRelJsRegex = /<script[^>]+src=["'](?!\/\/|https?:\/\/)(?:(?:\.\/)?[^'"]+\.js)["'][^>]*>\s*<\/script>/i;
      if (genericRelJsRegex.test(bundled)) {
        bundled = bundled.replace(genericRelJsRegex, `<script data-source="${filename}">\n/* Inlined from ${filename} */\n${jsArt.codeText}\n</script>`);
      } else if (!bundled.includes(`data-source="${filename}"`)) {
        if (bundled.includes('</body>')) {
          bundled = bundled.replace(/<\/body>/i, `<script data-source="${filename}">\n/* Inlined from ${filename} */\n${jsArt.codeText}\n</script></body>`);
        } else {
          bundled += `\n<script data-source="${filename}">\n/* Inlined from ${filename} */\n${jsArt.codeText}\n</script>`;
        }
      }
    }
  });

  return bundled;
}

function displayArtifact(art) {
  if (!art) return;
  state.activeArtifact = art;

  if (dom.canvasDocumentTitle) dom.canvasDocumentTitle.textContent = art.title || 'Artifact';
  if (dom.canvasTypeTag) dom.canvasTypeTag.textContent = art.type || 'Code';
  if (dom.canvasLanguageBadge) dom.canvasLanguageBadge.textContent = (art.language || 'TEXT').toUpperCase();

  const lineCount = art.codeText ? art.codeText.split('\n').length : 0;
  const byteCount = art.codeText ? new Blob([art.codeText]).size : 0;
  if (dom.canvasLineCount) dom.canvasLineCount.textContent = `${lineCount} lines • ${byteCount} bytes`;

  if (dom.canvasCodeContent) {
    dom.canvasCodeContent.textContent = art.codeText || '';
    if (typeof window !== 'undefined' && window.hljs) window.hljs.highlightElement(dom.canvasCodeContent);
  }

  if (dom.canvasCodeEditor) {
    dom.canvasCodeEditor.value = art.codeText || '';
  }

  if (dom.canvasMarkdownContent && typeof window !== 'undefined' && window.marked) {
    dom.canvasMarkdownContent.innerHTML = parseMarkdownSafely(art.codeText || '');
    enhanceCodeBlocks(dom.canvasMarkdownContent, openCodeInCanvas);
    renderMathSafely(dom.canvasMarkdownContent);
  }

  if (dom.canvasPreviewFrame) {
    const previewHtml = buildLivePreviewHtml(art, state.artifacts);
    if (previewHtml) {
      dom.canvasPreviewFrame.srcdoc = previewHtml;
    }
  }

  const isDiff = art.language === 'diff' || (art.codeText && (art.codeText.includes('--- a/') || art.codeText.includes('+++ b/') || (art.codeText.includes('@@') && (art.codeText.includes('+') || art.codeText.includes('-')))));
  if (isDiff) {
    renderDiffInCanvas(art.codeText);
    const canvasDiffTab = document.querySelector('.canvas-tab[data-tab="diff"]');
    if (canvasDiffTab) canvasDiffTab.style.display = 'inline-flex';
  }
}

export function updateCanvasArtifact({ title, codeText, language, type }) {
  if (!state.artifacts) state.artifacts = [];

  // Check if an artifact with the same title already exists
  const existingIdx = state.artifacts.findIndex(a => a.title === title);
  const newArtifact = {
    id: existingIdx >= 0 ? state.artifacts[existingIdx].id : `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: title || 'Artifact',
    codeText: codeText || '',
    language: (language || 'text').toLowerCase(),
    type: type || 'Code'
  };

  if (existingIdx >= 0) {
    state.artifacts[existingIdx] = newArtifact;
    state.activeArtifactIndex = existingIdx;
  } else {
    state.artifacts.push(newArtifact);
    state.activeArtifactIndex = state.artifacts.length - 1;
  }

  displayArtifact(newArtifact);
  renderFileShelf();
}

export function openCodeInCanvas(codeText, language, title = null) {
  const detectedTitle = title || `Snippet (${language})`;
  updateCanvasArtifact({
    title: detectedTitle,
    codeText,
    language,
    type: 'Code Snippet'
  });
  dom.artifactsCanvasPanel?.classList.add('open');
  dom.toggleCanvasBtn?.classList.add('active');
  switchCanvasTab(language === 'html' || (title && title.endsWith('.html')) ? 'preview' : 'code');
}

// ─────────────────────────────────────────────────────────────
// IN-PLACE CODE EDITING & BIDIRECTIONAL SYNC
// ─────────────────────────────────────────────────────────────

export function toggleCodeEditMode() {
  isEditingCode = !isEditingCode;

  if (isEditingCode) {
    if (dom.canvasCodeEditor) {
      dom.canvasCodeEditor.value = state.activeArtifact?.codeText || '';
      dom.canvasCodeEditor.style.display = 'block';
    }
    const pre = dom.canvasCodePane?.querySelector('.canvas-pre');
    if (pre) pre.style.display = 'none';

    if (dom.toggleCodeEditBtn) {
      dom.toggleCodeEditBtn.textContent = 'Done';
      dom.toggleCodeEditBtn.classList.add('active');
    }
    dom.canvasCodeEditor?.focus();
  } else {
    // Commit edits back to active artifact
    const updatedCode = dom.canvasCodeEditor ? dom.canvasCodeEditor.value : '';
    if (state.activeArtifact) {
      state.activeArtifact.codeText = updatedCode;
      if (state.artifacts && state.artifacts[state.activeArtifactIndex]) {
        state.artifacts[state.activeArtifactIndex].codeText = updatedCode;
      }
    }

    if (dom.canvasCodeContent) {
      dom.canvasCodeContent.textContent = updatedCode;
      if (typeof window !== 'undefined' && window.hljs) window.hljs.highlightElement(dom.canvasCodeContent);
    }

    const pre = dom.canvasCodePane?.querySelector('.canvas-pre');
    if (pre) pre.style.display = 'block';
    if (dom.canvasCodeEditor) dom.canvasCodeEditor.style.display = 'none';

    if (dom.toggleCodeEditBtn) {
      dom.toggleCodeEditBtn.textContent = 'Edit';
      dom.toggleCodeEditBtn.classList.remove('active');
    }

    // Refresh preview if HTML
    if (state.activeArtifact?.language === 'html' && dom.canvasPreviewFrame) {
      dom.canvasPreviewFrame.srcdoc = updatedCode;
    }

    // Update metrics
    const lineCount = updatedCode.split('\n').length;
    const byteCount = new Blob([updatedCode]).size;
    if (dom.canvasLineCount) dom.canvasLineCount.textContent = `${lineCount} lines • ${byteCount} bytes`;
  }
}

// ─────────────────────────────────────────────────────────────
// WORKSPACE ACTIONS: SEND TO PROMPT & CLIPBOARD
// ─────────────────────────────────────────────────────────────

export function sendCanvasArtifactToPrompt() {
  const art = state.activeArtifact;
  if (!art || !art.codeText) {
    alertFeedback('No active artifact to send.');
    return;
  }

  const composer = document.getElementById('messageInput') || document.getElementById('chatInput');
  if (!composer) return;

  const titleHeader = art.title ? `// File: ${art.title}\n` : '';
  const contextSnippet = `\`\`\`${art.language || 'text'}\n${titleHeader}${art.codeText}\n\`\`\`\n`;

  if (composer.value.trim().length > 0) {
    composer.value = `${composer.value.trim()}\n\n${contextSnippet}`;
  } else {
    composer.value = contextSnippet;
  }

  composer.style.height = 'auto';
  composer.style.height = Math.min(composer.scrollHeight, 180) + 'px';
  composer.focus();

  alertFeedback('Artifact injected into prompt!');
}

function alertFeedback(message) {
  const badge = document.createElement('div');
  badge.className = 'atlas-transient-toast';
  badge.textContent = message;
  document.body.appendChild(badge);
  setTimeout(() => {
    badge.classList.add('fade-out');
    setTimeout(() => badge.remove(), 300);
  }, 1800);
}

// ─────────────────────────────────────────────────────────────
// AGENT EXECUTION ORCHESTRATOR (#canvasAgentPane)
// ─────────────────────────────────────────────────────────────

let agentTasks = [];

export function setAgentObjectives(tasks) {
  agentTasks = Array.isArray(tasks) ? tasks.map((t, i) => ({
    id: t.id || `task-${i + 1}`,
    text: typeof t === 'string' ? t : (t.text || `Objective ${i + 1}`),
    status: t.status || 'pending' // 'pending' | 'running' | 'completed' | 'failed'
  })) : [];

  renderAgentObjectives();
}

export function updateAgentObjective(taskId, status) {
  const target = agentTasks.find(t => t.id === taskId || t.text === taskId);
  if (target) {
    target.status = status;
    renderAgentObjectives();
  }
}

export function renderAgentObjectives() {
  if (!dom.agentTaskList) return;
  if (!agentTasks || agentTasks.length === 0) {
    dom.agentTaskList.innerHTML = '<li class="task-item placeholder">Awaiting tasks...</li>';
    if (dom.agentTaskCountBadge) dom.agentTaskCountBadge.textContent = '0 / 0';
    return;
  }

  const completed = agentTasks.filter(t => t.status === 'completed').length;
  if (dom.agentTaskCountBadge) {
    dom.agentTaskCountBadge.textContent = `${completed} / ${agentTasks.length}`;
  }

  dom.agentTaskList.innerHTML = agentTasks.map(t => {
    let iconSvg = '';
    if (t.status === 'completed') {
      iconSvg = '<svg class="task-status-icon success" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (t.status === 'running') {
      iconSvg = '<span class="task-status-spinner"></span>';
    } else if (t.status === 'failed') {
      iconSvg = '<svg class="task-status-icon failure" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else {
      iconSvg = '<span class="task-status-circle"></span>';
    }

    return `
      <li class="task-item status-${t.status}" data-task-id="${t.id}">
        <span class="task-item-indicator">${iconSvg}</span>
        <span class="task-item-text">${escapeHtml(t.text)}</span>
      </li>
    `;
  }).join('');
}

export function logAgentExecution(message, type = 'system') {
  if (!dom.terminalOutput) return;
  const line = document.createElement('div');
  line.className = `terminal-line ${type}`;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  line.innerHTML = `<span class="terminal-timestamp">[${timeStr}]</span> <span class="terminal-msg">${escapeHtml(message)}</span>`;

  dom.terminalOutput.appendChild(line);
  dom.terminalOutput.scrollTop = dom.terminalOutput.scrollHeight;
}

export function clearAgentTerminal() {
  if (dom.terminalOutput) {
    dom.terminalOutput.innerHTML = '<div class="terminal-line system">Atlas Engine Initialized. Execution feed ready.</div>';
  }
}

// ─────────────────────────────────────────────────────────────
// INITIALIZATION & EVENT BINDINGS
// ─────────────────────────────────────────────────────────────

export function initCanvas() {
  // Global custom event dispatched from markdown code blocks
  document.addEventListener('atlas:open-canvas', (e) => {
    if (e.detail) {
      openCodeInCanvas(e.detail.codeText, e.detail.language);
    }
  });

  // Canvas Open / Close
  dom.toggleCanvasBtn?.addEventListener('click', () => {
    if (!dom.artifactsCanvasPanel) return;
    dom.artifactsCanvasPanel.classList.toggle('open');
    dom.toggleCanvasBtn.classList.toggle('active', dom.artifactsCanvasPanel.classList.contains('open'));
  });

  dom.closeCanvasBtn?.addEventListener('click', () => {
    if (!dom.artifactsCanvasPanel) return;
    dom.artifactsCanvasPanel.classList.remove('open');
    dom.toggleCanvasBtn?.classList.remove('active');
  });

  // Tab Switching
  dom.canvasTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchCanvasTab(tab.getAttribute('data-tab'));
    });
  });

  // Toggle Edit Mode in Code Pane
  dom.toggleCodeEditBtn?.addEventListener('click', () => {
    toggleCodeEditMode();
  });

  // Live input sync in Code Editor
  dom.canvasCodeEditor?.addEventListener('input', () => {
    const val = dom.canvasCodeEditor.value;
    const lines = val.split('\n').length;
    const bytes = new Blob([val]).size;
    if (dom.canvasLineCount) dom.canvasLineCount.textContent = `${lines} lines • ${bytes} bytes`;
    if (state.activeArtifact) {
      state.activeArtifact.codeText = val;
    }
  });

  // Toggle Line Numbers
  dom.toggleLineNumbersBtn?.addEventListener('click', () => {
    if (!dom.canvasCodePane) return;
    const isShowing = dom.canvasCodePane.classList.toggle('show-line-numbers');
    dom.toggleLineNumbersBtn.classList.toggle('active', isShowing);
    if (isShowing && dom.canvasCodeContent) {
      const lines = (state.activeArtifact?.codeText || dom.canvasCodeContent.textContent || '').split('\n');
      const numberedHtml = lines.map((l, i) => `<span class="line-row" style="display: flex;"><span class="diff-line-num" style="min-width: 35px; color: var(--text-muted); user-select: none; margin-right: 12px; text-align: right;">${i + 1}</span><span class="line-content">${escapeHtml(l)}</span></span>`).join('\n');
      dom.canvasCodeContent.innerHTML = numberedHtml;
    } else if (state.activeArtifact) {
      dom.canvasCodeContent.textContent = state.activeArtifact.codeText || '';
      if (typeof window !== 'undefined' && window.hljs) window.hljs.highlightElement(dom.canvasCodeContent);
    }
  });

  // Send to Prompt
  dom.canvasSendToPromptBtn?.addEventListener('click', () => {
    sendCanvasArtifactToPrompt();
  });

  // Copy Canvas Content
  dom.copyCanvasContentBtn?.addEventListener('click', () => {
    const textToCopy = isEditingCode && dom.canvasCodeEditor
      ? dom.canvasCodeEditor.value
      : (state.activeArtifact?.codeText || '');

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        alertFeedback('Artifact copied to clipboard');
      }).catch(() => {
        alertFeedback('Failed to copy');
      });
    }
  });

  // Download Canvas Artifact
  dom.downloadCanvasBtn?.addEventListener('click', () => {
    const textToSave = isEditingCode && dom.canvasCodeEditor
      ? dom.canvasCodeEditor.value
      : (state.activeArtifact?.codeText || '');
    if (!textToSave) return;

    const lang = state.activeArtifact?.language || 'txt';
    const ext = lang === 'javascript' ? 'js' : lang === 'python' ? 'py' : lang === 'html' ? 'html' : lang === 'css' ? 'css' : lang === 'markdown' ? 'md' : 'txt';
    const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(state.activeArtifact?.title || 'atlas_artifact').replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
    a.click();
  });

  // Apply Diff to Local Folder
  dom.applyDiffToDiskBtn?.addEventListener('click', () => {
    applyDiffToLocalFolder();
  });

  // Clear Terminal Feed
  dom.clearTerminalFeedBtn?.addEventListener('click', () => {
    clearAgentTerminal();
  });

  // Listen for artifacts detected during message parsing
  document.addEventListener('atlas:register-artifact', (e) => {
    const detail = e.detail;
    if (detail && detail.codeText) {
      if (!state.artifacts) state.artifacts = [];
      const existingIdx = state.artifacts.findIndex(a => a.title === detail.title);
      const newArtifact = {
        id: existingIdx >= 0 ? state.artifacts[existingIdx].id : `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: detail.title || 'Artifact',
        codeText: detail.codeText || '',
        language: (detail.language || 'text').toLowerCase(),
        type: 'Code'
      };
      if (existingIdx >= 0) {
        state.artifacts[existingIdx] = newArtifact;
      } else {
        state.artifacts.push(newArtifact);
      }
      renderFileShelf();
      // If Canvas is open and has live preview, refresh preview
      if (dom.artifactsCanvasPanel?.classList.contains('open') && dom.canvasPreviewFrame && state.activeArtifact) {
        dom.canvasPreviewFrame.srcdoc = buildLivePreviewHtml(state.activeArtifact, state.artifacts);
      }
    }
  });

  // Expose global controller for agents & extensions
  if (typeof window !== 'undefined') {
    window.atlasAgent = {
      setObjectives: setAgentObjectives,
      updateObjective: updateAgentObjective,
      logExecution: logAgentExecution,
      clearTerminal: clearAgentTerminal
    };
    window.atlasCanvas = {
      openCode: openCodeInCanvas,
      updateArtifact: updateCanvasArtifact,
      switchTab: switchCanvasTab,
      applyDiff: applyDiffToLocalFolder
    };
  }
}
