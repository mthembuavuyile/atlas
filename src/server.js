const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const env = require('./config/env');
const routes = require('./routes');
const openrouterService = require('./services/openrouter.service');
const { buildServerBanner } = require('./config/identity');

const app = express();

// 1. Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for the frontend
  crossOriginEmbedderPolicy: false // Allow external CDN resources
}));

// 2. CORS Configuration — supports production domains, Vercel deployments, and dev
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // same-origin, curl, server-to-server
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname;
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.vercel.app') ||
      host.endsWith('vylex.co.za') ||
      host.endsWith('avuyilemthembu.co.za') ||
      (env.APP_URL && origin.startsWith(env.APP_URL))
    );
  } catch (e) {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS Notice] Request from origin: ${origin}`);
      callback(null, true); // Allow public API usage while logging notice
    }
  },
  methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-OpenRouter-Key', 'x-openrouter-key'],
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
    error: 'The requested resource was not found.'
  });
});

// 6.5 Global Error Handler for standardized API error responses
app.use((err, req, res, next) => {
  console.error('[Global Error Middleware]:', err.message || err);
  
  // Standardize error response
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: message,
    type: 'server_error'
  });
});

// 7. Process-level safety nets
process.on('uncaughtException', (err) => {
  console.error('[Fatal] Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Fatal] Unhandled Rejection:', reason);
});

// 8. Start HTTP Server with graceful port handling
const PORT = env.PORT;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(buildServerBanner(port, env.DEFAULT_MODEL, openrouterService.hasApiKey()));
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

// ONLY start the server if run directly (local dev). Vercel imports the app instead.
if (require.main === module) {
  startServer(Number(PORT));
}

module.exports = app;
