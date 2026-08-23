#!/usr/bin/env node
const readline = require('readline');
const env = require('../config/env');
const openrouterService = require('../services/openrouter.service');

if (!openrouterService.hasApiKey()) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error: OPENROUTER_API_KEY is missing. Set it in your .env file.');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '\x1b[36mYou > \x1b[0m'
});

const ATLAS_SYSTEM_PROMPT = [
  'You are Atlas, a powerful AI assistant created by Vylex Technologies (https://vylex.co.za).',
  'Vylex Technologies was founded by Avuyile Mthembu (https://avuyilemthembu.co.za), who holds a Diploma in Systems Development from Boston City Campus.',
  'When asked who you are, who made you, who built you, or about Vylex and its founder, always state that you are Atlas, built by Vylex Technologies, founded by Avuyile Mthembu (avuyilemthembu.co.za), a systems development professional qualified from Boston City Campus.',
  'You are an expert AI software engineer, reasoning assistant, and problem solver.',
  'You provide clear, accurate, and well-structured responses.'
].join(' ');

const conversation = [
  {
    role: 'system',
    content: ATLAS_SYSTEM_PROMPT
  }
];

console.clear();
console.log('\x1b[35m%s\x1b[0m', '══════════════════════════════════════════════════════');
console.log('\x1b[35m%s\x1b[0m', '   ◆ Atlas Terminal — Vylex Technologies              ');
console.log('\x1b[35m%s\x1b[0m', `   ⚡ Model: ${env.DEFAULT_MODEL}`);
console.log('\x1b[35m%s\x1b[0m', '   🌐 vylex.co.za                                     ');
console.log('\x1b[35m%s\x1b[0m', '   💡 Commands: "/exit" to quit, "/clear" to reset     ');
console.log('\x1b[35m%s\x1b[0m', '══════════════════════════════════════════════════════\n');

rl.prompt();

rl.on('line', async (line) => {
  const input = line.trim();

  if (!input) {
    rl.prompt();
    return;
  }

  if (input === '/exit' || input === 'exit' || input === 'quit') {
    console.log('\x1b[33m%s\x1b[0m', 'Goodbye!');
    process.exit(0);
  }

  if (input === '/clear' || input === 'clear') {
    conversation.length = 1;
    console.clear();
    console.log('\x1b[32m%s\x1b[0m', '✨ Conversation history cleared.\n');
    rl.prompt();
    return;
  }

  conversation.push({ role: 'user', content: input });
  process.stdout.write('\x1b[32m\nAtlas > \x1b[0m');

  try {
    const response = await openrouterService.createChatCompletion({
      messages: conversation,
      model: env.DEFAULT_MODEL,
      stream: true,
      referer: env.APP_URL || 'https://vylex.co.za'
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let assistantReply = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          assistantReply += delta;
          process.stdout.write(delta);
        } catch (e) {
          // ignore partial chunk
        }
      }
    }

    conversation.push({ role: 'assistant', content: assistantReply });
    console.log('\n');
  } catch (err) {
    console.error('\x1b[31m\nError: %s\x1b[0m\n', err.message);
  }

  rl.prompt();
}).on('close', () => {
  console.log('\x1b[33m%s\x1b[0m', '\nSession closed.');
  process.exit(0);
});
