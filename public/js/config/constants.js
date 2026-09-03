/**
 * constants.js
 * Application constants, investigation mode definitions, vector icon library,
 * persona presets, and curated free models.
 */

export const API_BASE = (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http'))
  ? window.location.origin
  : 'http://localhost:3000';

export const INVESTIGATION_MODES = {
  auto: {
    id: 'auto',
    name: 'Auto',
    desc: 'Adapts the response to your question while preserving clear, useful reasoning',
    actionHint: 'what would you like to work on?',
    suggestions: [
      { label: 'Explain a Difficult Idea', prompt: 'Explain a difficult idea to me clearly, using an example and checking my likely assumptions.' },
      { label: 'Help Me Decide', prompt: 'Help me think through an important decision. Ask only the questions needed, then compare the options and trade-offs.' },
      { label: 'Review My Work', prompt: 'Review the work below, identify the most important problems, and suggest practical improvements.' }
    ]
  },
  research: {
    id: 'research',
    name: 'Research',
    desc: 'Literature synthesis, evidence evaluation, hypothesis formation, research maps',
    actionHint: 'what literature or evidence shall we explore?',
    suggestions: [
      { label: 'Superconductivity Landscape', prompt: 'Synthesize the current approaches, contested claims, and experimental gaps in room-temperature superconductivity.' },
      { label: 'Contradicting Hypothesis', prompt: 'Why does this experimental result contradict the standard thermodynamic hypothesis? Identify confounding variables and competing explanations.' },
      { label: 'Quantum Coherence Limits', prompt: 'Map the theoretical and empirical limits of quantum coherence at room temperature in solid-state systems.' }
    ]
  },
  solve: {
    id: 'solve',
    name: 'Solve',
    desc: 'Step-by-step derivation, calculation, verification, alternative solutions',
    actionHint: 'what equations or derivations shall we solve?',
    suggestions: [
      { label: 'Schrödinger PDE Solution', prompt: 'Derive and solve the time-independent Schrödinger equation for a finite square well potential. Verify boundary conditions.' },
      { label: 'Navier-Stokes Derivation', prompt: 'Derive the Navier-Stokes equations from the Reynolds Transport Theorem and conservation of momentum.' },
      { label: 'Bayesian Evidence Update', prompt: 'Calculate the posterior probability distribution given this prior and likelihood matrix. Verify with Monte Carlo.' }
    ]
  },
  build: {
    id: 'build',
    name: 'Build',
    desc: 'Architecture reasoning, code generation, debugging, testing, systems engineering',
    actionHint: 'what system or architecture shall we build?',
    suggestions: [
      { label: 'Sandboxed Python Runner', prompt: 'Design and write a high-throughput, secure Python code execution engine with memory cgroups and timeout guards.' },
      { label: 'Raft Consensus Node', prompt: 'Implement a complete Raft consensus state machine in TypeScript with leader election, log replication, and RPC handling.' },
      { label: 'Zero-Copy Ring Buffer', prompt: 'Write a high-performance zero-copy lock-free ring buffer for inter-process communication.' }
    ]
  },
  engineer: {
    id: 'engineer',
    name: 'Engineer',
    desc: 'Systems constraints, scalability analysis, failure modes, cost analysis',
    actionHint: 'what constraints or scalability shall we analyze?',
    suggestions: [
      { label: '10M Req/Min Architecture', prompt: 'Deconstruct the requirements, database partitioning, edge caching, and failure modes for a 10M requests/min system.' },
      { label: 'Multi-Region Active-Active', prompt: 'Design an active-active multi-region distributed system with CRDT conflict resolution and latency SLAs under 50ms.' },
      { label: 'Chaos & Fault Resilience', prompt: 'Analyze failure modes, split-brain scenarios, and network partition recovery for a distributed key-value store.' }
    ]
  },
  experiment: {
    id: 'experiment',
    name: 'Experiment',
    desc: 'Data analysis, model fitting, hypothesis testing, visualization',
    actionHint: 'what dataset or simulation shall we run?',
    suggestions: [
      { label: 'Dataset Anomaly Inspection', prompt: 'Analyse this dataset for non-linear correlations, statistical anomalies, and distribution shifts. Form hypotheses.' },
      { label: 'Monte Carlo Power Test', prompt: 'Run a Monte Carlo simulation to estimate sample size and statistical power for a multivariate randomized experiment.' },
      { label: 'Linear Model Diagnostic', prompt: 'Fit a regularized regression model to this synthetic dataset and check for heteroscedasticity and multicollinearity.' }
    ]
  },
  reason: {
    id: 'reason',
    name: 'Reason',
    desc: 'Multi-step logical decomposition, assumption identification, proof strategy',
    actionHint: 'what logical breakdown shall we deconstruct?',
    suggestions: [
      { label: 'Formal Proof Strategy', prompt: 'Prove that no general algorithm can decide whether two context-free grammars generate the same language.' },
      { label: 'First-Principles Deconstruction', prompt: 'Deconstruct the computational and thermodynamic minimum energy required to erase one bit of information (Landauer Principle).' },
      { label: 'Challenge My Hypothesis', prompt: 'Challenge my hypothesis: "Deep MoE architectures will replace dense models for all reasoning tasks within 2 years." Expose hidden assumptions.' }
    ]
  },
  discover: {
    id: 'discover',
    name: 'Discover',
    desc: 'Explore relationships, find anomalies, generate hypotheses',
    actionHint: 'what cross-domain hypothesis shall we formulate?',
    suggestions: [
      { label: 'Cross-Domain Synthesis', prompt: 'Explore potential relationships between topological quantum field theory and error-correcting codes in neural networks.' },
      { label: 'Unexplained Patterns', prompt: 'What are the most compelling unexplained observations in recent high-energy astrophysics that challenge standard models?' },
      { label: 'Hypothesis Generator', prompt: 'Generate 3 falsifiable hypotheses to explain why certain transformer attention heads develop induction capabilities abruptly.' }
    ]
  }
};

export const INVESTIGATION_STATUS_TERMS = {
  research: [
    'Parsing literature & problem space...',
    'Evaluating evidence & contradictions...',
    'Synthesizing conceptual framework...',
    'Mapping research landscape...',
    'Identifying experimental gaps...'
  ],
  solve: [
    'Deconstructing mathematical formulation...',
    'Deriving step-by-step proof...',
    'Verifying boundary conditions...',
    'Computing analytical solution...',
    'Checking logical consistency...'
  ],
  build: [
    'Analyzing architecture & dependencies...',
    'Constructing implementation logic...',
    'Evaluating edge cases & security...',
    'Optimizing algorithmic structure...',
    'Assembling code artifact...'
  ],
  engineer: [
    'Modeling system constraints & latency...',
    'Assessing failure modes & redundancy...',
    'Benchmarking scalability tradeoffs...',
    'Verifying architectural robustness...',
    'Structuring system topology...'
  ],
  experiment: [
    'Formulating test hypotheses...',
    'Simulating parameter variations...',
    'Inspecting statistical anomalies...',
    'Validating empirical outcomes...'
  ],
  reason: [
    'Deconstructing first-principles logic...',
    'Tracing logical dependencies...',
    'Exposing implicit assumptions...',
    'Constructing deductive proof...'
  ],
  discover: [
    'Mapping conceptual frontier...',
    'Synthesizing cross-domain insights...',
    'Evaluating unexplained patterns...',
    'Formulating falsifiable hypotheses...'
  ],
  default: [
    'Synthesizing problem context...',
    'Formulating reasoning trace...',
    'Tracing logical dependencies...',
    'Evaluating constraint boundaries...',
    'Structuring response hierarchy...'
  ]
};

export const ICONS = {
  freeRouter: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`,
  ox: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  owl: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="10" r="3"></circle><circle cx="16" cy="10" r="3"></circle><path d="M12 13l-1 2h2l-1-2z"></path><path d="M4 4c0 4 2 8 8 8s8-4 8-8"></path></svg>`,
  sonoma: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`,
  hunter: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>`,
  polaris: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"></path></svg>`,
  aurora: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>`,
  code: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
  canvas: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>`,
  copy: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  check: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  retry: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`,
  alert: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  reasoning: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`,
  speaker: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
  stop: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="1"></rect></svg>`,
  pin: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.76V6a3 3 0 0 0-6 0v4.76a2 2 0 0 1-1.11 1.8l-1.78.88A2 2 0 0 0 5 15.24Z"></path></svg>`,
  edit: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
  regenerate: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`
};

export function getModelIcon(modelId) {
  if (!modelId) return ICONS.ox;
  if (modelId === 'openrouter/free') return ICONS.freeRouter;
  if (modelId.includes('ox')) return ICONS.ox;
  if (modelId.includes('nemotron')) return ICONS.polaris;
  if (modelId.includes('laguna') || modelId.includes('poolside')) return ICONS.code;
  if (modelId.includes('north') || modelId.includes('cohere')) return ICONS.hunter;
  if (modelId.includes('glm') || modelId.includes('z-ai')) return ICONS.owl;
  if (modelId.includes('gemma')) return ICONS.aurora;
  return ICONS.ox;
}

export const FREE_MODELS = [
  {
    id: 'openrouter/free',
    name: 'Atlas Default Engine',
    badge: 'AUTO',
    isFree: true,
    context: 'Dynamic context',
    desc: 'Smart auto-router that automatically selects from available high-performance models based on task requirements.'
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'Atlas Reasoning Core',
    badge: '1M',
    isFree: true,
    context: '1,000,000 tokens',
    desc: 'High-speed frontier reasoning model for deep derivation, multi-step analysis, and code synthesis.'
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'Atlas Research Engine',
    badge: '1M',
    isFree: true,
    context: '1,000,000 tokens',
    desc: 'Frontier-scale MoE model optimized for scientific research, hypothesis formation, and complex architecture planning.'
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'Atlas Code Engine',
    badge: '262K',
    isFree: true,
    context: '262,144 tokens',
    desc: 'Specialized systems engineering model for code generation, debugging, architecture analysis, and terminal workflows.'
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Atlas Compute Engine',
    badge: '256K',
    isFree: true,
    context: '256,000 tokens',
    desc: 'Fast-inference MoE engine for rapid computation, data analysis, and iterative experimental workflows.'
  },
  {
    id: 'z-ai/glm-5.2:free',
    name: 'Atlas Systems Engine',
    badge: '256K',
    isFree: true,
    context: '256,000 tokens',
    desc: 'Large-scale reasoning model for systems engineering, constraint analysis, and multi-step design verification.'
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Atlas Core',
    badge: '262K',
    isFree: true,
    context: '262,144 tokens',
    desc: 'Instruction-tuned core model with native tool calling, configurable thinking depth, and broad scientific knowledge.'
  }
];

export const PERSONA_PRESETS = {
  auto: 'You are an adaptive technical assistant. Match your depth, structure, tone, and method to the user request. Answer any reasonable question directly, using rigorous analysis, code, examples, or concise guidance when helpful. Do not force a specialist format onto a general question.',
  scientist: 'You are a rigorous scientific researcher. Apply the scientific method to every problem. Form hypotheses, gather evidence, test rigorously, and always quantify your uncertainty. Distinguish clearly between what is established, what is probable, and what is speculative.',
  mathematician: 'You are a mathematician. Approach every problem with mathematical rigor. Provide formal definitions, state theorems precisely, prove claims step by step, and verify results.',
  engineer: 'You are a principal systems engineer. Focus on architecture, scalability, reliability, and operational excellence. Always present trade-offs, identify failure modes, and consider cost.',
  builder: 'You are an elite full-stack software engineer and architect. Provide clean, modular, production-ready code with robust error handling, modern patterns, and clear architectural explanations.',
  reasoner: 'You are a rigorous frontier reasoning AI. Break down all problems step-by-step with structured logical analysis, deep mathematical rigor, and explicit chain-of-thought verification.',
  concise: 'You are an ultra-concise expert. Output direct, optimal answers and solutions with minimal preamble or conversational filler.'
};
