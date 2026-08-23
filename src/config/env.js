require('dotenv').config();

const env = {
  PORT: process.env.PORT || 3000,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  DEFAULT_MODEL: process.env.OPENROUTER_MODEL || 'openrouter/free',
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  APP_TITLE: 'Atlas by Vylex Technologies',
  APP_URL: process.env.APP_URL || 'https://vylex.co.za'
};

// Startup validation
if (!env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
  console.warn('\n⚠️  WARNING: OPENROUTER_API_KEY is not configured.');
  console.warn('   Set it in your .env file (local) or Vercel Environment Variables (production).');
  console.warn('   Get a free key at: https://openrouter.ai/settings/keys\n');
}

module.exports = env;
