/**
 * Atlas Curated Intelligence Models
 * 100% Free - Zero paid credits required.
 */
const CURATED_MODELS = [
  {
    id: 'openrouter/free',
    name: 'Atlas Default Engine',
    badge: 'AUTO FREE',
    description: 'Smart auto-router that automatically selects from available high-performance models based on task requirements.',
    isFree: true,
    context: 'Dynamic context'
  },
  {
    id: 'stealth/ox-alpha',
    name: 'Atlas Alpha',
    badge: '1.05M FREE',
    description: 'Advanced reasoning model designed for coding, sustained agentic work, and long-horizon software engineering.',
    isFree: true,
    context: '1,048,576 tokens'
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'Atlas Ultra (MoE)',
    badge: '1M FREE',
    description: 'Frontier-reasoning orchestration engine optimized for deep research and complex architecture planning.',
    isFree: true,
    context: '1,000,000 tokens'
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'Atlas Code Engine',
    badge: '262K FREE',
    description: 'Specialized coding agent model scoring highly on terminal-based agentic software engineering benchmarks.',
    isFree: true,
    context: '262,144 tokens'
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Atlas Mini Code',
    badge: '256K FREE',
    description: 'Optimized, fast-inference MoE engine for rapid code generation, SWE tasks, and terminal workflows.',
    isFree: true,
    context: '256,000 tokens'
  },
  {
    id: 'z-ai/glm-5.2:free',
    name: 'Atlas Project Lead',
    badge: '256K FREE',
    description: 'Large-scale reasoning model suited for project-level software engineering and multi-step automation.',
    isFree: true,
    context: '256,000 tokens'
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Atlas Core',
    badge: '262K FREE',
    description: 'Instruction-tuned core model with native function calling and configurable thinking mode.',
    isFree: true,
    context: '262,144 tokens'
  }
];

module.exports = { CURATED_MODELS };
