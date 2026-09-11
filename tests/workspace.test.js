const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

describe('Living AI Workspace & Canvas Architecture', () => {
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  test('public/index.html includes all core workspace canvas elements', () => {
    // 1. Multi-file shelf
    assert.ok(indexHtml.includes('id="canvasFileShelf"'), 'Canvas must include canvasFileShelf');

    // 2. Send to prompt action in header
    assert.ok(indexHtml.includes('id="canvasSendToPromptBtn"'), 'Canvas must include canvasSendToPromptBtn');

    // 3. In-place code editor & controls
    assert.ok(indexHtml.includes('id="toggleCodeEditBtn"'), 'Canvas must include toggleCodeEditBtn');
    assert.ok(indexHtml.includes('id="canvasCodeEditor"'), 'Canvas must include canvasCodeEditor textarea');

    // 4. Diff header bar with local folder sync
    assert.ok(indexHtml.includes('id="diffHeaderBar"'), 'Canvas must include diffHeaderBar');
    assert.ok(indexHtml.includes('id="applyDiffToDiskBtn"'), 'Diff pane must include applyDiffToDiskBtn');

    // 5. Agent task checklist & terminal feed
    assert.ok(indexHtml.includes('id="agentTaskChecklist"'), 'Agent pane must include agentTaskChecklist');
    assert.ok(indexHtml.includes('id="agentTaskList"'), 'Agent pane must include agentTaskList');
    assert.ok(indexHtml.includes('id="agentTaskCountBadge"'), 'Agent pane must include agentTaskCountBadge');
    assert.ok(indexHtml.includes('id="agentTerminalFeed"'), 'Agent pane must include agentTerminalFeed');
    assert.ok(indexHtml.includes('id="terminalOutput"'), 'Agent pane must include terminalOutput');
    assert.ok(indexHtml.includes('id="clearTerminalFeedBtn"'), 'Agent pane must include clearTerminalFeedBtn');
  });

  test('QR widget includes workspace actions: Download PNG, Copy Data, Send to Prompt', () => {
    const qrWidgetPath = path.join(__dirname, '..', 'public', 'js', 'widgets', 'qr-widget.js');
    const qrWidgetCode = fs.readFileSync(qrWidgetPath, 'utf8');

    assert.ok(qrWidgetCode.includes('Download PNG'), 'QR widget must have Download PNG button');
    assert.ok(qrWidgetCode.includes('Copy Data'), 'QR widget must have Copy Data button');
    assert.ok(qrWidgetCode.includes('Send to Prompt'), 'QR widget must have Send to Prompt button');
  });

  test('public/js/ui/canvas.js exports required workspace orchestrators and handlers', () => {
    const canvasPath = path.join(__dirname, '..', 'public', 'js', 'ui', 'canvas.js');
    const canvasCode = fs.readFileSync(canvasPath, 'utf8');

    assert.ok(canvasCode.includes('renderFileShelf'), 'canvas.js must export renderFileShelf');
    assert.ok(canvasCode.includes('selectArtifactByIndex'), 'canvas.js must export selectArtifactByIndex');
    assert.ok(canvasCode.includes('toggleCodeEditMode'), 'canvas.js must export toggleCodeEditMode');
    assert.ok(canvasCode.includes('sendCanvasArtifactToPrompt'), 'canvas.js must export sendCanvasArtifactToPrompt');
    assert.ok(canvasCode.includes('applyDiffToLocalFolder'), 'canvas.js must export applyDiffToLocalFolder');
    assert.ok(canvasCode.includes('setAgentObjectives'), 'canvas.js must export setAgentObjectives');
    assert.ok(canvasCode.includes('logAgentExecution'), 'canvas.js must export logAgentExecution');
  });

  test('public/css/style.css defines styling for workspace canvas elements', () => {
    const cssPath = path.join(__dirname, '..', 'public', 'css', 'style.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.ok(css.includes('.canvas-file-shelf'), 'CSS must define .canvas-file-shelf');
    assert.ok(css.includes('.file-shelf-pill'), 'CSS must define .file-shelf-pill');
    assert.ok(css.includes('.canvas-code-editor'), 'CSS must define .canvas-code-editor');
    assert.ok(css.includes('.diff-header-bar'), 'CSS must define .diff-header-bar');
    assert.ok(css.includes('.diff-action-btn'), 'CSS must define .diff-action-btn');
    assert.ok(css.includes('.agent-task-checklist'), 'CSS must define .agent-task-checklist');
    assert.ok(css.includes('.terminal-output'), 'CSS must define .terminal-output');
    assert.ok(css.includes('.atlas-transient-toast'), 'CSS must define .atlas-transient-toast');
  });
});
