/**
 * continuation-helper.js
 * In-place code continuation, intelligent code stitching,
 * and automatic session continuation normalization for existing chats.
 */

/**
 * Cleanly merges continuation code into base code:
 * - Strips redundant markdown code fences from the continuation.
 * - Detects and eliminates overlapping lines (up to 8 lines).
 * - Appends cleanly with a newline.
 */
export function stitchCodeStrings(baseCode, continuationCode) {
  if (!baseCode) return continuationCode || '';
  if (!continuationCode) return baseCode || '';

  const cleanBase = baseCode.trimEnd();
  let cleanCont = continuationCode.trimStart();

  // Strip leading markdown code fence if present
  cleanCont = cleanCont.replace(/^```[a-zA-Z0-9_-]*\r?\n?/, '');
  // Strip trailing markdown code fence if present
  cleanCont = cleanCont.replace(/\r?\n?```\s*$/, '');

  // Check for line overlaps (up to 8 lines)
  const baseLines = cleanBase.split('\n');
  const contLines = cleanCont.split('\n');

  for (let overlap = Math.min(8, baseLines.length, contLines.length); overlap > 0; overlap--) {
    const baseTail = baseLines.slice(-overlap).map(l => l.trim()).join('\n');
    const contHead = contLines.slice(0, overlap).map(l => l.trim()).join('\n');
    if (baseTail && baseTail === contHead) {
      cleanCont = contLines.slice(overlap).join('\n');
      break;
    }
  }

  return cleanBase + '\n' + cleanCont;
}

/**
 * Normalizes existing sessions where generation was cut off and followed by a
 * synthetic "Continue..." user prompt and assistant continuation message.
 * Merges the continuation directly into the original assistant message and expands the code block.
 */
export function normalizeSessionContinuations(session) {
  if (!session || !Array.isArray(session.messages) || session.messages.length < 3) {
    return false;
  }

  let modified = false;
  let i = 0;

  while (i < session.messages.length - 2) {
    const prevMsg = session.messages[i];
    const userMsg = session.messages[i + 1];
    const nextMsg = session.messages[i + 2];

    const isUserContinuation = userMsg && userMsg.role === 'user' && typeof userMsg.content === 'string' &&
      /^(?:continue(?:\s+directly)?(?:\s+from\s+where\s+you\s+left\s+off)?|continue\s+(?:the\s+)?code|continue\b)/i.test(userMsg.content.trim());

    if (prevMsg && prevMsg.role === 'assistant' && isUserContinuation && nextMsg && nextMsg.role === 'assistant') {
      const prevHasCode = /```/.test(prevMsg.content) || /<\/?(?:pre|code)/.test(prevMsg.content);
      const nextHasCode = /```/.test(nextMsg.content) || /<\/?(?:pre|code)/.test(nextMsg.content) || /^[.#@a-zA-Z0-9_\-*][\s\S]*[{;=]/m.test(nextMsg.content);

      if (prevHasCode || nextHasCode) {
        let prevContent = prevMsg.content.trimEnd();
        let nextContent = nextMsg.content.trimStart();

        const openFences = (prevContent.match(/```/g) || []).length;
        const hasUnclosedFence = openFences % 2 === 1;

        if (hasUnclosedFence) {
          const nextFenceMatch = nextContent.match(/^```[a-zA-Z0-9_-]*\r?\n([\s\S]*)/);
          const innerNext = nextFenceMatch ? nextFenceMatch[1] : nextContent;
          prevContent = prevContent + '\n' + innerNext;
        } else if (prevContent.endsWith('```')) {
          const lastFenceIdx = prevContent.lastIndexOf('```');
          const codeBeforeFence = prevContent.slice(0, lastFenceIdx).trimEnd();
          const nextFenceMatch = nextContent.match(/^```[a-zA-Z0-9_-]*\r?\n([\s\S]*)/);
          const innerNext = nextFenceMatch ? nextFenceMatch[1] : nextContent;
          prevContent = codeBeforeFence + '\n' + innerNext;
        } else {
          prevContent = prevContent + '\n\n' + nextContent;
        }

        const totalFences = (prevContent.match(/```/g) || []).length;
        if (totalFences % 2 === 1) {
          prevContent += '\n```';
        }

        prevMsg.content = prevContent;

        if (nextMsg.reasoning) {
          prevMsg.reasoning = (prevMsg.reasoning ? prevMsg.reasoning + '\n\n' : '') + nextMsg.reasoning;
        }
        if (Array.isArray(nextMsg.widgets) && nextMsg.widgets.length > 0) {
          prevMsg.widgets = [...(prevMsg.widgets || []), ...nextMsg.widgets];
        }

        session.messages.splice(i + 1, 2);
        modified = true;
        continue;
      }
    }
    i++;
  }

  return modified;
}
