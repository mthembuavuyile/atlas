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
  const { model } = req.body || {};

  // If no model provided, it will fallback to DEFAULT_MODEL safely
  if (!model) {
    return next();
  }

  const isExplicitlyWhitelisted = ALLOWED_FREE_MODELS.has(model);
  const isFreeSuffix = typeof model === 'string' && model.endsWith(':free');

  if (!isExplicitlyWhitelisted && !isFreeSuffix) {
    console.warn(`[Security Alert]: Blocked unauthorized model request for: "${model}" from IP: ${req.ip || req.headers['x-forwarded-for']}`);
    return res.status(403).json({
      error: 'The selected model is not available. Please choose from the available reasoning models in the menu.'
    });
  }

  next();
}

module.exports = { modelGuard, ALLOWED_FREE_MODELS };
