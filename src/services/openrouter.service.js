const env = require('../config/env');

class OpenRouterService {
  /**
   * Validate API Key
   */
  hasApiKey() {
    const key = env.OPENROUTER_API_KEY;
    return Boolean(key && key.trim().length > 0 && key !== 'your_openrouter_api_key_here');
  }

  /**
   * Send a chat completion request to OpenRouter
   * @param {Object} options
   * @param {Array} options.messages
   * @param {string} options.model
   * @param {number} options.temperature
   * @param {boolean} options.stream
   * @param {string} options.referer
   */
  async createChatCompletion({
    messages,
    model = env.DEFAULT_MODEL,
    temperature = 0.7,
    stream = true,
    referer = env.APP_URL || 'https://vylex.co.za'
  }) {
    if (!this.hasApiKey()) {
      throw new Error('OpenRouter API Key not configured. Set OPENROUTER_API_KEY in your environment variables.');
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('A non-empty messages array is required.');
    }

    const payload = {
      model,
      messages,
      temperature,
      stream
    };

    const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': referer,
        'X-Title': env.APP_TITLE,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        errorJson = { message: errorText };
      }
      const message = errorJson.error?.message || errorJson.message || `Atlas Engine API error (${response.status})`;

      // Graceful fallback to the guaranteed auto-free router if a specific model is offline or rate-limited
      if (model !== 'openrouter/free') {
        console.warn(`[OpenRouter Service Warning]: Model ${model} failed with: ${message}. Falling back to openrouter/free.`);
        return this.createChatCompletion({
          messages,
          model: 'openrouter/free',
          temperature,
          stream,
          referer
        });
      }

      const err = new Error(message);
      err.status = response.status;
      throw err;
    }

    return response;
  }
}

module.exports = new OpenRouterService();
