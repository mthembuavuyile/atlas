/**
 * Atlas Curated Intelligence Models
 * Scientific reasoning, mathematical intelligence, and technical problem-solving.
 * 100% Free - Zero paid credits required.
 */
const CURATED_MODELS = [
  {
    id: 'openrouter/free',
    name: 'Atlas Default Engine',
    badge: 'AUTO',
    description: 'Smart auto-router that selects the optimal reasoning model based on problem domain and complexity.',
    isFree: true,
    context: 'Dynamic context',
    bestFor: ['research', 'solve', 'build', 'engineer', 'experiment', 'reason', 'discover']
  },
  {
    id: 'stealth/ox-alpha',
    name: 'Atlas Reasoning Core',
    badge: '1.05M',
    description: 'Advanced reasoning model for deep mathematical derivation, multi-step proofs, and sustained investigative work.',
    isFree: true,
    context: '1,048,576 tokens',
    bestFor: ['reason', 'solve', 'build']
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'Atlas Research Engine',
    badge: '1M',
    description: 'Frontier-scale MoE model optimized for scientific research, hypothesis formation, and complex architecture planning.',
    isFree: true,
    context: '1,000,000 tokens',
    bestFor: ['research', 'discover', 'engineer']
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'Atlas Code Engine',
    badge: '262K',
    description: 'Specialized systems engineering model for code generation, debugging, architecture analysis, and terminal-based workflows.',
    isFree: true,
    context: '262,144 tokens',
    bestFor: ['build', 'experiment']
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Atlas Compute Engine',
    badge: '256K',
    description: 'Fast-inference MoE engine for rapid computation, data analysis, and iterative experimental workflows.',
    isFree: true,
    context: '256,000 tokens',
    bestFor: ['experiment', 'build', 'solve']
  },
  {
    id: 'z-ai/glm-5.2:free',
    name: 'Atlas Systems Engine',
    badge: '256K',
    description: 'Large-scale reasoning model for systems engineering, constraint analysis, and multi-step design verification.',
    isFree: true,
    context: '256,000 tokens',
    bestFor: ['engineer', 'reason']
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Atlas Core',
    badge: '262K',
    description: 'Instruction-tuned core model with native tool calling, configurable thinking depth, and broad scientific knowledge.',
    isFree: true,
    context: '262,144 tokens',
    bestFor: ['research', 'solve', 'reason']
  }
];

module.exports = { CURATED_MODELS };
