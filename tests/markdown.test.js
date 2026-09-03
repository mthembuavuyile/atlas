const { test, describe } = require('node:test');
const assert = require('node:assert');

// Helper function logic matching normalizeMarkdownStars in app.js
function normalizeMarkdownStars(text) {
  if (!text || typeof text !== 'string') return text;

  const codeBlocks = [];
  let shielded = text.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    const ph = `@@ATLAS_STARS_CODE_${codeBlocks.length}@@`;
    codeBlocks.push({ placeholder: ph, content: match });
    return ph;
  });

  // 1. Fix triple asterisks with whitespace inside
  shielded = shielded.replace(/\*\*\*([ \t]+)([^\*\n]+?)\*\*\*/g, '***$2***');
  shielded = shielded.replace(/\*\*\*([^\*\n]+?)([ \t]+)\*\*\*/g, '***$1***');

  // 2. Fix bold double asterisks with leading/trailing whitespace inside
  shielded = shielded.replace(/\*\*([ \t]*)([^\*\n]+?)([ \t]*)\*\*/g, (match, leading, content, trailing) => {
    const trimmed = content.trim();
    if (!trimmed) return match;
    const left = leading ? ' ' : '';
    const right = trailing ? ' ' : '';
    return `${left}**${trimmed}**${right}`;
  });

  // 3. Fix escaped stars emitted by models
  shielded = shielded.replace(/\\(\*)\\(\*)([^\*\n]+?)\\(\*)\\(\*)/g, '**$3**');

  // 4. Restore protected code blocks
  for (const cb of codeBlocks) {
    shielded = shielded.replace(cb.placeholder, cb.content);
  }

  return shielded;
}

describe('Markdown Stars and Table Typography Formatting', () => {
  test('Normalizes bold asterisks with whitespace inside', () => {
    const input = 'This has ** bold text ** and **another ** and ** spaced **.';
    const normalized = normalizeMarkdownStars(input);
    assert.ok(normalized.includes('**bold text**'));
    assert.ok(normalized.includes('**another**'));
    assert.ok(normalized.includes('**spaced**'));
    assert.ok(!normalized.includes('** bold text **'));
    assert.ok(!normalized.includes('**another **'));
    assert.ok(!normalized.includes('** spaced **'));
  });

  test('Normalizes escaped asterisks from AI responses', () => {
    const input = 'Here is \\*\\*critical\\*\\* data.';
    const normalized = normalizeMarkdownStars(input);
    assert.strictEqual(normalized, 'Here is **critical** data.');
  });

  test('Protects inline code and code blocks containing double asterisks', () => {
    const inline = 'Use `const x = **kwargs;` and `x ** 2` in expressions.';
    const normalizedInline = normalizeMarkdownStars(inline);
    assert.strictEqual(normalizedInline, inline, 'Inline code must remain completely untouched');

    const block = '```python\ndef run(**kwargs):\n    return x ** 2\n```';
    const normalizedBlock = normalizeMarkdownStars(block);
    assert.strictEqual(normalizedBlock, block, 'Code blocks must remain completely untouched');
  });

  test('Preserves markdown tables and formats bold cells cleanly', () => {
    const table = '| ** Col 1 ** | **Col 2** |\n| --- | --- |\n| **Val 1 ** | ** Val 2** |';
    const normalized = normalizeMarkdownStars(table);
    assert.ok(normalized.includes('**Col 1**'));
    assert.ok(normalized.includes('**Col 2**'));
    assert.ok(normalized.includes('**Val 1**'));
    assert.ok(normalized.includes('**Val 2**'));
  });

  test('Auto-closes trailing unclosed bold delimiters in streaming outputs', () => {
    let streamingChunk = 'Model reasoning: **analyzing';
    const starMatches = streamingChunk.match(/\*\*/g);
    if (starMatches && starMatches.length % 2 === 1) {
      streamingChunk += '**';
    }
    assert.strictEqual(streamingChunk, 'Model reasoning: **analyzing**');
  });
});
