/**
 * canvas.js
 * Interactive artifact canvas panel, syntax-highlighted code viewer,
 * live HTML previewer, and unified diff inspector.
 */

import { state } from '../state/store.js';
import { dom } from './dom.js';
import { escapeHtml, parseMarkdownSafely, enhanceCodeBlocks, renderMathSafely } from '../markdown/parser.js';

export function renderDiffInCanvas(diffText) {
  if (!dom.diffViewerContainer) return;
  if (!diffText || !diffText.trim()) {
    dom.diffViewerContainer.innerHTML = '<div class="diff-empty-notice">No diff active. Load a unified diff or ask Atlas to propose code edits to view line changes here.</div>';
    return;
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

export function switchCanvasTab(tabKey) {
  dom.canvasTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabKey));
  if (dom.canvasCodePane) dom.canvasCodePane.classList.toggle('active', tabKey === 'code');
  if (dom.canvasPreviewPane) dom.canvasPreviewPane.classList.toggle('active', tabKey === 'preview');
  if (dom.canvasDiffPane) dom.canvasDiffPane.classList.toggle('active', tabKey === 'diff');
  if (dom.canvasMarkdownPane) dom.canvasMarkdownPane.classList.toggle('active', tabKey === 'markdown');
  const agentPane = document.getElementById('canvasAgentPane');
  if (agentPane) agentPane.classList.toggle('active', tabKey === 'agent');
}

export function updateCanvasArtifact({ title, codeText, language, type }) {
  state.activeArtifact = { title, codeText, language, type };

  if (dom.canvasDocumentTitle) dom.canvasDocumentTitle.textContent = title || 'Artifact';
  if (dom.canvasTypeTag) dom.canvasTypeTag.textContent = type || 'Code';
  if (dom.canvasLanguageBadge) dom.canvasLanguageBadge.textContent = (language || 'TEXT').toUpperCase();

  const lineCount = codeText ? codeText.split('\n').length : 0;
  const byteCount = codeText ? new Blob([codeText]).size : 0;
  if (dom.canvasLineCount) dom.canvasLineCount.textContent = `${lineCount} lines • ${byteCount} bytes`;

  if (dom.canvasCodeContent) {
    dom.canvasCodeContent.textContent = codeText;
    if (typeof window !== 'undefined' && window.hljs) window.hljs.highlightElement(dom.canvasCodeContent);
  }

  if (dom.canvasMarkdownContent && typeof window !== 'undefined' && window.marked) {
    dom.canvasMarkdownContent.innerHTML = parseMarkdownSafely(codeText);
    enhanceCodeBlocks(dom.canvasMarkdownContent, openCodeInCanvas);
    renderMathSafely(dom.canvasMarkdownContent);
  }

  if (dom.canvasPreviewFrame && (language === 'html' || codeText.includes('<!DOCTYPE') || codeText.includes('<html'))) {
    dom.canvasPreviewFrame.srcdoc = codeText;
  }

  // Auto-detect diff or patch syntax and populate diff viewer
  const isDiff = language === 'diff' || codeText.includes('--- a/') || codeText.includes('+++ b/') || (codeText.includes('@@') && (codeText.includes('+') || codeText.includes('-')));
  if (isDiff) {
    renderDiffInCanvas(codeText);
    const canvasDiffTab = document.querySelector('.canvas-tab[data-tab="diff"]');
    if (canvasDiffTab) canvasDiffTab.style.display = 'inline-flex';
  }
}

export function openCodeInCanvas(codeText, language) {
  updateCanvasArtifact({
    title: `Code (${language})`,
    codeText,
    language,
    type: 'Code Snippet'
  });
  dom.artifactsCanvasPanel?.classList.add('open');
  dom.toggleCanvasBtn?.classList.add('active');
  switchCanvasTab(language === 'html' ? 'preview' : 'code');
}

export function initCanvas() {
  // Listen for global custom event dispatched from enhanceCodeBlocks
  document.addEventListener('atlas:open-canvas', (e) => {
    if (e.detail) {
      openCodeInCanvas(e.detail.codeText, e.detail.language);
    }
  });

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

  dom.canvasTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchCanvasTab(tab.getAttribute('data-tab'));
    });
  });

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

  dom.copyCanvasContentBtn?.addEventListener('click', () => {
    if (state.activeArtifact?.codeText) {
      navigator.clipboard.writeText(state.activeArtifact.codeText).then(() => {
        alert('Artifact copied to clipboard');
      });
    }
  });

  dom.downloadCanvasBtn?.addEventListener('click', () => {
    if (!state.activeArtifact?.codeText) return;
    const ext = state.activeArtifact.language === 'javascript' ? 'js' : state.activeArtifact.language === 'python' ? 'py' : state.activeArtifact.language === 'html' ? 'html' : 'txt';
    const blob = new Blob([state.activeArtifact.codeText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `atlas_artifact_${Date.now()}.${ext}`;
    a.click();
  });
}
