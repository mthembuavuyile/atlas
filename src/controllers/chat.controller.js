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

    // 1. Mode-specific reasoning instructions (if active)
    if (mode && INVESTIGATION_MODES[mode]) {
      parts.push(INVESTIGATION_MODES[mode].prompt);
    }

    // 2. Custom user system prompt OR the default full prompt
    if (customSystemPrompt && customSystemPrompt.trim()) {
      parts.push(customSystemPrompt.trim());
    } else {
      parts.push(SYSTEM_PROMPT_FULL);
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
      systemPrompt: customSystemPrompt = null
    } = req.body;

    try {
      let normalizedMessages = Array.isArray(messages) ? [...messages] : [];
      const hasSystemMessage = normalizedMessages.some(m => m && m.role === 'system');

      if (!hasSystemMessage) {
        normalizedMessages.unshift({
          role: 'system',
          content: this.buildSystemPrompt(mode, customSystemPrompt)
        });
      }

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

      // First pass: Call OpenRouter with tools
      const openRouterResponse = await openrouterService.createChatCompletion({
        messages: normalizedMessages,
        model,
        temperature,
        stream,
        tools: ATLAS_TOOLS,
        referer: env.APP_URL
      });

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        const reader = openRouterResponse.body.getReader();
        const decoder = new TextDecoder('utf-8');
        
        let toolCallBuffer = [];
        let isToolCall = false;
        let toolCallId = '';
        let toolName = '';
        let sseBuffer = '';

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
                isToolCall = true;
                const tc = delta.tool_calls[0];
                if (tc.id) toolCallId = tc.id;
                if (tc.function?.name) toolName = tc.function.name;
                if (tc.function?.arguments) toolCallBuffer.push(tc.function.arguments);
              } else if (!isToolCall) {
                res.write(`data: ${dataStr}\n\n`);
              }
            } catch (e) {
              if (!isToolCall) {
                res.write(`${line}\n\n`);
              }
            }
          }
        }

        if (isToolCall && toolName) {
          try {
            const rawArgsStr = toolCallBuffer.join('').trim();
            let args = {};
            if (rawArgsStr) {
              try {
                args = JSON.parse(rawArgsStr);
              } catch (e) {
                args = {};
              }
            }

            let widgetResult;
            res.write(`data: ${JSON.stringify({ __tool_start__: { name: toolName, args } })}\n\n`);

            switch (toolName) {
              case 'get_weather': widgetResult = await widgetService.getWeather(args.city); break;
              case 'get_crypto_price': widgetResult = await widgetService.getCryptoPrice(args.coin); break;
              case 'get_bible_verse': widgetResult = await widgetService.getBibleVerse(args.reference); break;
              case 'search_images': widgetResult = await widgetService.searchImages(args.query); break;
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

            // Structure tool response for LLM's second pass
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

            // Second pass for assistant reasoning
            normalizedMessages.push({
              role: 'assistant',
              content: null,
              tool_calls: [{ id: toolCallId || 'call_0', type: 'function', function: { name: toolName, arguments: JSON.stringify(args) } }]
            });
            normalizedMessages.push({
              role: 'tool',
              tool_call_id: toolCallId || 'call_0',
              name: toolName,
              content: JSON.stringify(toolContentForLlm)
            });

            const secondPass = await openrouterService.createChatCompletion({
              messages: normalizedMessages,
              model,
              temperature,
              stream: true,
              referer: env.APP_URL
            });

            const reader2 = secondPass.body.getReader();
            while (true) {
              const { done, value } = await reader2.read();
              if (done) break;
              res.write(decoder.decode(value, { stream: true }));
            }
          } catch (e) {
            console.error("[ChatController Tool Error]:", e);
            res.write(`data: ${JSON.stringify({ error: "Tool execution encountered an unexpected issue." })}\n\n`);
          }
        }

        res.write('data: [DONE]\n\n');
        return res.end();
      } else {
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
    const { message, model = env.DEFAULT_MODEL } = req.body;

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
