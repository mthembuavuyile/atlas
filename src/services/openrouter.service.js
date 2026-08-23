const env = require('../config/env');
const { APP } = require('../config/identity');
const { CURATED_MODELS } = require('../config/models.config');

// Resilient fallback candidate pool
const DEFAULT_FALLBACK_POOL = [
  'openrouter/free',
  'google/gemma-4-26b-a4b-it:free',
  'cohere/north-mini-code:free',
  'z-ai/glm-5.2:free',
  'poolside/laguna-s-2.1:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'stealth/ox-alpha'
];

class OpenRouterService {
  /**
   * Validate API Key
   */
  hasApiKey() {
    const key = env.OPENROUTER_API_KEY;
    return Boolean(key && key.trim().length > 0 && key !== 'your_openrouter_api_key_here');
  }

  /**
   * Helper delay for jittered backoff
   * @param {number} ms
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Send a chat completion request to OpenRouter with automatic multi-model failover rotation
   * @param {Object} options
   * @param {Array} options.messages
   * @param {string} options.model
   * @param {number} options.temperature
   * @param {boolean} options.stream
   * @param {string} options.referer
   * @param {Set<string>} options.attemptedModels
   */
  async createChatCompletion({
    messages,
    model = env.DEFAULT_MODEL,
    temperature = 0.7,
    stream = true,
    tools = undefined,
    referer = env.APP_URL || APP.url,
    attemptedModels = new Set()
  }) {
    if (!this.hasApiKey()) {
      throw new Error('OpenRouter API Key not configured. Set OPENROUTER_API_KEY in your environment variables.');
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('A non-empty messages array is required.');
    }

    attemptedModels.add(model);

    const payload = {
      model,
      messages,
      temperature,
      stream,
      tools
    };

    let response;
    try {
      // 18s per-attempt timeout guard to prevent hanging on congested upstream hosts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': referer,
          'X-Title': env.APP_TITLE,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (networkErr) {
      const isTimeout = networkErr.name === 'AbortError' || networkErr.message.includes('abort');
      const msg = isTimeout ? `Upstream model ${model} timed out after 18s` : networkErr.message;
      console.warn(`[OpenRouter Network Guard] ${msg}. Attempting auto-rotation...`);

      return this.rotateToNextCandidate({
        messages,
        failedModel: model,
        temperature,
        stream,
        referer,
        attemptedModels,
        errorMessage: msg
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        errorJson = { message: errorText };
      }
      const message = errorJson.error?.message || errorJson.message || `Atlas Engine API error (${response.status})`;

      // Status codes eligible for automatic rotation:
      // 429 (Rate Limit / Concurrency), 500, 502, 503, 504 (Provider Down / Overloaded), 408 (Timeout)
      const isRetryable = [429, 500, 502, 503, 504, 408].includes(response.status) ||
                          message.toLowerCase().includes('rate limit') ||
                          message.toLowerCase().includes('overloaded') ||
                          message.toLowerCase().includes('concurrency') ||
                          message.toLowerCase().includes('temporarily unavailable');

      if (isRetryable) {
        console.warn(`⚡ [Auto-Rotation Triggered]: Model "${model}" returned ${response.status} (${message}). Rotating to next available engine in pool...`);
        
        // Jittered backoff if rate limited
        if (response.status === 429) {
          await this.sleep(350);
        }

        return this.rotateToNextCandidate({
          messages,
          failedModel: model,
          temperature,
          stream,
          tools,
          referer,
          attemptedModels,
          errorMessage: message,
          status: response.status
        });
      }

      const err = new Error(message);
      err.status = response.status;
      throw err;
    }

    return response;
  }

  /**
   * Find the next untried model candidate and seamlessly continue execution
   */
  async rotateToNextCandidate({
    messages,
    failedModel,
    temperature,
    stream,
    tools,
    referer,
    attemptedModels,
    errorMessage,
    status = 500
  }) {
    // Pick the next untried model from the curated pool
    const nextCandidate = DEFAULT_FALLBACK_POOL.find(candidate => !attemptedModels.has(candidate));

    if (nextCandidate) {
      console.log(`🔄 [Auto-Rotation]: Shifting request from "${failedModel}" ➔ "${nextCandidate}" (Pool size remaining: ${DEFAULT_FALLBACK_POOL.length - attemptedModels.size})`);
      return this.createChatCompletion({
        messages,
        model: nextCandidate,
        temperature,
        stream,
        tools,
        referer,
        attemptedModels
      });
    }

    // All models in pool exhausted
    console.error(`❌ [Auto-Rotation Exhausted]: All ${attemptedModels.size} free models in the pool were rate-limited or congested.`);
    const exhaustedErr = new Error(`All free models are momentarily experiencing high global concurrency. Last error: ${errorMessage}`);
    exhaustedErr.status = status;
    throw exhaustedErr;
  }
}

module.exports = new OpenRouterService();
