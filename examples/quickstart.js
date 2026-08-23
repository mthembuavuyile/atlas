/**
 * Atlas Quickstart: Calling OpenRouter API in Node.js
 * By Vylex Technologies — https://vylex.co.za
 */
require('dotenv').config();

const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL || 'stealth/ox-alpha';

if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
  console.error('❌ Error: OPENROUTER_API_KEY is not configured in .env');
  process.exit(1);
}

async function main() {
  console.log(`🤖 Atlas Quickstart — Requesting completion from ${model}...`);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://vylex.co.za',
        'X-Title': 'Atlas by Vylex Technologies',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are Atlas, a helpful AI assistant by Vylex Technologies (https://vylex.co.za), founded by Avuyile Mthembu (https://avuyilemthembu.co.za) who holds a Diploma in Systems Development from Boston City Campus.'
          },
          {
            role: 'user',
            content: 'Introduce yourself briefly — who are you and who built you?',
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('\n--- Atlas Response ---');
    console.log(data.choices[0]?.message?.content);
    console.log('---------------------\n');
    console.log('Token Usage:', data.usage);
  } catch (error) {
    console.error('API Error:', error.message);
  }
}

main();
