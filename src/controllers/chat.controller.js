const openrouterService = require('../services/openrouter.service');
const searchService = require('../services/search.service');
const widgetService = require('../services/widget.service');
const { ATLAS_TOOLS } = require('../config/tools.config');
const env = require('../config/env');
const {
  SYSTEM_PROMPT_FULL,
  SYSTEM_PROMPT_TITLE,
  API_IDENTITY,
  APP,
} = require('../config/identity');

class ChatController {
  async handleChat(req, res) {
    const {
      messages = [],
      model = env.DEFAULT_MODEL,
      stream = true,
      temperature = 0.7,
      webSearch = false
    } = req.body;

    try {
      let normalizedMessages = Array.isArray(messages) ? [...messages] : [];
      const hasSystemMessage = normalizedMessages.some(m => m && m.role === 'system');

      if (!hasSystemMessage) {
        normalizedMessages.unshift({
          role: 'system',
          content: SYSTEM_PROMPT_FULL
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

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          
          // Check if this chunk indicates a tool call
          if (chunk.includes('"tool_calls"')) {
            isToolCall = true;
          }

          if (isToolCall) {
            // Accumulate tool call chunks
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.slice(6));
                  const delta = data.choices[0]?.delta;
                  if (delta?.tool_calls) {
                    const tc = delta.tool_calls[0];
                    if (tc.id) toolCallId = tc.id;
                    if (tc.function?.name) toolName = tc.function.name;
                    if (tc.function?.arguments) toolCallBuffer.push(tc.function.arguments);
                  }
                } catch (e) {}
              }
            }
          } else {
            // Normal text chunk, stream directly to client
            res.write(chunk);
          }
        }

        if (isToolCall && toolName) {
          // Execute the tool
          try {
            const args = JSON.parse(toolCallBuffer.join(''));
            let widgetResult;
            
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

            // Send widget data to frontend via a special SSE event
            res.write(`data: {"__widget__": ${JSON.stringify({ type: widgetResult.type, data: widgetResult.data })}}\n\n`);

            // Append tool interaction to history and recall AI for explanation
            normalizedMessages.push({
              role: 'assistant',
              content: null,
              tool_calls: [{ id: toolCallId, type: 'function', function: { name: toolName, arguments: JSON.stringify(args) } }]
            });
            normalizedMessages.push({
              role: 'tool',
              tool_call_id: toolCallId,
              name: toolName,
              content: JSON.stringify(widgetResult)
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
              if (done) {
                res.write('data: [DONE]\n\n');
                break;
              }
              res.write(decoder.decode(value, { stream: true }));
            }
          } catch (e) {
            console.error("Tool execution failed:", e);
            res.write(`data: {"error": "Tool execution failed"}\n\n`);
            res.write('data: [DONE]\n\n');
          }
        } else {
            res.write('data: [DONE]\n\n');
        }

        return res.end();
      } else {
        // Non-streaming logic (simplified for now, mostly streaming is used)
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
      const cleanTitle = rawTitle.replace(/["*\`_#]/g, '').trim();

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
      message: `${APP.name} API is ready. Send a POST request with messages payload.`,
      ...API_IDENTITY,
      defaultModel: env.DEFAULT_MODEL,
      examplePayload: {
        model: env.DEFAULT_MODEL,
        messages: [{ role: 'user', content: `Hello ${APP.name}!` }],
        stream: true,
        webSearch: false
      }
    });
  }
}

module.exports = new ChatController();
