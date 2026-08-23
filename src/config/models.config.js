/**
 * 100% Free OpenRouter Models
 * Zero paid credits required - All free tier & alpha testing models.
 */
const CURATED_MODELS = [
  {
    id: 'openrouter/free',
    name: 'Free Models Router',
    badge: 'AUTO FREE',
    description: 'Smart auto-router that dynamically routes each prompt to the best available free model.',
    isFree: true,
    context: 'Dynamic context'
  },
  {
    id: 'stealth/ox-alpha',
    name: 'Ox Alpha',
    badge: '1M FREE',
    description: 'Frontier stealth reasoning model with 1,048,576 tokens context window.',
    isFree: true,
    context: '1,048,576 tokens'
  },
  {
    id: 'openrouter/owl-alpha',
    name: 'Owl Alpha',
    badge: '1M FREE',
    description: 'High-performance foundation model for agentic workloads and code generation.',
    isFree: true,
    context: '1,000,000 tokens'
  },
  {
    id: 'openrouter/sonoma-sky-alpha',
    name: 'Sonoma Sky Alpha',
    badge: '2M FREE',
    description: 'Maximally intelligent frontier model with 2 million token context window.',
    isFree: true,
    context: '2,000,000 tokens'
  },
  {
    id: 'openrouter/hunter-alpha',
    name: 'Hunter Alpha',
    badge: '1M FREE',
    description: 'Frontier intelligence model built for long-horizon planning and reasoning.',
    isFree: true,
    context: '1,000,000 tokens'
  },
  {
    id: 'openrouter/polaris-alpha',
    name: 'Polaris Alpha',
    badge: '256K FREE',
    description: 'Powerful model with standout performance in coding and instruction following.',
    isFree: true,
    context: '256,000 tokens'
  },
  {
    id: 'openrouter/aurora-alpha',
    name: 'Aurora Alpha',
    badge: '128K FREE',
    description: 'High-speed reasoning model designed for coding assistants and fast responses.',
    isFree: true,
    context: '128,000 tokens'
  }
];

module.exports = { CURATED_MODELS };
