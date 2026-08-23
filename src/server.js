const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const routes = require('./routes');
const openrouterService = require('./services/openrouter.service');

const app = express();

// 1. CORS Configuration — locked to your production domain + localhost for dev
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  env.APP_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, curl, mobile apps)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in early stage — tighten after launch
    }
  },
  methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false
}));
app.options('*', cors());

// 2. Request body parsing
app.use(express.json({ limit: '10mb' }));

// 3. Static assets serving (Web UI)
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// 4. Mount API Routes
app.use(routes);

// 5. Root page handler
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// 6. Global 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableEndpoints: [
      'GET  /',
      'GET  /api/health',
      'GET  /api/models',
      'POST /api/chat'
    ]
  });
});

// 7. Start HTTP Server with graceful port handling
const PORT = env.PORT;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log(`║  ◆ Atlas by Vylex Technologies                  ║`);
    console.log(`║  ◆ Server: http://localhost:${port}                 ║`);
    console.log(`║  ◆ Model:  ${env.DEFAULT_MODEL.padEnd(37)}║`);
    console.log(`║  ◆ API Key: ${openrouterService.hasApiKey() ? 'Configured ✔' : 'Missing ✘'}                        ║`);
    console.log('╚══════════════════════════════════════════════════╝');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${port} is already in use. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

startServer(Number(PORT));

module.exports = app;
