const env = require('../config/env');
const openrouterService = require('../services/openrouter.service');

class HealthController {
  /**
   * Handle GET /api/health
   */
  getHealth(req, res) {
    res.json({
      status: 'ok',
      service: 'Atlas by Vylex Technologies',
      hasApiKey: openrouterService.hasApiKey(),
      defaultModel: env.DEFAULT_MODEL,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new HealthController();
