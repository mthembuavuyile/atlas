/**
 * chat-service.js
 * Core technical reasoning & execution engine.
 * Handles context checking, SSE stream reading, retry logic, abort controllers, and error cards.
 */

import { state } from '../state/store.js';
import { dom } from '../ui/dom.js';
import { API_BASE, ICONS } from '../config/constants.js';
import { parseMarkdownSafely, enhanceCodeBlocks, enhanceMathBlocks, renderMathSafely, escapeHtml } from '../markdown/parser.js';
import { openCodeInCanvas } from '../ui/canvas.js';
import { getActiveSession, saveSessions, updateSessionMetrics, updateContextEstimator } from '../ui/session-manager.js';
import { renderMessageItem, startStatusAnimation, scrollToBottom, renderSessionMessages } from '../ui/message-renderer.js';
import { detectLocalWidgetIntent, resolveSlashCommand, runLocalWidget } from './intent-router.js';

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

  if (
    lower.includes('free-models-per-day') ||
    lower.includes('daily free reasoning quota') ||
    lower.includes('free tier daily') ||
    lower.includes('purchase credits to raise')
  ) {
    return {
      title: 'Daily Free Quota Reached',
      desc: 'The shared daily free reasoning quota has been reached (50 requests/day). It automatically resets at midnight UTC.',
      action: 'You can configure a custom OpenRouter key in Settings for immediate access.',
      type: 'warning',
      canRetry: false
    };
  }

  if (statusCode === 401 || lower.includes('api key not configured') || lower.includes('unauthorized') || lower.includes('invalid api key')) {
    return {
      title: 'API Key Required',
      desc: 'OpenRouter API key is missing or invalid.',
      action: 'You can supply your own OpenRouter key in Settings to continue.',
      type: 'warning',
      canRetry: false
    };
  }

  if (statusCode === 429 || lower.includes('rate limit') || lower.includes('too many requests')) {
    return {
      title: 'Rate Limit Reached',
      desc: 'You are sending messages too fast.',
      action: 'Please wait a few seconds before trying again.',
      type: 'warning',
      canRetry: true
    };
  }

  if (statusCode === 413 || lower.includes('payload too large')) {
    return {
      title: 'File Too Large',
      desc: 'This file is too large to be processed.',
      action: 'Choose a file under 25MB and try again.',
      type: 'warning',
      canRetry: false
    };
  }

  if (statusCode === 403 || lower.includes('unauthorized model') || lower.includes('not available')) {
    return {
      title: 'Model Unavailable',
      desc: 'This reasoning model is momentarily unavailable.',
      action: 'Please switch to another model from the menu.',
      type: 'warning',
      canRetry: false
    };
  }

  if (
    statusCode === 500 ||
    statusCode === 503 ||
    statusCode === 504 ||
    statusCode === 502 ||
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

  if (statusCode === 400 && lower.includes('system prompt')) {
    return {
      title: 'Instructions Too Long',
      desc: 'Your custom instructions exceed the allowed character limit.',
      action: 'Please shorten them in Studio Parameters.',
      type: 'warning',
      canRetry: false
    };
  }

  return {
    title: 'Service Notice',
    desc: 'Something went wrong while processing your request.',
    action: 'Please try again shortly.',
    type: 'error',
    canRetry: true
  };
}

export function renderErrorCard(errorInfo) {
  const icon = errorInfo.type === 'offline'
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.56 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

  const retryBtn = errorInfo.canRetry
    ? `<button class="atlas-retry-btn" onclick="window.atlasRetryLast()" style="margin-top: 10px; padding: 6px 12px; background: var(--border-light); border: 1px solid var(--border-focus); border-radius: 4px; color: var(--text-main); font-family: inherit; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">${ICONS.retry} Try Again</button>`
    : '';

  const actionText = errorInfo.action ? `<div class="atlas-error-action" style="margin-top: 4px; font-weight: 500;">${escapeHtml(errorInfo.action)}</div>` : '';

  return `
    <div class="atlas-error-card ${errorInfo.type}">
      <div class="atlas-error-icon">${icon}</div>
      <div class="atlas-error-body">
        <div class="atlas-error-title">${escapeHtml(errorInfo.title)}</div>
        <div class="atlas-error-desc">${escapeHtml(errorInfo.desc)}</div>
        ${actionText}
        ${retryBtn}
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
            reasoning: state.isDeepReasoning,
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

        if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429 && err.status !== 408) {
          throw err;
        }

        if (attempt === retries) {
          throw new Error(`Connection failed after ${retries} attempts. The network or upstream provider is unstable. Please try again.`);
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
            const toolName = parsed.__tool_start__.name.replace(/_/g, ' ');
            const toolId = `tool-${Date.now()}`;

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
            logItem.dataset.tool = parsed.__tool_start__.name;
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
            accumulatedWidgets.push(parsed.__widget__);
            if (window.atlasRenderWidget) {
              const widgetHtml = window.atlasRenderWidget(parsed.__widget__.type, parsed.__widget__.data);
              if (widgetHtml && widgetsContainer) {
                const widgetBox = document.createElement('div');
                widgetBox.className = 'widget-mount-point';
                widgetBox.innerHTML = widgetHtml;
                widgetsContainer.appendChild(widgetBox);
                scrollToBottom(false);
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

export function initChatService() {
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
