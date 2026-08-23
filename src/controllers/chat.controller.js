const openrouterService = require('../services/openrouter.service');
const env = require('../config/env');
const {
  SYSTEM_PROMPT_FULL,
  SYSTEM_PROMPT_TITLE,
  API_IDENTITY,
  APP,
} = require('../config/identity');

class ChatController {
  /**
   * Handle POST /api/chat (Streaming Chat Completion)
   */
  async handleChat(req, res) {
    const { messages = [], model = env.DEFAULT_MODEL, stream = true, temperature = 0.7 } = req.body;

    try {
      const normalizedMessages = Array.isArray(messages) ? [...messages] : [];
      const hasSystemMessage = normalizedMessages.some(m => m && m.role === 'system');

      if (!hasSystemMessage) {
        normalizedMessages.unshift({
          role: 'system',
          content: SYSTEM_PROMPT_FULL
        });
      }

      const openRouterResponse = await openrouterService.createChatCompletion({
        messages: normalizedMessages,
        model,
        temperature,
        stream,
        referer: env.APP_URL
      });

      if (stream) {
        // Configure Server-Sent Events headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        const reader = openRouterResponse.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.write('data: [DONE]\n\n');
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
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

  /**
   * Handle POST /api/title (AI Conversation Auto-Namer)
   */
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
      // Graceful fallback to smart truncation
      const fallback = message.slice(0, 36) + (message.length > 36 ? '...' : '');
      return res.json({ title: fallback });
    }
  }

  /**
   * Handle GET /api/chat (API Information)
   */
  getChatInfo(req, res) {
    res.json({
      message: `${APP.name} API is ready. Send a POST request with messages payload.`,
      ...API_IDENTITY,
      defaultModel: env.DEFAULT_MODEL,
      examplePayload: {
        model: env.DEFAULT_MODEL,
        messages: [{ role: 'user', content: `Hello ${APP.name}!` }],
        stream: true
      }
    });
  }
}

module.exports = new ChatController();
