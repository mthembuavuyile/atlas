const env = require('../config/env');
const { APP } = require('../config/identity');

// Resilient fallback candidate pool (prioritizing high-availability & zero-cost models)
const DEFAULT_FALLBACK_POOL = [
  'stealth/ox-alpha',
  'openrouter/free',
  'google/gemma-4-26b-a4b-it:free',
  'cohere/north-mini-code:free',
  'z-ai/glm-5.2:free',
  'poolside/laguna-s-2.1:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free'
];

class OpenRouterService {
  /**
   * Validate API Key
   * @param {string} [customKey]
   */
  hasApiKey(customKey = null) {
    const key = customKey || env.OPENROUTER_API_KEY;
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
   * @param {string} [options.apiKey]
   * @param {string} [options.referer]
   * @param {Set<string>} [options.attemptedModels]
   */
  async createChatCompletion({
    messages,
    model = env.DEFAULT_MODEL,
    temperature = 0.7,
    stream = true,
    tools = undefined,
    apiKey = null,
    referer = env.APP_URL || APP.url,
    attemptedModels = new Set()
  }) {
    const activeKey = (apiKey && apiKey.trim()) || env.OPENROUTER_API_KEY;

    if (!this.hasApiKey(activeKey)) {
      const keyErr = new Error('OpenRouter API Key not configured. Please set OPENROUTER_API_KEY in Vercel Environment Variables or supply a custom key in Settings.');
      keyErr.status = 401;
      throw keyErr;
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
      // 12s per-attempt timeout guard to prevent hanging and stay well within Vercel execution bounds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeKey}`,
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
      const msg = isTimeout ? `Upstream model ${model} timed out` : networkErr.message;
      console.warn(`[OpenRouter Network Guard] ${msg}. Attempting auto-rotation...`);

      return this.rotateToNextCandidate({
        messages,
        failedModel: model,
        temperature,
        stream,
        tools,
        apiKey: activeKey,
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
      const rawMessage = errorJson.error?.message || errorJson.message || `Atlas Engine API error (${response.status})`;
      const lower = rawMessage.toLowerCase();

      // Check if account-level daily limit for free models was hit
      const isDailyFreeLimitExceeded = lower.includes('free-models-per-day') || lower.includes('free tier daily') || lower.includes('purchase credits to raise');

      if (isDailyFreeLimitExceeded) {
        console.warn(`⚡ [Daily Free Quota Hit on OpenRouter]: ${rawMessage}. Skipping all remaining :free models.`);
        // Mark all :free models as attempted so we don't spin wheels trying them
        for (const candidate of DEFAULT_FALLBACK_POOL) {
          if (candidate.endsWith(':free') || candidate === 'openrouter/free') {
            attemptedModels.add(candidate);
          }
        }
      }

      // Status codes eligible for automatic rotation:
      // 429 (Rate Limit / Concurrency), 500, 502, 503, 504 (Provider Down / Overloaded), 408 (Timeout)
      const isRetryable = [429, 500, 502, 503, 504, 408].includes(response.status) ||
                          lower.includes('rate limit') ||
                          lower.includes('overloaded') ||
                          lower.includes('concurrency') ||
                          lower.includes('temporarily unavailable');

      if (isRetryable) {
        console.warn(`⚡ [Auto-Rotation Triggered]: Model "${model}" returned ${response.status} (${rawMessage}). Rotating to next available engine in pool...`);
        
        // Fast 100ms jittered backoff
        await this.sleep(100);

        return this.rotateToNextCandidate({
          messages,
          failedModel: model,
          temperature,
          stream,
          tools,
          apiKey: activeKey,
          referer,
          attemptedModels,
          errorMessage: rawMessage,
          status: response.status
        });
      }

      const err = new Error(rawMessage);
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
    apiKey,
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
        apiKey,
        referer,
        attemptedModels
      });
    }

    // All models in pool exhausted
    console.error(`❌ [Auto-Rotation Exhausted]: All ${attemptedModels.size} free models in the pool were rate-limited or congested.`);
    const exhaustedErr = new Error(
      errorMessage && (errorMessage.includes('free-models-per-day') || errorMessage.includes('credits'))
        ? 'Daily free reasoning quota reached (50 requests/day). It resets at midnight UTC. You can also configure a custom OpenRouter key in Settings.'
        : 'The reasoning engines are experiencing high demand right now. Please try again in a few moments.'
    );
    exhaustedErr.status = status;
    throw exhaustedErr;
  }
}

module.exports = new OpenRouterService();
