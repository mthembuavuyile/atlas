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

  test('QR widget includes Standard and Branded toggle modes', () => {
    const qrWidgetPath = path.join(__dirname, '..', 'public', 'js', 'widgets', 'qr-widget.js');
    const qrWidgetCode = fs.readFileSync(qrWidgetPath, 'utf8');

    assert.ok(qrWidgetCode.includes('data-style="standard"'), 'QR widget must support standard style');
    assert.ok(qrWidgetCode.includes('data-style="branded"'), 'QR widget must support branded style');
    assert.ok(qrWidgetCode.includes('qr-style-toggle-group'), 'QR widget must have style toggle group');
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

  test('continuation-helper.js stitches overlapping code cleanly without duplicate selectors', async () => {
    const { stitchCodeStrings } = await import('../public/js/ui/continuation-helper.js');

    const baseCode = `.btn-primary {\n  color: white;\n}\n.btn-primary:hover {\n  background: blue;\n}`;
    const continuation = `.btn-primary:hover {\n  background: blue;\n}\n.btn-secondary {\n  color: black;\n}`;

    const stitched = stitchCodeStrings(baseCode, continuation);
    assert.ok(stitched.includes('.btn-secondary'), 'Stitched code must contain continued selector');
    const matches = stitched.match(/\.btn-primary:hover/g);
    assert.strictEqual(matches.length, 1, 'Duplicate overlapping lines must be removed');
  });

  test('normalizeSessionContinuations merges split assistant messages in existing sessions', async () => {
    const { normalizeSessionContinuations } = await import('../public/js/ui/continuation-helper.js');

    const session = {
      id: 'sess_1',
      messages: [
        { role: 'user', content: 'Create portfolio website' },
        { role: 'assistant', content: 'Here is style.css:\n```css\nbody { margin: 0; }\n.btn-primary { color: white; }' },
        { role: 'user', content: 'Continue directly from where you left off. Do not repeat previous text, continue the exact code or explanation.' },
        { role: 'assistant', content: '.btn-secondary { color: black; }\n```\n### script.js\n```javascript\nconsole.log("ready");\n```' }
      ]
    };

    const modified = normalizeSessionContinuations(session);
    assert.strictEqual(modified, true, 'normalizeSessionContinuations must return true when merged');
    assert.strictEqual(session.messages.length, 2, 'Must collapse 4 messages into 2 (original prompt + stitched assistant response)');
    assert.ok(session.messages[1].content.includes('body { margin: 0; }'), 'Must preserve initial CSS');
    assert.ok(session.messages[1].content.includes('.btn-secondary { color: black; }'), 'Must preserve continued CSS');
    assert.ok(session.messages[1].content.includes('script.js'), 'Must preserve subsequent script block');
  });

  test('parser.js and style.css include bottom code-block-footer with continue button', () => {
    const parserPath = path.join(__dirname, '..', 'public', 'js', 'markdown', 'parser.js');
    const parserCode = fs.readFileSync(parserPath, 'utf8');
    const cssPath = path.join(__dirname, '..', 'public', 'css', 'style.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.ok(parserCode.includes('code-block-footer'), 'parser.js must generate code-block-footer at bottom of code');
    assert.ok(parserCode.includes('continue-code-btn'), 'parser.js footer must include continue-code-btn');
    assert.ok(css.includes('.code-block-footer'), 'style.css must define .code-block-footer');
    assert.ok(css.includes('.code-footer-btn.continue-code-btn'), 'style.css must style .code-footer-btn.continue-code-btn');
  });
});
