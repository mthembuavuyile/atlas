const { CURATED_MODELS } = require('../config/models.config');
const openrouterService = require('../services/openrouter.service');

class ModelsController {
  /**
   * Handle GET /api/models
   */
  getModels(req, res) {
    res.json({
      models: CURATED_MODELS,
      hasApiKey: openrouterService.hasApiKey()
    });
  }
}

module.exports = new ModelsController();
