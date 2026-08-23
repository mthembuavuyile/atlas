const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chat.controller');
const modelsController = require('../controllers/models.controller');
const healthController = require('../controllers/health.controller');

// Chat endpoints
router.get('/chat', (req, res) => chatController.getChatInfo(req, res));
router.post('/chat', (req, res) => chatController.handleChat(req, res));
router.post('/title', (req, res) => chatController.generateTitle(req, res));

// Models endpoint
router.get('/models', (req, res) => modelsController.getModels(req, res));

// Health endpoint
router.get('/health', (req, res) => healthController.getHealth(req, res));

module.exports = router;
