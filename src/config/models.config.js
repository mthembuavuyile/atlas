/**
 * 100% Free OpenRouter Models
 * Zero paid credits required - All free tier & alpha testing models.
 */
const CURATED_MODELS = [
  {
    id: 'openrouter/free',
    name: 'Free Models Router',
    badge: 'AUTO FREE',
    description: 'Smart auto-router that automatically selects from available free models based on request requirements.',
    isFree: true,
    context: 'Dynamic context'
  },
  {
    id: 'stealth/ox-alpha',
    name: 'Ox Alpha',
    badge: '1.05M FREE',
    description: 'Reasoning model designed for coding, sustained agentic work, and long-horizon software engineering.',
    isFree: true,
    context: '1,048,576 tokens'
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'NVIDIA Nemotron 3 Ultra',
    badge: '1M FREE',
    description: 'Open frontier-reasoning and orchestration MoE model from NVIDIA for coding agents and deep research.',
    isFree: true,
    context: '1,000,000 tokens'
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'Poolside Laguna S 2.1',
    badge: '262K FREE',
    description: 'Specialized 118B coding agent model scoring 70.2% on Terminal-Bench for agentic software engineering.',
    isFree: true,
    context: '262,144 tokens'
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere North Mini Code',
    badge: '256K FREE',
    description: 'Agentic coding MoE model optimized for code generation, SWE tasks, and terminal workflows.',
    isFree: true,
    context: '256,000 tokens'
  },
  {
    id: 'z-ai/glm-5.2:free',
    name: 'Z.ai GLM 5.2',
    badge: '256K FREE',
    description: 'Large-scale reasoning model suited for project-level software engineering and multi-step automation.',
    isFree: true,
    context: '256,000 tokens'
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Google Gemma 4 26B',
    badge: '262K FREE',
    description: 'Instruction-tuned DeepMind MoE model with native function calling and configurable thinking mode.',
    isFree: true,
    context: '262,144 tokens'
  }
];

module.exports = { CURATED_MODELS };
