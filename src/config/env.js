require('dotenv').config({ path: '.env' });

const { APP, COMPANY } = require('./identity');

// Helper to parse comma-separated or primary+backup OpenRouter keys
function resolveOpenRouterKeys() {
  const rawList = process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || '';
  const parsed = rawList
    .split(/[,\s]+/)
    .map(k => k.trim())
    .filter(k => k && k.startsWith('sk-or-') && k !== 'your_openrouter_api_key_here');

  if (process.env.OPENROUTER_BACKUP_KEY && process.env.OPENROUTER_BACKUP_KEY.startsWith('sk-or-')) {
    const backup = process.env.OPENROUTER_BACKUP_KEY.trim();
    if (!parsed.includes(backup)) parsed.push(backup);
  }

  return parsed;
}

const openRouterKeys = resolveOpenRouterKeys();

const env = {
  PORT: process.env.PORT || 3000,
  OPENROUTER_API_KEY: openRouterKeys[0] || process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_API_KEYS: openRouterKeys,
  DEFAULT_MODEL: process.env.OPENROUTER_MODEL || 'openrouter/free',
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  APP_TITLE: APP.shortTitle,
  APP_URL: process.env.APP_URL || APP.url,
  UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY || '',
  PIXABAY_API_KEY: process.env.PIXABAY_API_KEY || '',
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || ''
};

// Startup validation
if (!env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
  console.warn('\n⚠️  WARNING: OPENROUTER_API_KEY is not configured.');
  console.warn('   Set it in your .env file (local) or Vercel Environment Variables (production).');
  console.warn('   Get a free key at: https://openrouter.ai/settings/keys\n');
}

module.exports = env;
