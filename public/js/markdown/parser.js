/**
 * parser.js
 * Advanced Markdown & Mathematical/Scientific Formula parsing engine.
 * Integrates marked with KaTeX, mhchem, DOMPurify, and rich typography.
 */

import { normalizeMarkdownStars } from './stars.js';
import { ICONS } from '../config/constants.js';

export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function configureMarked() {
  if (typeof window === 'undefined' || !window.marked) return;

  const customRenderer = new window.marked.Renderer();

  // Table renderer supporting both object tokens (marked v12+) and classic string arguments
  customRenderer.table = function (header, body) {
    let headerContent = '';
    let bodyContent = '';

    const parseCell = (cell) => {
      if (cell && typeof cell === 'object') {
        if (this.parser && Array.isArray(cell.tokens) && cell.tokens.length > 0) {
          return this.parser.parseInline(cell.tokens);
        }
        if (typeof cell.text === 'string') {
          const cleaned = normalizeMarkdownStars(cell.text);
          return window.marked && window.marked.parseInline ? window.marked.parseInline(cleaned) : cleaned;
        }
      }
      const textStr = (cell != null ? String(cell) : '');
      const cleaned = normalizeMarkdownStars(textStr);
      return window.marked && window.marked.parseInline ? window.marked.parseInline(cleaned) : cleaned;
    };

    if (typeof header === 'object' && header !== null) {
      const token = header;
      if (token.header) {
        headerContent = Array.isArray(token.header)
          ? '<tr>' + token.header.map(cell => {
              const align = cell && cell.align ? ` align="${cell.align}"` : '';
              return `<th${align}>${parseCell(cell)}</th>`;
            }).join('') + '</tr>'
          : String(token.header);
      }
      if (token.rows) {
        bodyContent = Array.isArray(token.rows)
          ? token.rows.map(row => '<tr>' + (Array.isArray(row)
              ? row.map(cell => {
                  const align = cell && cell.align ? ` align="${cell.align}"` : '';
                  return `<td${align}>${parseCell(cell)}</td>`;
                }).join('')
              : `<td>${parseCell(row)}</td>`) + '</tr>').join('')
          : String(token.rows);
      }
    } else {
      headerContent = header || '';
      bodyContent = body || '';
    }

    return `
      <div class="table-container">
        <table class="rich-table">
          <thead>${headerContent}</thead>
          <tbody>${bodyContent}</tbody>
        </table>
      </div>
    `;
  };

  // Link renderer ensuring clean target="_blank" and no [object Object]
  customRenderer.link = function (href, title, text) {
    let cleanHref = '';
    let cleanTitle = '';
    let cleanText = '';

    if (typeof href === 'object' && href !== null) {
      cleanHref = href.href || '';
      cleanTitle = href.title || '';
      cleanText = href.text || href.raw || cleanHref;
    } else {
      cleanHref = href || '';
      cleanTitle = title || '';
      cleanText = text || cleanHref;
    }

    return `<a href="${cleanHref}" ${cleanTitle ? `title="${cleanTitle}"` : ''} target="_blank" rel="noopener noreferrer">${cleanText}</a>`;
  };

  window.marked.setOptions({
    renderer: customRenderer,
    gfm: true,
    breaks: true
  });
}

// ─────────────────────────────────────────────────────────────
// ADVANCED MATHEMATICAL & SCIENTIFIC FORMULA PARSER (KaTeX + mhchem)
// ─────────────────────────────────────────────────────────────

export function extractMathTokens(raw) {
  if (!raw) return { text: '', tokens: [] };

  const tokens = [];
  let counter = 0;

  // 1. Protect code blocks and inline code so math syntax inside code blocks is preserved as-is
  const codeBlocks = [];
  let text = raw.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    const ph = `@@ATLAS_CODE_SHIELD_${codeBlocks.length}@@`;
    codeBlocks.push({ placeholder: ph, content: match });
    return ph;
  });

  // 2. Block math: $$ ... $$
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    const trimmed = formula.trim();
    if (!trimmed) return '';
    const id = counter++;
    const ph = `@@ATLAS_MATH_BLOCK_${id}@@`;
    tokens.push({ id, placeholder: ph, formula: trimmed, isBlock: true });
    return `\n\n${ph}\n\n`;
  });

  // 3. Block math: \[ ... \]
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
    const trimmed = formula.trim();
    if (!trimmed) return '';
    const id = counter++;
    const ph = `@@ATLAS_MATH_BLOCK_${id}@@`;
    tokens.push({ id, placeholder: ph, formula: trimmed, isBlock: true });
    return `\n\n${ph}\n\n`;
  });

  // 4. Block math LaTeX environments: \begin{equation}...\end{equation}, \begin{align}...\end{align}, etc.
  const latexEnvs = 'equation|equation\\*|align|align\\*|aligned|matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|cases|gather|gather\\*|flalign|flalign\\*|split|multline|multline\\*';
  const envRegex = new RegExp(`\\\\begin\\{(${latexEnvs})\\}([\\s\\S]*?)\\\\end\\{\\1\\}`, 'g');
  text = text.replace(envRegex, (match) => {
    const trimmed = match.trim();
    if (!trimmed) return '';
    const id = counter++;
    const ph = `@@ATLAS_MATH_BLOCK_${id}@@`;
    tokens.push({ id, placeholder: ph, formula: trimmed, isBlock: true });
    return `\n\n${ph}\n\n`;
  });

  // 5. Inline math: \( ... \)
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
    const trimmed = formula.trim();
    if (!trimmed) return '';
    const id = counter++;
    const ph = `@@ATLAS_MATH_INLINE_${id}@@`;
    tokens.push({ id, placeholder: ph, formula: trimmed, isBlock: false });
    return ph;
  });

  // 6. Inline math: $...$ (ensuring we don't accidentally match currency e.g. $50 or $100.00)
  text = text.replace(/(^|[^\$\w])\$((?!\s)[^\$\n]+?(?<!\s))\$(?!\d)/g, (match, prefix, formula) => {
    const trimmed = formula.trim();
    if (/^[\d,]+(\.\d+)?$/.test(trimmed)) {
      return match;
    }
    const id = counter++;
    const ph = `@@ATLAS_MATH_INLINE_${id}@@`;
    tokens.push({ id, placeholder: ph, formula: trimmed, isBlock: false });
    return `${prefix}${ph}`;
  });

  // 7. Unshield code blocks
  for (const cb of codeBlocks) {
    text = text.replace(cb.placeholder, cb.content);
  }

  return { text, tokens };
}

export function renderMathTokenToHtml(token) {
  if (!token || !token.formula) return '';
  const formula = token.formula;
  let katexHtml = '';

  if (typeof window !== 'undefined' && window.katex) {
    try {
      katexHtml = window.katex.renderToString(formula, {
        displayMode: token.isBlock,
        throwOnError: false,
        output: 'htmlAndMathml',
        strict: false,
        trust: true
      });
    } catch (err) {
      katexHtml = token.isBlock
        ? `<div class="katex-display">$$${escapeHtml(formula)}$$</div>`
        : `<span class="katex">$${escapeHtml(formula)}$</span>`;
    }
  } else {
    katexHtml = token.isBlock
      ? `<div class="katex-display">$$${escapeHtml(formula)}$$</div>`
      : `<span class="katex">$${escapeHtml(formula)}$</span>`;
  }

  if (token.isBlock) {
    const rawEscaped = encodeURIComponent(formula);
    return `
      <div class="math-block-wrapper" data-latex="${rawEscaped}">
        <div class="math-block-header">
          <span class="math-block-tag">FORMULA</span>
          <button class="math-copy-btn" type="button" title="Copy LaTeX formula" aria-label="Copy LaTeX formula">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy LaTeX</span>
          </button>
        </div>
        <div class="math-block-body">
          ${katexHtml}
        </div>
      </div>
    `;
  } else {
    return `<span class="katex-inline-wrapper">${katexHtml}</span>`;
  }
}

export function enhanceMathBlocks(container) {
  if (!container) return;
  const copyBtns = container.querySelectorAll('.math-copy-btn');
  copyBtns.forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = 'true';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wrapper = btn.closest('.math-block-wrapper');
      if (!wrapper) return;
      const latex = decodeURIComponent(wrapper.getAttribute('data-latex') || '');
      if (!latex) return;
      navigator.clipboard.writeText(latex).then(() => {
        const span = btn.querySelector('span');
        if (span) {
          const old = span.textContent;
          span.textContent = 'Copied!';
          setTimeout(() => { span.textContent = old; }, 1800);
        }
      }).catch(() => { });
    });
  });
}

export function renderMathSafely(container) {
  if (!container) return;
  if (typeof window !== 'undefined' && window.renderMathInElement) {
    try {
      window.renderMathInElement(container, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'svg'],
        throwOnError: false,
        strict: false
      });
    } catch (e) {
      console.warn('[KaTeX auto-render]', e);
    }
  }
  enhanceMathBlocks(container);
}

export function parseMarkdownSafely(raw, isStreaming = false) {
  if (!raw) return isStreaming ? '<span class="streaming-caret" aria-hidden="true"></span>' : '';

  // 1. Extract and shield LaTeX mathematical & scientific formulas
  const { text: shieldedText, tokens: mathTokens } = extractMathTokens(raw);

  // 2. Normalize markdown stars so loose spaces or escaped stars format cleanly
  let normalizedText = normalizeMarkdownStars(shieldedText);

  // 3. Auto-close unclosed bold on current line during streaming to avoid raw star flashes
  if (isStreaming) {
    const lastLine = normalizedText.split('\n').pop() || '';
    const starMatches = lastLine.match(/\*\*/g);
    if (starMatches && starMatches.length % 2 === 1) {
      normalizedText += '**';
    }
  }

  // 4. Parse markdown with marked
  let html = (typeof window !== 'undefined' && window.marked)
    ? window.marked.parse(normalizedText)
    : escapeHtml(normalizedText);

  // 5. Sanitize HTML
  if (typeof window !== 'undefined' && window.DOMPurify) {
    html = window.DOMPurify.sanitize(html, {
      ADD_TAGS: ['kbd', 'mark', 'details', 'summary', 'svg', 'path', 'circle', 'line', 'polyline', 'polygon', 'rect', 'math', 'semantics', 'mrow', 'mo', 'mn', 'mi', 'annotation', 'mfrac', 'msup', 'msub', 'msubsup', 'msqrt', 'mroot', 'mtable', 'mtr', 'mtd', 'mtext'],
      ADD_ATTR: ['target', 'disabled', 'checked', 'type', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'd', 'points', 'width', 'height', 'aria-hidden', 'xmlns', 'display', 'data-latex']
    });
  }

  // 6. Substitute rendered KaTeX formulas back
  for (const token of mathTokens) {
    const renderedMath = renderMathTokenToHtml(token);
    if (token.isBlock) {
      const pRegex = new RegExp(`<p>\\s*${token.placeholder}\\s*<\\/p>`, 'g');
      if (pRegex.test(html)) {
        html = html.replace(pRegex, renderedMath);
      } else {
        html = html.split(token.placeholder).join(renderedMath);
      }
    } else {
      html = html.split(token.placeholder).join(renderedMath);
    }
  }

  if (isStreaming) {
    html += '<span class="streaming-caret" aria-hidden="true"></span>';
  }
  return html;
}

export function enhanceCodeBlocks(container, onOpenCanvas = null) {
  if (!container) return;
  const preBlocks = container.querySelectorAll('pre');

  preBlocks.forEach(pre => {
    if (pre.closest('.code-block-container')) return;

    const codeElem = pre.querySelector('code');
    const codeText = codeElem ? codeElem.innerText : pre.innerText;
    let language = 'code';

    if (codeElem && codeElem.className) {
      const match = codeElem.className.match(/language-(\w+)/);
      if (match) language = match[1];
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-container';

    const linesCount = codeText.split('\n').length;
    const isLongCode = linesCount > 50;

    const header = document.createElement('div');
    header.className = 'code-block-header';
    header.innerHTML = `
      <span>${language.toUpperCase()} ${isLongCode ? `(${linesCount} lines)` : ''}</span>
      <span class="code-block-actions">
        ${isLongCode ? '<button class="code-header-tool-btn fold-code-btn" type="button">Collapse</button>' : ''}
        <button class="copy-code-btn" type="button">Copy</button>
        <button class="open-canvas-btn" type="button" title="Open in Canvas" aria-label="Open code in Canvas">${ICONS.canvas || 'Canvas'}</button>
      </span>
    `;

    if (isLongCode) {
      header.querySelector('.fold-code-btn')?.addEventListener('click', (e) => {
        const isCollapsed = pre.style.maxHeight === '240px';
        if (isCollapsed) {
          pre.style.maxHeight = 'none';
          pre.style.overflow = 'visible';
          e.target.textContent = 'Collapse';
        } else {
          pre.style.maxHeight = '240px';
          pre.style.overflow = 'hidden';
          e.target.textContent = `Expand (${linesCount} lines)`;
        }
      });
    }

    header.querySelector('.copy-code-btn')?.addEventListener('click', (e) => {
      navigator.clipboard.writeText(codeText).then(() => {
        e.target.textContent = 'Copied';
        setTimeout(() => { e.target.textContent = 'Copy'; }, 1500);
      });
    });

    header.querySelector('.open-canvas-btn')?.addEventListener('click', () => {
      if (typeof onOpenCanvas === 'function') {
        onOpenCanvas(codeText, language);
      } else {
        document.dispatchEvent(new CustomEvent('atlas:open-canvas', {
          detail: { codeText, language }
        }));
      }
    });

    pre.parentNode?.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);

    if (typeof window !== 'undefined' && window.hljs && codeElem && !codeElem.classList.contains('hljs')) {
      window.hljs.highlightElement(codeElem);
    }
  });
}
