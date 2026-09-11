/**
 * chat-service.js
 * Core technical reasoning & execution engine.
 * Handles context checking, SSE stream reading, retry logic, abort controllers, and error cards.
 */

import { state } from '../state/store.js';
import { dom } from '../ui/dom.js';
import { API_BASE, ICONS } from '../config/constants.js';
import { parseMarkdownSafely, enhanceCodeBlocks, enhanceMathBlocks, renderMathSafely, escapeHtml, detectCodeFilename } from '../markdown/parser.js';
import { openCodeInCanvas } from '../ui/canvas.js';
import { getActiveSession, saveSessions, updateSessionMetrics, updateContextEstimator, fetchSessionTitle } from '../ui/session-manager.js';
import { stitchCodeStrings } from '../ui/continuation-helper.js';
import { renderMessageItem, startStatusAnimation, scrollToBottom, renderSessionMessages } from '../ui/message-renderer.js';
import { detectLocalWidgetIntent, resolveSlashCommand, runLocalWidget, detectAutonomousNeed } from './intent-router.js';
import { syncWebSearchUI } from '../ui/modals.js';

export function buildProjectContext() {
  if (!state.projectFiles || state.projectFiles.length === 0) return '';
  let ctx = '\n\n--- PROJECT CONTEXT FILES ---\n';
  state.projectFiles.forEach(f => {
    ctx += `\nFile: ${f.path}\n\`\`\`\n${f.content}\n\`\`\`\n`;
  });
  ctx += '--- END PROJECT CONTEXT ---\n';
  return ctx;
}

export function formatUserFriendlyError(err, statusCode = null) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      title: 'Connection Offline',
      desc: 'You appear to be offline. Please check your network connection.',
      action: 'We will send your chat when you reconnect.',
      type: 'offline',
      canRetry: true
    };
  }

  if (err && err.name === 'AbortError') {
    return {
      title: 'Investigation Halted',
      desc: 'Generation was stopped by user.',
      action: '',
      type: 'info',
      canRetry: false
    };
  }

  const raw = (err && (err.message || String(err))) || '';
  const lower = raw.toLowerCase();
  const effectiveStatus = statusCode || (err && err.status) || null;

  if (
    lower.includes('free-models-per-day') ||
    lower.includes('daily free reasoning quota') ||
    lower.includes('free tier daily') ||
    lower.includes('purchase credits to raise') ||
    lower.includes('quota reached')
  ) {
    return {
      title: 'Daily Free Quota Reached',
      desc: 'The shared daily free reasoning quota has been reached (50 requests/day). It automatically resets at midnight UTC.',
      action: 'Configure your personal OpenRouter key in Settings for immediate, private quota.',
      type: 'warning',
      canRetry: false,
      openSettings: true
    };
  }

  if (effectiveStatus === 401 || lower.includes('api key not configured') || lower.includes('unauthorized') || lower.includes('invalid api key')) {
    return {
      title: 'API Key Required',
      desc: 'An OpenRouter API key is required to complete this request.',
      action: 'You can supply your own OpenRouter key in Settings to continue.',
      type: 'warning',
      canRetry: false,
      openSettings: true
    };
  }

  if (effectiveStatus === 429 || lower.includes('rate limit') || lower.includes('too many requests')) {
    return {
      title: 'Rate Limit Reached',
      desc: 'The reasoning engines are momentarily rate-limited or busy.',
      action: 'Please wait a few seconds before trying again, or configure a personal key in Settings.',
      type: 'warning',
      canRetry: true,
      openSettings: true
    };
  }

  if (effectiveStatus === 413 || lower.includes('payload too large')) {
    return {
      title: 'File Too Large',
      desc: 'This file is too large to be processed.',
      action: 'Choose a file under 25MB and try again.',
      type: 'warning',
      canRetry: false
    };
  }

  if (effectiveStatus === 403 || lower.includes('unauthorized model') || lower.includes('not available')) {
    return {
      title: 'Model Unavailable',
      desc: 'This reasoning model is momentarily unavailable.',
      action: 'Please switch to another model from the menu.',
      type: 'warning',
      canRetry: false
    };
  }

  if (
    effectiveStatus === 500 ||
    effectiveStatus === 503 ||
    effectiveStatus === 504 ||
    effectiveStatus === 502 ||
    lower.includes('high demand') ||
    lower.includes('concurrency') ||
    lower.includes('overloaded') ||
    lower.includes('temporarily unavailable') ||
    lower.includes('timed out') ||
    lower.includes('timeout')
  ) {
    return {
      title: 'Engines Busy or Unreachable',
      desc: 'Our servers are resting or experiencing high demand.',
      action: 'Your message is saved. Please try your question again in a moment.',
      type: 'warning',
      canRetry: true
    };
  }

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network error') || lower.includes('load failed')) {
    return {
      title: 'Connection Interrupted',
      desc: 'Unable to reach the servers.',
      action: 'Check your internet connection and try again.',
      type: 'offline',
      canRetry: true
    };
  }

  if (effectiveStatus === 400 && lower.includes('system prompt')) {
    return {
      title: 'Instructions Too Long',
      desc: 'Your custom instructions exceed the allowed character limit.',
      action: 'Please shorten them in Studio Parameters.',
      type: 'warning',
      canRetry: false
    };
  }

  const isGeneric = !raw || lower.includes('request failed') || lower.includes('object object');
  return {
    title: 'Service Notice',
    desc: isGeneric ? 'Something went wrong while processing your request.' : raw,
    action: 'Please try again shortly or configure a custom key in Settings.',
    type: 'error',
    canRetry: true,
    openSettings: effectiveStatus === 429 || effectiveStatus === 401 || lower.includes('key')
  };
}

export function renderErrorCard(errorInfo) {
  const icon = errorInfo.type === 'offline'
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.56 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

  const retryBtn = errorInfo.canRetry
    ? `<button class="atlas-retry-btn" onclick="window.atlasRetryLast()" style="padding: 6px 12px; background: var(--border-light); border: 1px solid var(--border-focus); border-radius: 4px; color: var(--text-main); font-family: inherit; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">${ICONS.retry} Try Again</button>`
    : '';

  const settingsBtn = errorInfo.openSettings
    ? `<button class="atlas-settings-btn" onclick="window.atlasOpenSettings && window.atlasOpenSettings('general-settings')" style="padding: 6px 12px; background: rgba(251,169,25,0.14); border: 1px solid var(--accent-primary, #fba919); border-radius: 4px; color: var(--accent-primary, #fba919); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> Configure Key in Settings</button>`
    : '';

  const actionText = errorInfo.action ? `<div class="atlas-error-action" style="margin-top: 4px; font-weight: 500;">${escapeHtml(errorInfo.action)}</div>` : '';

  const actionsRow = (retryBtn || settingsBtn)
    ? `<div class="atlas-error-actions-row" style="margin-top: 10px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">${settingsBtn}${retryBtn}</div>`
    : '';

  return `
    <div class="atlas-error-card ${errorInfo.type}">
      <div class="atlas-error-icon">${icon}</div>
      <div class="atlas-error-body">
        <div class="atlas-error-title">${escapeHtml(errorInfo.title)}</div>
        <div class="atlas-error-desc">${escapeHtml(errorInfo.desc)}</div>
        ${actionText}
        ${actionsRow}
      </div>
    </div>
  `;
}

export async function executeChatTurn(session) {
  if (!session || state.isGenerating) return;

  // 1. Safely resolve user prompt for local intents & slash command routing
  const lastUserMessage = [...session.messages].reverse().find(m => m && m.role === 'user');
  const prompt = (lastUserMessage && typeof lastUserMessage.content === 'string')
    ? lastUserMessage.content
    : (state.lastUserPrompt || '');

  // Prepare assistant message bubble & status animator
  const { bubble, wrapper, widgetsContainer, setReasoning } = renderMessageItem('assistant', '', '', true);
  let statusAnimator = startStatusAnimation(bubble, state.activeMode);
  state.isGenerating = true;

  if (dom.stopGenerationBtn) dom.stopGenerationBtn.style.display = 'flex';
  if (dom.sendBtn) dom.sendBtn.style.display = 'none';
  if (dom.streamingIndicator) dom.streamingIndicator.style.display = 'flex';

  let accumulatedContent = '';
  let accumulatedReasoning = '';
  let accumulatedWidgets = [];
  let inThinkTag = false;
  let lastRenderTime = 0;

  state.abortController = new AbortController();

  try {
    const payloadMessages = session.messages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant'))
      .map(m => ({ role: m.role, content: m.content }));
    const projectContext = buildProjectContext();
    if (projectContext && payloadMessages.length > 0) {
      payloadMessages[payloadMessages.length - 1].content += projectContext;
    }
    let requestWebSearch = state.isWebSearch;
    let requestDeepReasoning = state.isDeepReasoning;

    // Balanced Autonomous Agentic Intent Detection
    const autoNeed = detectAutonomousNeed(prompt);
    let autoWebActivated = false;

    if (autoNeed.needsWeb && !state.isWebSearch) {
      state.isWebSearch = true;
      requestWebSearch = true;
      autoWebActivated = true;
      syncWebSearchUI();
      if (dom.composerBox) {
        dom.composerBox.classList.add('auto-web-active');
      }
    }

    if (autoNeed.needsReasoning && !state.isDeepReasoning) {
      state.isDeepReasoning = true;
      requestDeepReasoning = true;
      if (dom.deepThinkToggleBtn) {
        dom.deepThinkToggleBtn.classList.add('active-web');
      }
      if (dom.composerBox) {
        dom.composerBox.classList.add('auto-reasoning-active');
      }
    }

    if (autoWebActivated) {
      let agentLog = bubble.querySelector('.agent-activity-log');
      if (!agentLog) {
        agentLog = document.createElement('div');
        agentLog.className = 'agent-activity-log';
        agentLog.style.cssText = 'margin: 1rem 0; padding: 0.75rem; background: rgba(0,0,0,0.2); border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); font-family: "JetBrains Mono", monospace; font-size: 0.8rem; color: #a1a1aa; display: flex; flex-direction: column; gap: 0.5rem;';
        bubble.appendChild(agentLog);
      }
      const autoItem = document.createElement('div');
      autoItem.className = 'agent-log-item';
      autoItem.innerHTML = `
        <span style="display: flex; align-items: center; gap: 0.5rem; color: #fba919;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg>
          <span>Autonomous Intent: <strong>Activated Live Web Grounding</strong> (${escapeHtml(autoNeed.reason || 'Temporal query detected')})</span>
        </span>
      `;
      agentLog.appendChild(autoItem);
    }

    const widgetContext = { session, bubble, widgetsContainer, statusAnimator, accumulatedWidgets };

    // 2. Offline Capabilities: Slash Command Routing
    const slash = resolveSlashCommand(prompt);
    if (slash) {
      if (slash.isWebSearch) {
        requestWebSearch = true;
        if (slash.overrideText && payloadMessages.length > 0) {
          payloadMessages[payloadMessages.length - 1].content = `${slash.overrideText}${projectContext || ''}`;
        }
      } else if (slash.toolToCall) {
        await runLocalWidget(slash.toolToCall, slash.argsPayload, slash.label, widgetContext);
        return;
      }
    }

    // 3. Local Deterministic Intent Detection
    const localIntent = detectLocalWidgetIntent(prompt);
    if (localIntent) {
      await runLocalWidget(localIntent.tool, localIntent.args, localIntent.label, widgetContext);
      return;
    }

    // 4. Intelligent Context Limit Pre-Check
    const rawTextForTokenCheck = JSON.stringify(payloadMessages);
    const estimatedTokens = Math.ceil(rawTextForTokenCheck.length / 4);
    const CONTEXT_LIMIT = 200000;
    if (estimatedTokens > CONTEXT_LIMIT) {
      throw new Error(`Context limit warning: Your request is approximately ${estimatedTokens.toLocaleString()} tokens, which exceeds the safe threshold of ${CONTEXT_LIMIT.toLocaleString()} tokens. Please clear the chat history or remove large files before proceeding to avoid dropping context.`);
    }

    let response = null;
    let retries = 3;
    let delay = 1000;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        response = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(state.apiKey ? { 'X-OpenRouter-Key': state.apiKey } : {})
          },
          signal: state.abortController ? state.abortController.signal : undefined,
          body: JSON.stringify({
            model: state.currentModel,
            messages: payloadMessages,
            stream: true,
            mode: state.activeMode,
            systemPrompt: state.systemPrompt,
            temperature: state.temperature,
            webSearch: requestWebSearch,
            reasoning: requestDeepReasoning,
            maxTokens: 4096,
            apiKey: state.apiKey || undefined
          })
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          const customErr = new Error(errJson.error || 'Request failed');
          customErr.status = response.status;
          throw customErr;
        }
        break; // Success, exit retry loop
      } catch (err) {
        if (err.name === 'AbortError') throw err;

        // Immediate check: If daily quota is reached, do not waste time retrying 3 times
        const errMsgLower = (err.message || '').toLowerCase();
        const isQuotaExhausted = errMsgLower.includes('free-models-per-day') ||
                                 errMsgLower.includes('daily free reasoning quota') ||
                                 errMsgLower.includes('free tier daily') ||
                                 errMsgLower.includes('purchase credits to raise') ||
                                 errMsgLower.includes('quota reached');

        if (isQuotaExhausted) {
          throw err;
        }

        if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429 && err.status !== 408) {
          throw err;
        }

        if (attempt === retries) {
          // Preserve the original server error message and HTTP status code
          const finalErr = new Error(err.message || `Connection failed after ${retries} attempts.`);
          finalErr.status = err.status || 500;
          throw finalErr;
        }

        console.warn(`[Atlas Network Guard] Request failed (attempt ${attempt}/${retries}): ${err.message}. Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }

    if (!response || !response.body) {
      throw new Error('No readable response stream received from the server.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const onAbort = () => {
      try { reader.cancel(); } catch (_) {}
    };
    state.abortController?.signal?.addEventListener('abort', onAbort, { once: true });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(dataStr);

          // Agentic ReAct Loop UI Feedback
          if (parsed.__tool_start__) {
            if (statusAnimator) { statusAnimator.stop(); statusAnimator = null; }
            const rawToolName = parsed.__tool_start__.name;
            const toolName = rawToolName.replace(/_/g, ' ');
            const toolId = `tool-${Date.now()}`;

            // Highlight composer Web Search toggle and container if AI autonomously invoked search_web
            if (rawToolName === 'search_web') {
              state.isWebSearch = true;
              syncWebSearchUI();
              if (dom.composerBox) {
                dom.composerBox.classList.add('auto-web-active');
              }
            }

            let agentLog = bubble.querySelector('.agent-activity-log');
            if (!agentLog) {
              agentLog = document.createElement('div');
              agentLog.className = 'agent-activity-log';
              agentLog.style.cssText = 'margin: 1rem 0; padding: 0.75rem; background: rgba(0,0,0,0.2); border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); font-family: "JetBrains Mono", monospace; font-size: 0.8rem; color: #a1a1aa; display: flex; flex-direction: column; gap: 0.5rem;';
              bubble.appendChild(agentLog);
            }

            const logItem = document.createElement('div');
            logItem.className = 'agent-log-item';
            logItem.id = toolId;
            logItem.dataset.tool = rawToolName;
            logItem.innerHTML = `
              <span style="display: flex; align-items: center; gap: 0.5rem;">
                <svg class="tool-spinner" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                <span style="color: #FBA919;">Executing tool: <strong style="color: #fff; font-weight: 500;">${toolName}</strong></span>
              </span>
            `;
            agentLog.appendChild(logItem);
            scrollToBottom(false);
            continue;
          }

          if (parsed.__tool_done__) {
            const toolName = parsed.__tool_done__.name;

            // Reset composer Web Search button if AI finished search_web
            if (toolName === 'search_web') {
              setTimeout(() => {
                syncWebSearchUI();
              }, 1200);
            }

            const agentLog = bubble.querySelector('.agent-activity-log');
            if (agentLog) {
              const logItem = agentLog.querySelector(`[data-tool="${toolName}"]:last-child`);
              if (logItem) {
                const isSuccess = parsed.__tool_done__.success;
                const icon = isSuccess
                  ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                  : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
                const color = isSuccess ? '#10b981' : '#ef4444';

                logItem.innerHTML = `
                  <span style="display: flex; align-items: center; gap: 0.5rem; opacity: 0.8;">
                    ${icon}
                    <span style="color: ${color};">Finished: <strong style="color: #fff; font-weight: 500;">${toolName.replace(/_/g, ' ')}</strong></span>
                  </span>
                `;
              }
            }
            continue;
          }

          if (parsed.__widget__) {
            if (statusAnimator) { statusAnimator.stop(); statusAnimator = null; }

            // Deduplicate redundant widget payloads of same type and query within this turn
            const widgetType = parsed.__widget__.type;
            const widgetQuery = (parsed.__widget__.data?.query || parsed.__widget__.data?.prompt || parsed.__widget__.data?.subreddit || '').trim().toLowerCase();
            const isDuplicateWidget = accumulatedWidgets.some(w =>
              w.type === widgetType &&
              (w.data?.query || w.data?.prompt || w.data?.subreddit || '').trim().toLowerCase() === widgetQuery &&
              widgetQuery.length > 0
            );

            if (!isDuplicateWidget) {
              accumulatedWidgets.push(parsed.__widget__);
              if (window.atlasRenderWidget) {
                try {
                  const widgetHtml = window.atlasRenderWidget(parsed.__widget__.type, parsed.__widget__.data);
                  if (widgetHtml && widgetsContainer) {
                    const widgetBox = document.createElement('div');
                    widgetBox.className = 'widget-mount-point';
                    widgetBox.innerHTML = widgetHtml;
                    widgetsContainer.appendChild(widgetBox);
                    if (window.atlasMountWidget) {
                      try {
                        window.atlasMountWidget(widgetBox, parsed.__widget__.type, parsed.__widget__.data);
                      } catch (mErr) {
                        console.warn('[Atlas Widgets] Streaming widget mount error:', mErr);
                      }
                    }
                    scrollToBottom(false);
                  }
                } catch (wErr) {
                  console.warn('[Atlas Widgets] Streaming widget render error:', wErr);
                }
              }
            }
            continue;
          }

          if (parsed.error) {
            throw new Error(parsed.error);
          }

          const choice = parsed.choices?.[0];
          const rawContent = choice?.delta?.content ?? choice?.delta?.text ?? choice?.text ?? '';
          const rawReasoning = choice?.delta?.reasoning ?? choice?.delta?.reasoning_content ?? choice?.delta?.thought ?? '';

          if (rawReasoning) {
            accumulatedReasoning += rawReasoning;
            setReasoning(accumulatedReasoning);
            scrollToBottom(false);
          }

          if (rawContent.includes('<think>')) {
            inThinkTag = true;
          }

          if (inThinkTag) {
            if (rawContent.includes('</think>')) {
              inThinkTag = false;
              const parts = rawContent.split('</think>');
              accumulatedReasoning += parts[0].replace('<think>', '');
              accumulatedContent += parts[1] || '';
            } else {
              accumulatedReasoning += rawContent.replace('<think>', '');
            }
            setReasoning(accumulatedReasoning);
            scrollToBottom(false);
          } else if (rawContent) {
            if (statusAnimator) { statusAnimator.stop(); statusAnimator = null; }
            accumulatedContent += rawContent;

            const now = Date.now();
            if (now - lastRenderTime > 35) {
              lastRenderTime = now;
              bubble.innerHTML = parseMarkdownSafely(accumulatedContent, true);
              enhanceCodeBlocks(bubble, openCodeInCanvas);
              enhanceMathBlocks(bubble);
              scrollToBottom(false);
            }
          }
        } catch (jsonErr) {}
      }
    }

    if (statusAnimator) { statusAnimator.stop(); statusAnimator = null; }

    if (!accumulatedContent) {
      accumulatedContent = accumulatedReasoning || '*(The model returned an empty response. This usually happens due to a safety filter or a temporary model glitch. Please try again or switch to a different model.)*';
    } else {
      // Detect and separate untagged "Thought Process" blocks leaked into content
      const thoughtPrefixMatch = accumulatedContent.match(/^(?:Thought Process|Thinking Process|Thought|Reasoning|Chain of Thought)[:\s]*\n*([\s\S]*?)(?:\n\n(?=[A-Z0-9#*`📍])|$)/i);
      if (thoughtPrefixMatch && thoughtPrefixMatch[1]) {
        const extracted = thoughtPrefixMatch[1].trim();
        if (!accumulatedReasoning) {
          accumulatedReasoning = extracted;
          setReasoning(accumulatedReasoning);
        }
        accumulatedContent = accumulatedContent.slice(thoughtPrefixMatch[0].length).trim();
      }

      // Strip self-referential monologue loops (e.g. "The user says '...' - they're referring to... Actually, let me re-read...")
      const monologueMatch = accumulatedContent.match(/^(?:The user says|The user is asking|Looking at the conversation history|Actually, let me re-read)[\s\S]*?\n\n(?=[A-Z0-9#*`📍]|$)/i);
      if (monologueMatch) {
        accumulatedContent = accumulatedContent.slice(monologueMatch[0].length).trim();
      }
    }

    if (accumulatedReasoning) {
      setReasoning(accumulatedReasoning);
    }

    bubble.innerHTML = parseMarkdownSafely(accumulatedContent, false);
    enhanceCodeBlocks(bubble, openCodeInCanvas);
    renderMathSafely(bubble);

    session.messages.push({
      role: 'assistant',
      content: accumulatedContent,
      reasoning: accumulatedReasoning,
      widgets: accumulatedWidgets
    });
    session.updatedAt = new Date().toISOString();
    saveSessions();
    updateSessionMetrics();

    // Trigger deferred title generation on first turn now that chat stream completed
    const userMsgCount = session.messages.filter(m => m.role === 'user').length;
    if (userMsgCount === 1 && state.lastUserPrompt) {
      fetchSessionTitle(state.lastUserPrompt, session.id);
    }

  } catch (err) {
    if (statusAnimator) { statusAnimator.stop(); statusAnimator = null; }

    if (accumulatedContent || accumulatedReasoning) {
      session.messages.push({
        role: 'assistant',
        content: accumulatedContent,
        reasoning: accumulatedReasoning,
        widgets: accumulatedWidgets,
        _partial: true
      });
      session.updatedAt = new Date().toISOString();
      saveSessions();
    }

    const errorInfo = formatUserFriendlyError(err, err.status);
    const errorHtml = renderErrorCard(errorInfo);

    if (accumulatedContent) {
      const interruptBadge = `<div class="stream-interrupt-badge" style="margin-top: 1rem; padding: 0.5rem; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 4px; display: flex; align-items: center; gap: 0.5rem; color: #ef4444; font-size: 0.85rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Stream Interrupted. Your partial response has been saved.</div>`;
      bubble.innerHTML = parseMarkdownSafely(accumulatedContent, false) + interruptBadge;
    } else {
      bubble.innerHTML = errorHtml;
    }
  } finally {
    if (statusAnimator) { statusAnimator.stop(); statusAnimator = null; }
    state.isGenerating = false;
    state.abortController = null;
    if (dom.stopGenerationBtn) dom.stopGenerationBtn.style.display = 'none';
    if (dom.sendBtn) dom.sendBtn.style.display = 'flex';
    if (dom.streamingIndicator) dom.streamingIndicator.style.display = 'none';
    if (dom.composerBox) {
      setTimeout(() => {
        dom.composerBox?.classList.remove('auto-web-active', 'auto-reasoning-active');
      }, 4000);
    }
    syncWebSearchUI();
    scrollToBottom(true);
  }
}

export function regenerateLastResponse() {
  if (state.isGenerating) return;
  const session = getActiveSession();
  if (!session || !session.messages || session.messages.length === 0) return;

  if (session.messages[session.messages.length - 1].role === 'assistant') {
    session.messages.pop();
    saveSessions();
    renderSessionMessages(session);
    updateSessionMetrics();
    updateContextEstimator();
  }

  executeChatTurn(session);
}

export async function continueCodeInPlace(triggerBtn, targetPre = null) {
  if (state.isGenerating) return;

  const msgDiv = triggerBtn?.closest?.('.chat-message') || (targetPre && targetPre.closest?.('.chat-message'));
  const bubble = msgDiv?.querySelector?.('.message-bubble');
  const session = getActiveSession();
  if (!session || !Array.isArray(session.messages)) return;

  // Identify the target message in session
  const assistantMsgs = Array.from(dom.chatMessages?.querySelectorAll('.chat-message.assistant') || []);
  const domIndex = assistantMsgs.indexOf(msgDiv);
  const assistantIndices = [];
  session.messages.forEach((m, idx) => {
    if (m.role === 'assistant') assistantIndices.push(idx);
  });
  const msgIndex = (domIndex >= 0 && assistantIndices[domIndex] !== undefined)
    ? assistantIndices[domIndex]
    : (assistantIndices.length > 0 ? assistantIndices[assistantIndices.length - 1] : (session.messages.length - 1));
  const targetAssistantMsg = session.messages[msgIndex];
  if (!targetAssistantMsg) return;

  const pre = targetPre || bubble?.querySelector('pre:last-of-type') || bubble?.querySelector('pre');
  if (!pre) return;
  const codeElem = pre.querySelector('code') || pre;
  const originalCode = codeElem.innerText || pre.innerText || '';

  let language = 'code';
  if (codeElem.className) {
    const m = codeElem.className.match(/language-(\w+)/);
    if (m) language = m[1];
  }
  const filename = detectCodeFilename(pre, originalCode, language);

  const origBtnHtml = triggerBtn ? triggerBtn.innerHTML : '';
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = `<span class="spin" style="display: inline-block; margin-right: 4px;">⟳</span><span>Expanding ${escapeHtml(filename)}...</span>`;
  }

  state.isGenerating = true;
  state.abortController = new AbortController();

  const wrapper = pre.closest('.code-block-container');
  const headerFilename = wrapper?.querySelector('.code-block-filename');
  const origHeaderText = headerFilename?.innerHTML || '';
  if (headerFilename) {
    headerFilename.innerHTML = `${escapeHtml(filename)} <span style="color: var(--vylex-amber); font-weight: 500;">(Expanding in-place...)</span>`;
  }

  try {
    const continuationInstruction = `Continue the code for "${filename}" directly from the exact line where it stopped. Do not repeat previous code. Output ONLY the remaining lines to complete the file, cleanly formatted inside a \`\`\`${language} block.`;

    const messagesToSend = [
      ...session.messages.slice(0, msgIndex + 1),
      { role: 'user', content: continuationInstruction }
    ];

    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: state.currentModel,
        messages: messagesToSend,
        temperature: 0.2,
        apiKey: state.apiKey || undefined
      }),
      signal: state.abortController.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulatedContinuation = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.delta?.text ?? '';
          if (delta) {
            accumulatedContinuation += delta;
            const previewStitched = stitchCodeStrings(originalCode, accumulatedContinuation);
            codeElem.textContent = previewStitched;
            const lineCount = previewStitched.split('\n').length;
            if (headerFilename) {
              headerFilename.innerHTML = `${escapeHtml(filename)} (${lineCount} lines) <span style="color: var(--vylex-amber); font-weight: 500;">(Expanding...)</span>`;
            }
          }
        } catch (e) {}
      }
    }

    const finalStitchedCode = stitchCodeStrings(originalCode, accumulatedContinuation);
    codeElem.textContent = finalStitchedCode;
    if (typeof window !== 'undefined' && window.hljs) {
      window.hljs.highlightElement(codeElem);
    }

    const finalLines = finalStitchedCode.split('\n').length;
    if (headerFilename) {
      headerFilename.innerHTML = `${escapeHtml(filename)} (${finalLines} lines)`;
    }

    if (targetAssistantMsg.content && targetAssistantMsg.content.includes(originalCode.trim())) {
      targetAssistantMsg.content = targetAssistantMsg.content.replace(originalCode.trim(), finalStitchedCode);
    } else {
      targetAssistantMsg.content = stitchCodeStrings(targetAssistantMsg.content, accumulatedContinuation);
    }
    session.updatedAt = new Date().toISOString();
    saveSessions();
    updateSessionMetrics();

    document.dispatchEvent(new CustomEvent('atlas:register-artifact', {
      detail: { title: filename, codeText: finalStitchedCode, language }
    }));

    if (triggerBtn) {
      triggerBtn.innerHTML = `${ICONS.check || '✓'} Expanded`;
      setTimeout(() => {
        triggerBtn.style.display = 'none';
      }, 2500);
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('In-place continuation error:', err);
      if (triggerBtn) {
        triggerBtn.disabled = false;
        triggerBtn.innerHTML = origBtnHtml;
      }
      if (headerFilename) {
        headerFilename.innerHTML = origHeaderText;
      }
    }
  } finally {
    state.isGenerating = false;
    state.abortController = null;
  }
}

export function initChatService() {
  window.atlasContinueCodeInPlace = continueCodeInPlace;
  window.atlasRetryLast = async function () {
    if (state.isGenerating) return;
    const session = getActiveSession();
    if (!session || session.messages.length === 0) return;

    if (session.messages[session.messages.length - 1].role === 'user') {
      const lastUserMsg = session.messages.pop();
      if (dom.messageInput) {
        dom.messageInput.value = lastUserMsg.content;
      }
      renderSessionMessages(session);
      saveSessions();
      updateSessionMetrics();
      updateContextEstimator();
      const form = dom.chatForm;
      if (form) form.dispatchEvent(new Event('submit'));
    }
  };
}
