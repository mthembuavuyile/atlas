const openrouterService = require('../services/openrouter.service');
const searchService = require('../services/search.service');
const widgetService = require('../services/widget.service');
const { ATLAS_TOOLS } = require('../config/tools.config');
const env = require('../config/env');
const {
  SYSTEM_PROMPT_FULL,
  SYSTEM_PROMPT_TITLE,
  INVESTIGATION_MODES,
  API_IDENTITY,
  APP,
} = require('../config/identity');

class ChatController {
  /**
   * Build the mode-aware system prompt.
   * If a mode is specified, prepend the mode-specific reasoning instructions
   * before the base Atlas identity prompt.
   */
  buildSystemPrompt(mode, customSystemPrompt) {
    const parts = [];

    // 1. Core Atlas identity — ALWAYS included so the AI knows who it is
    parts.push(SYSTEM_PROMPT_FULL);

    // 2. Mode-specific reasoning instructions (if active)
    if (mode && INVESTIGATION_MODES[mode]) {
      parts.push(INVESTIGATION_MODES[mode].prompt);
    }

    // 3. Additional custom user instructions (layered on top, not replacing identity)
    if (customSystemPrompt && customSystemPrompt.trim()) {
      parts.push(`ADDITIONAL USER INSTRUCTIONS:\n${customSystemPrompt.trim()}`);
    }

    return parts.join('\n\n');
  }

  async handleChat(req, res) {
    const {
      messages = [],
      model = env.DEFAULT_MODEL,
      stream = true,
      temperature = 0.7,
      webSearch = false,
      mode = null,
      systemPrompt: customSystemPrompt = null,
      reasoning: enableDeepReasoning = false,
      maxTokens = 4096,
      apiKey = null
    } = req.body;

    const customApiKey = req.headers['x-openrouter-key'] ||
                         (req.headers['authorization']?.startsWith('Bearer ') ? req.headers['authorization'].slice(7) : null) ||
                         apiKey || null;

    try {
      // Filter out any raw client system messages and extract custom instructions
      const rawMessages = Array.isArray(messages) ? messages : [];
      let clientCustomPrompt = customSystemPrompt;

      const nonSystemMessages = [];
      for (const m of rawMessages) {
        if (!m) continue;
        if (m.role === 'system') {
          if (!clientCustomPrompt && m.content) {
            clientCustomPrompt = m.content;
          }
        } else {
          nonSystemMessages.push(m);
        }
      }

      // Validate systemPrompt length to prevent token abuse
      if (clientCustomPrompt && clientCustomPrompt.length > 2000) {
        return res.status(400).json({ error: 'System prompt exceeds maximum length of 2000 characters.' });
      }

      // Always inject the complete, authoritative mode-aware Atlas system prompt
      const normalizedMessages = [
        {
          role: 'system',
          content: this.buildSystemPrompt(mode, clientCustomPrompt)
        },
        ...nonSystemMessages
      ];

      if (webSearch) {
        const lastUserMsg = [...normalizedMessages].reverse().find(m => m.role === 'user');
        if (lastUserMsg && lastUserMsg.content) {
          const userQuery = typeof lastUserMsg.content === 'string'
            ? lastUserMsg.content
            : JSON.stringify(lastUserMsg.content);

          const searchResults = await searchService.searchWeb(userQuery, 5);
          if (searchResults && searchResults.length > 0) {
            const groundingContext = searchService.formatGroundingContext(searchResults, userQuery);
            normalizedMessages.push({
              role: 'system',
              content: groundingContext
            });
          }
        }
      }

      const reasoningConfig = enableDeepReasoning
        ? { effort: 'high' }
        : { effort: 'low' };

      const safeMaxTokens = Math.min(Math.max(Number(maxTokens) || 4096, 256), 8192);

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (typeof res.flushHeaders === 'function') {
          res.flushHeaders();
        }

        const decoder = new TextDecoder('utf-8');
        let currentMessages = [...normalizedMessages];
        let iteration = 0;
        const maxIterations = 5;

        while (iteration < maxIterations) {
          iteration++;

          const openRouterResponse = await openrouterService.createChatCompletion({
            messages: currentMessages,
            model,
            temperature,
            stream: true,
            tools: ATLAS_TOOLS,
            maxTokens: safeMaxTokens,
            reasoning: reasoningConfig,
            apiKey: customApiKey,
            referer: env.APP_URL
          });

          const reader = openRouterResponse.body.getReader();
          const toolCallsMap = new Map();
          let sseBuffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              sseBuffer += chunk;
              const lines = sseBuffer.split('\n');
              sseBuffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data:')) continue;
                const dataStr = trimmed.replace(/^data:\s*/, '');
                if (dataStr === '[DONE]') continue;

                try {
                  const data = JSON.parse(dataStr);
                  const delta = data.choices?.[0]?.delta;
                  if (delta?.tool_calls && Array.isArray(delta.tool_calls)) {
                    for (const tc of delta.tool_calls) {
                      const idx = tc.index ?? 0;
                      if (!toolCallsMap.has(idx)) {
                        toolCallsMap.set(idx, {
                          id: tc.id || `call_${idx}`,
                          name: tc.function?.name || '',
                          argsChunks: []
                        });
                      }
                      const existing = toolCallsMap.get(idx);
                      if (tc.id) existing.id = tc.id;
                      if (tc.function?.name) existing.name = tc.function.name;
                      if (tc.function?.arguments) existing.argsChunks.push(tc.function.arguments);
                    }
                  } else if (toolCallsMap.size === 0) {
                    res.write(`data: ${dataStr}\n\n`);
                  }
                } catch (e) {
                  if (toolCallsMap.size === 0) {
                    res.write(`${line}\n\n`);
                  }
                }
              }
            }
          } catch (streamErr) {
            console.error('[Stream Read Error]:', streamErr.message);
            if (!res.writableEnded) {
              res.write(`data: ${JSON.stringify({ error: 'Stream interrupted. Please try again.' })}\n\n`);
            }
            break;
          }

          // If no tool calls were requested in this iteration, final text has been streamed to client!
          if (toolCallsMap.size === 0) {
            break;
          }

          // Execute all tool calls generated in this iteration
          try {
            const assistantToolCalls = [];
            const toolResultsForLlm = [];

            for (const [idx, tc] of toolCallsMap.entries()) {
              const rawArgsStr = tc.argsChunks.join('').trim();
              let args = {};
              if (rawArgsStr) {
                try {
                  args = JSON.parse(rawArgsStr);
                } catch (e) {
                  args = {};
                }
              }

              const toolName = tc.name;
              const toolCallId = tc.id || `call_${idx}`;

              res.write(`data: ${JSON.stringify({ __tool_start__: { name: toolName, args } })}\n\n`);

              let widgetResult;
              switch (toolName) {
                case 'get_current_time': widgetResult = await widgetService.getCurrentTime(args.timezone); break;
                case 'convert_units': widgetResult = await widgetService.convertUnits(args.value, args.from, args.to); break;
                case 'search_places': widgetResult = await widgetService.searchPlaces(args.query, args.near); break;
                case 'fetch_webpage': widgetResult = await widgetService.fetchWebpage(args.url); break;
                case 'get_weather': widgetResult = await widgetService.getWeather(args.city); break;
                case 'get_crypto_price': widgetResult = await widgetService.getCryptoPrice(args.coin); break;
                case 'get_bible_verse': widgetResult = await widgetService.getBibleVerse(args.reference); break;
                case 'search_images': widgetResult = await widgetService.searchImages(args.query); break;
                case 'get_news_headlines': widgetResult = await widgetService.getNewsHeadlines(args.topic); break;
                case 'get_space_news': widgetResult = await widgetService.getSpaceNews(args.topic); break;
                case 'get_reddit_posts': widgetResult = await widgetService.getRedditPosts(args.subreddit); break;
                case 'define_word': widgetResult = await widgetService.defineWord(args.word); break;
                case 'convert_currency': widgetResult = await widgetService.convertCurrency(args.amount, args.from, args.to); break;
                case 'solve_math': widgetResult = await widgetService.solveMath(args.expression, args.operation); break;
                case 'tell_joke': widgetResult = await widgetService.tellJoke(); break;
                case 'give_advice': widgetResult = await widgetService.giveAdvice(); break;
                case 'scan_ocr': widgetResult = await widgetService.scanOcr(); break;
                default: widgetResult = { error: `Unknown tool: ${toolName}` };
              }

              // Send widget payload to client
              res.write(`data: ${JSON.stringify({ __widget__: { type: widgetResult.type, data: widgetResult.data, error: widgetResult.error } })}\n\n`);
              res.write(`data: ${JSON.stringify({ __tool_done__: { name: toolName, success: !widgetResult.error } })}\n\n`);

              // Structure tool response for LLM
              let toolContentForLlm = widgetResult;
              if (toolName === 'search_images' && widgetResult.data?.images) {
                toolContentForLlm = {
                  status: 'success',
                  query: widgetResult.data.query,
                  image_count: widgetResult.data.images.length,
                  titles: widgetResult.data.images.slice(0, 5).map(img => img.title),
                  instruction: `Visual references gallery containing ${widgetResult.data.images.length} images for "${widgetResult.data.query}" has already been displayed directly above. Provide a concise, helpful summary or fascinating scientific context about the subject. Do NOT output markdown image syntax or raw image links.`
                };
              }

              assistantToolCalls.push({
                id: toolCallId,
                type: 'function',
                function: {
                  name: toolName,
                  arguments: JSON.stringify(args)
                }
              });

              toolResultsForLlm.push({
                role: 'tool',
                tool_call_id: toolCallId,
                name: toolName,
                content: JSON.stringify(toolContentForLlm)
              });
            }

            // Append assistant tool calls and tool responses for the next loop pass
            currentMessages.push({
              role: 'assistant',
              content: null,
              tool_calls: assistantToolCalls
            });
            for (const toolResultMsg of toolResultsForLlm) {
              currentMessages.push(toolResultMsg);
            }
          } catch (e) {
            console.error("[ChatController Tool Loop Error]:", e);
            res.write(`data: ${JSON.stringify({ error: "Tool execution encountered an unexpected issue." })}\n\n`);
            break;
          }
        }

        res.write('data: [DONE]\n\n');
        return res.end();
      } else {
        const openRouterResponse = await openrouterService.createChatCompletion({
          messages: normalizedMessages,
          model,
          temperature,
          stream,
          tools: ATLAS_TOOLS,
          maxTokens: safeMaxTokens,
          reasoning: reasoningConfig,
          apiKey: customApiKey,
          referer: env.APP_URL
        });
        const data = await openRouterResponse.json();
        return res.json(data);
      }
    } catch (err) {
      console.error('[Atlas ChatController Error]:', err.message);
      const statusCode = err.status || 500;
      if (!res.headersSent) {
        return res.status(statusCode).json({ error: err.message });
      }
      return res.end();
    }
  }

  async generateTitle(req, res) {
    const { message, model = env.DEFAULT_MODEL, apiKey = null } = req.body;
    const customApiKey = req.headers['x-openrouter-key'] ||
                         (req.headers['authorization']?.startsWith('Bearer ') ? req.headers['authorization'].slice(7) : null) ||
                         apiKey || null;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required to generate a title.' });
    }

    try {
      const promptMessages = [
        {
          role: 'system',
          content: SYSTEM_PROMPT_TITLE
        },
        {
          role: 'user',
          content: message.slice(0, 500)
        }
      ];

      const openRouterResponse = await openrouterService.createChatCompletion({
        messages: promptMessages,
        model,
        temperature: 0.3,
        stream: false,
        maxTokens: 30,
        reasoning: { effort: 'low' },
        apiKey: customApiKey,
        referer: env.APP_URL
      });

      const data = await openRouterResponse.json();
      const rawTitle = data.choices?.[0]?.message?.content || '';
      const cleanTitle = rawTitle.replace(/["*`_#]/g, '').trim();

      return res.json({
        title: cleanTitle || message.slice(0, 32)
      });
    } catch (err) {
      console.warn('[Atlas GenerateTitle Error]:', err.message);
      const fallback = message.slice(0, 36) + (message.length > 36 ? '...' : '');
      return res.json({ title: fallback });
    }
  }

  getChatInfo(req, res) {
    res.json({
      message: `${APP.name} API is operational. Send POST requests to /api/chat.`,
      ...API_IDENTITY,
      defaultModel: env.DEFAULT_MODEL,
      availableModes: Object.keys(INVESTIGATION_MODES),
      examplePayload: {
        model: env.DEFAULT_MODEL,
        messages: [{ role: 'user', content: 'Investigate computational complexity of matrix multiplication.' }],
        stream: true,
        webSearch: false,
        mode: 'research'
      }
    });
  }
}

module.exports = new ChatController();
