/**
 * Model Security Guard Middleware
 * Strictly enforces that only 100% free models can be invoked through the backend.
 * Blocks any attempt by bad actors to request paid models (like gpt-4o, claude-3, etc.).
 */

const { CURATED_MODELS } = require('../config/models.config');

const ALLOWED_FREE_MODELS = new Set(CURATED_MODELS.map(m => m.id));

// Built-in guaranteed free IDs
ALLOWED_FREE_MODELS.add('openrouter/free');
ALLOWED_FREE_MODELS.add('stealth/ox-alpha');

function modelGuard(req, res, next) {
  const { model, apiKey } = req.body || {};

  // If no model provided, it will fallback to DEFAULT_MODEL safely
  if (!model) {
    return next();
  }

  const isExplicitlyWhitelisted = ALLOWED_FREE_MODELS.has(model);
  const isFreeSuffix = typeof model === 'string' && model.endsWith(':free');

  if (isExplicitlyWhitelisted || isFreeSuffix) {
    return next();
  }

  // Allow BYOK (Bring Your Own Key) users to invoke frontier models on their own OpenRouter key
  const headers = req.headers || {};
  const bearerKey = typeof headers['authorization'] === 'string' && headers['authorization'].startsWith('Bearer ')
    ? headers['authorization'].slice(7).trim()
    : '';
  const customApiKey = String(headers['x-openrouter-key'] || bearerKey || apiKey || '').trim();
  const isValidModelSlug = typeof model === 'string' && /^[a-z0-9-]+\/[a-z0-9._:-]+$/i.test(model);

  if (customApiKey.length >= 16 && isValidModelSlug) {
    return next();
  }

  console.warn(`[Security Alert]: Blocked unauthorized model request for: "${model}" from IP: ${req.ip || headers['x-forwarded-for']}`);
  return res.status(403).json({
    error: 'The selected model is not available on the shared tier. Please choose from the available reasoning models in the menu or configure your personal OpenRouter API key in Settings.'
  });
}

module.exports = { modelGuard, ALLOWED_FREE_MODELS };
