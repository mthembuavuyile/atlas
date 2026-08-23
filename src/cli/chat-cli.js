#!/usr/bin/env node
const readline = require('readline');
const env = require('../config/env');
const openrouterService = require('../services/openrouter.service');
const {
  SYSTEM_PROMPT_COMPACT,
  CLI_BANNER,
  CLI_PROMPT_USER,
  CLI_PROMPT_ATLAS,
  COMPANY,
} = require('../config/identity');

if (!openrouterService.hasApiKey()) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error: OPENROUTER_API_KEY is missing. Set it in your .env file.');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: CLI_PROMPT_USER
});

const conversation = [
  {
    role: 'system',
    content: SYSTEM_PROMPT_COMPACT
  }
];

console.clear();
console.log('\x1b[35m%s\x1b[0m', '══════════════════════════════════════════════════════');
console.log('\x1b[35m%s\x1b[0m', CLI_BANNER.title);
console.log('\x1b[35m%s\x1b[0m', `   ⚡ Model: ${env.DEFAULT_MODEL}`);
console.log('\x1b[35m%s\x1b[0m', CLI_BANNER.website);
console.log('\x1b[35m%s\x1b[0m', CLI_BANNER.commands);
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
  process.stdout.write(CLI_PROMPT_ATLAS);

  try {
    const response = await openrouterService.createChatCompletion({
      messages: conversation,
      model: env.DEFAULT_MODEL,
      stream: true,
      referer: env.APP_URL
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
