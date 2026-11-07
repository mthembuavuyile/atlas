const express = require('express');
const { Readable } = require('stream');
const router = express.Router();

const chatController = require('../controllers/chat.controller');
const modelsController = require('../controllers/models.controller');
const healthController = require('../controllers/health.controller');
const toolController = require('../controllers/tool.controller');
const widgetController = require('../controllers/widget.controller');
const elevenlabsService = require('../services/elevenlabs.service');

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

// Tool endpoint — DISABLED in production to prevent remote code execution
if (process.env.NODE_ENV !== 'production') {
  router.post('/tool/execute', toolLimiter, (req, res) => toolController.execute(req, res));
}

// Atlas widget endpoint
router.post('/widget/execute', toolLimiter, (req, res) => widgetController.execute(req, res));

// Read-Aloud Text-to-Speech (ElevenLabs Free Tier API alongside Browser/Google Speech)
router.get('/tts/voices', (req, res) => {
  res.json({
    configured: elevenlabsService.isConfigured(),
    voices: elevenlabsService.getVoices()
  });
});

router.post('/tts/speak', toolLimiter, async (req, res) => {
  try {
    const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const voiceId = typeof req.body?.voiceId === 'string' ? req.body.voiceId.trim() : elevenlabsService.DEFAULT_VOICE_ID;

    if (!rawText) {
      return res.status(400).json({ error: 'Text is required for speech synthesis.' });
    }

    const cappedText = rawText.slice(0, 4500);
    const audioStream = await elevenlabsService.convertTextToSpeech(cappedText, voiceId);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');

    if (typeof audioStream.pipe === 'function') {
      audioStream.pipe(res);
    } else if (typeof Readable.fromWeb === 'function' && typeof audioStream.getReader === 'function') {
      Readable.fromWeb(audioStream).pipe(res);
    } else {
      Readable.from(audioStream).pipe(res);
    }
  } catch (err) {
    const status = err.statusCode || 502;
    if (!res.headersSent) {
      res.status(status).json({
        error: err.message || 'ElevenLabs speech synthesis failed.'
      });
    } else {
      res.end();
    }
  }
});

module.exports = router;
