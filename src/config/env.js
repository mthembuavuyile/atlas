require('dotenv').config();

const { APP, COMPANY } = require('./identity');

const env = {
  PORT: process.env.PORT || 3000,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  DEFAULT_MODEL: process.env.OPENROUTER_MODEL || 'openrouter/free',
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  APP_TITLE: APP.shortTitle,
  APP_URL: process.env.APP_URL || COMPANY.website,
  UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY || '',
  PIXABAY_API_KEY: process.env.PIXABAY_API_KEY || ''
};

// Startup validation
if (!env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
  console.warn('\n⚠️  WARNING: OPENROUTER_API_KEY is not configured.');
  console.warn('   Set it in your .env file (local) or Vercel Environment Variables (production).');
  console.warn('   Get a free key at: https://openrouter.ai/settings/keys\n');
}

module.exports = env;
