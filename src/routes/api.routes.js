const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chat.controller');
const modelsController = require('../controllers/models.controller');
const healthController = require('../controllers/health.controller');
const toolController = require('../controllers/tool.controller');
const widgetController = require('../controllers/widget.controller');

// Security & Rate Limiting Middlewares
const { chatLimiter, titleLimiter, toolLimiter } = require('../middleware/rateLimiter');
const { modelGuard } = require('../middleware/modelGuard');

// Chat endpoints
router.get('/chat', (req, res) => chatController.getChatInfo(req, res));
router.post('/chat', chatLimiter, modelGuard, (req, res) => chatController.handleChat(req, res));
router.post('/title', titleLimiter, modelGuard, (req, res) => chatController.generateTitle(req, res));

// Models endpoint
router.get('/models', (req, res) => modelsController.getModels(req, res));

// Health endpoint
router.get('/health', (req, res) => healthController.getHealth(req, res));

// Tool endpoint
router.post('/tool/execute', toolLimiter, (req, res) => toolController.execute(req, res));

// Widget endpoint (Nexora tools)
router.post('/widget/execute', toolLimiter, (req, res) => widgetController.execute(req, res));

module.exports = router;
