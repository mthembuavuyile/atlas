import { createWidgetShell, escapeHtml, WIDGET_ICONS } from './widget-utils.js';

export function renderMathWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const expr = data.expression || '';
    const result = data.result || '';
    const op = data.operation || 'COMPUTATION';

    let mathHtml = '';
    if (window.katex) {
        try {
            const renderedExpr = window.katex.renderToString(expr, {
                displayMode: false,
                throwOnError: false,
                output: 'htmlAndMathml',
                strict: false,
                trust: true
            });
            const renderedResult = window.katex.renderToString(result, {
                displayMode: true,
                throwOnError: false,
                output: 'htmlAndMathml',
                strict: false,
                trust: true
            });
            mathHtml = `
                <div class="math-expression-display katex-rendered">
                    <span class="math-expr-label">Input:</span> <span class="math-expr-val">${renderedExpr}</span>
                </div>
                <div class="math-result-display katex-rendered">
                    ${renderedResult}
                </div>
            `;
        } catch (e) {
            mathHtml = `
                <div class="math-expression-display">$$${escapeHtml(expr)}$$</div>
                <div class="math-result-display">$$${escapeHtml(result)}$$</div>
            `;
        }
    } else {
        mathHtml = `
            <div class="math-expression-display">Input: ${escapeHtml(expr)}</div>
            <div class="math-result-display">= ${escapeHtml(result)}</div>
        `;
    }

    const content = `
        <div class="math-operation-tag">
            <span class="widget-badge">${escapeHtml(op.toUpperCase())}</span>
        </div>
        <div class="math-render-container">
            ${mathHtml}
        </div>
    `;

    return createWidgetShell('math', WIDGET_ICONS.math, 'Mathematical Computation Engine', content);
}
