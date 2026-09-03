/**
 * stars.js
 * Utility to normalize loose markdown bold asterisks and unclosed delimiters,
 * ensuring **text** always formats cleanly as strong emphasis without raw stars.
 */

export function normalizeMarkdownStars(text) {
  if (!text || typeof text !== 'string') return text;

  // Protect code blocks and inline code so code syntax (like **kwargs or x ** 2) is untouched
  const codeBlocks = [];
  let shielded = text.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    const ph = `@@ATLAS_STARS_CODE_${codeBlocks.length}@@`;
    codeBlocks.push({ placeholder: ph, content: match });
    return ph;
  });

  // 1. Fix triple asterisks with whitespace inside: '*** text ***' -> '***text***'
  shielded = shielded.replace(/\*\*\*([ \t]+)([^\*\n]+?)\*\*\*/g, '***$2***');
  shielded = shielded.replace(/\*\*\*([^\*\n]+?)([ \t]+)\*\*\*/g, '***$1***');

  // 2. Fix bold double asterisks with leading/trailing whitespace inside:
  // e.g. '** bold text **' -> ' **bold text** '
  // e.g. '** bold text**' -> ' **bold text**'
  // e.g. '**bold text **' -> '**bold text** '
  shielded = shielded.replace(/\*\*([ \t]*)([^\*\n]+?)([ \t]*)\*\*/g, (match, leading, content, trailing) => {
    const trimmed = content.trim();
    if (!trimmed) return match;
    const left = leading ? ' ' : '';
    const right = trailing ? ' ' : '';
    return `${left}**${trimmed}**${right}`;
  });

  // 3. Fix escaped stars emitted by models: '\*\*text\*\*' -> '**text**'
  shielded = shielded.replace(/\\(\*)\\(\*)([^\*\n]+?)\\(\*)\\(\*)/g, '**$3**');

  // 4. Restore protected code blocks safely without regex replacement pitfalls
  for (const cb of codeBlocks) {
    shielded = shielded.split(cb.placeholder).join(cb.content);
  }

  return shielded;
}
