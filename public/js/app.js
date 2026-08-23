/**
 * Atlas — Scientific Intelligence Platform by Vylex Technologies
 * https://vylex.co.za
 * Technical Reasoning · Multi-Model Deliberation · Action Execution Layer
 */

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = (window.location.protocol.startsWith('http'))
    ? window.location.origin
    : 'http://localhost:3000';

  // Scientific Reasoning & Cognitive Architecture Verbs (for Response Bubble)
  const THOUGHT_VERBS = [
    'Formulating Hypothesis Space',
    'Deconstructing Logical Invariants',
    'Evaluating Mathematical Proof Steps',
    'Checking Thermodynamic & Physical Constraints',
    'Synthesizing Cross-Disciplinary Evidence',
    'Isolating Confounding Variables',
    'Deriving Formal Differential Operators',
    'Analyzing Distributed System Topologies',
    'Traversing Axiomatic Proof Graph',
    'Testing Falsification Criteria',
    'Validating Dimensional Consistency',
    'Synthesizing Competing Explanations',
    'Computing Boundary Value Constraints',
    'Verifying Type Soundness & Contracts',
    'Constructing First-Principles Derivation'
  ];

  // Real-Time Token Generation & Telemetry Verbs (for Input Bar Streaming Indicator)
  const STREAMING_VERBS = [
    'Streaming Investigation Pipeline',
    'Executing Computational Verification',
    'Transmitting Investigation Stream',
    'Evaluating Logical Invariants',
    'Synthesizing Evidence Matrix',
    'Pipelining Frontier Model Output',
    'Decoding Mathematical AST',
    'Synchronizing Computational Buffer',
    'Broadcasting Reasoning Telemetry',
    'Parsing Symbolic Expression Stream'
  ];

  // --- 7 Investigation Modes Definitions ---
  const INVESTIGATION_MODES = {
    research: {
      id: 'research',
      name: 'Research',
      icon: '🔬',
      desc: 'Literature synthesis, evidence evaluation, hypothesis formation, research maps',
      suggestions: [
        { label: 'Superconductivity Landscape', prompt: 'Synthesize the current approaches, contested claims, and experimental gaps in room-temperature superconductivity.' },
        { label: 'Contradicting Hypothesis', prompt: 'Why does this experimental result contradict the standard thermodynamic hypothesis? Identify confounding variables and competing explanations.' },
        { label: 'Quantum Coherence Limits', prompt: 'Map the theoretical and empirical limits of quantum coherence at room temperature in solid-state systems.' }
      ]
    },
    solve: {
      id: 'solve',
      name: 'Solve',
      icon: '🧮',
      desc: 'Step-by-step derivation, calculation, verification, alternative solutions',
      suggestions: [
        { label: 'Schrödinger PDE Solution', prompt: 'Derive and solve the time-independent Schrödinger equation for a finite square well potential. Verify boundary conditions.' },
        { label: 'Navier-Stokes Derivation', prompt: 'Derive the Navier-Stokes equations from the Reynolds Transport Theorem and conservation of momentum.' },
        { label: 'Bayesian Evidence Update', prompt: 'Calculate the posterior probability distribution given this prior and likelihood matrix. Verify with Monte Carlo.' }
      ]
    },
    build: {
      id: 'build',
      name: 'Build',
      icon: '💻',
      desc: 'Architecture reasoning, code generation, debugging, testing, systems engineering',
      suggestions: [
        { label: 'Sandboxed Python Runner', prompt: 'Design and write a high-throughput, secure Python code execution engine with memory cgroups and timeout guards.' },
        { label: 'Raft Consensus Node', prompt: 'Implement a complete Raft consensus state machine in TypeScript with leader election, log replication, and RPC handling.' },
        { label: 'Zero-Copy Ring Buffer', prompt: 'Write a high-performance zero-copy lock-free ring buffer for inter-process communication.' }
      ]
    },
    engineer: {
      id: 'engineer',
      name: 'Engineer',
      icon: '⚙️',
      desc: 'Systems constraints, scalability analysis, failure modes, cost analysis',
      suggestions: [
        { label: '10M Req/Min Architecture', prompt: 'Deconstruct the requirements, database partitioning, edge caching, and failure modes for a 10M requests/min system.' },
        { label: 'Multi-Region Active-Active', prompt: 'Design an active-active multi-region distributed system with CRDT conflict resolution and latency SLAs under 50ms.' },
        { label: 'Chaos & Fault Resilience', prompt: 'Analyze failure modes, split-brain scenarios, and network partition recovery for a distributed key-value store.' }
      ]
    },
    experiment: {
      id: 'experiment',
      name: 'Experiment',
      icon: '🧪',
      desc: 'Data analysis, model fitting, hypothesis testing, visualization',
      suggestions: [
        { label: 'Dataset Anomaly Inspection', prompt: 'Analyse this dataset for non-linear correlations, statistical anomalies, and distribution shifts. Form hypotheses.' },
        { label: 'Monte Carlo Power Test', prompt: 'Run a Monte Carlo simulation to estimate sample size and statistical power for a multivariate randomized experiment.' },
        { label: 'Linear Model Diagnostic', prompt: 'Fit a regularized regression model to this synthetic dataset and check for heteroscedasticity and multicollinearity.' }
      ]
    },
    reason: {
      id: 'reason',
      name: 'Reason',
      icon: '🧠',
      desc: 'Multi-step logical decomposition, assumption identification, proof strategy',
      suggestions: [
        { label: 'Formal Proof Strategy', prompt: 'Prove that no general algorithm can decide whether two context-free grammars generate the same language.' },
        { label: 'First-Principles Deconstruction', prompt: 'Deconstruct the computational and thermodynamic minimum energy required to erase one bit of information (Landauer Principle).' },
        { label: 'Challenge My Hypothesis', prompt: 'Challenge my hypothesis: "Deep MoE architectures will replace dense models for all reasoning tasks within 2 years." Expose hidden assumptions.' }
      ]
    },
    discover: {
      id: 'discover',
      name: 'Discover',
      icon: '🔭',
      desc: 'Explore relationships, find anomalies, generate hypotheses',
      suggestions: [
        { label: 'Cross-Domain Synthesis', prompt: 'Explore potential relationships between topological quantum field theory and error-correcting codes in neural networks.' },
        { label: 'Unexplained Patterns', prompt: 'What are the most compelling unexplained observations in recent high-energy astrophysics that challenge standard models?' },
        { label: 'Hypothesis Generator', prompt: 'Generate 3 falsifiable hypotheses to explain why certain transformer attention heads develop induction capabilities abruptly.' }
      ]
    }
  };

  // --- Clean Precision Vector SVGs ---
  const ICONS = {
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
    speaker: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`
  };

  function getModelIcon(modelId) {
    if (modelId === 'openrouter/free') return ICONS.freeRouter;
    if (modelId.includes('ox')) return ICONS.ox;
    if (modelId.includes('nemotron')) return ICONS.polaris;
    if (modelId.includes('laguna') || modelId.includes('poolside')) return ICONS.code;
    if (modelId.includes('north') || modelId.includes('cohere')) return ICONS.hunter;
    if (modelId.includes('glm') || modelId.includes('z-ai')) return ICONS.owl;
    if (modelId.includes('gemma')) return ICONS.aurora;
    return ICONS.ox;
  }

  // --- Vylex Atlas Intelligence Models (Default: vylex/auto) ---
  const FREE_MODELS = [
    {
      id: 'openrouter/free',
      name: 'Atlas Default Engine',
      badge: 'AUTO FREE',
      isFree: true,
      context: 'Dynamic context',
      desc: 'Smart auto-router that automatically selects from available high-performance models based on task requirements.'
    },
    {
      id: 'stealth/ox-alpha',
      name: 'Atlas Reasoning Core',
      badge: '1.05M FREE',
      isFree: true,
      context: '1,048,576 tokens',
      desc: 'Advanced reasoning model for deep mathematical derivation, multi-step proofs, and sustained investigative work.'
    },
    {
      id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
      name: 'Atlas Research Engine',
      badge: '1M FREE',
      isFree: true,
      context: '1,000,000 tokens',
      desc: 'Frontier-scale MoE model optimized for scientific research, hypothesis formation, and complex architecture planning.'
    },
    {
      id: 'poolside/laguna-s-2.1:free',
      name: 'Atlas Code Engine',
      badge: '262K FREE',
      isFree: true,
      context: '262,144 tokens',
      desc: 'Specialized systems engineering model for code generation, debugging, architecture analysis, and terminal-based workflows.'
    },
    {
      id: 'cohere/north-mini-code:free',
      name: 'Atlas Compute Engine',
      badge: '256K FREE',
      isFree: true,
      context: '256,000 tokens',
      desc: 'Fast-inference MoE engine for rapid computation, data analysis, and iterative experimental workflows.'
    },
    {
      id: 'z-ai/glm-5.2:free',
      name: 'Atlas Systems Engine',
      badge: '256K FREE',
      isFree: true,
      context: '256,000 tokens',
      desc: 'Large-scale reasoning model for systems engineering, constraint analysis, and multi-step design verification.'
    },
    {
      id: 'google/gemma-4-26b-a4b-it:free',
      name: 'Atlas Core',
      badge: '262K FREE',
      isFree: true,
      context: '262,144 tokens',
      desc: 'Instruction-tuned core model with native tool calling, configurable thinking depth, and broad scientific knowledge.'
    }
  ];

  // --- DOM Elements ---
  const sidebar = document.getElementById('sidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const newChatBtn = document.getElementById('newChatBtn');
  const historySearchInput = document.getElementById('historySearchInput');
  const historyListToday = document.getElementById('historyListToday');
  const historyListYesterday = document.getElementById('historyListYesterday');
  const historyListPrevious = document.getElementById('historyListPrevious');
  const emptyHistoryState = document.getElementById('emptyHistoryState');

  // Top Nav
  const modelPillTrigger = document.getElementById('modelPillTrigger');
  const modelDropdownCapsule = modelPillTrigger?.closest('.model-dropdown-capsule');
  const modelCurrentName = document.getElementById('modelCurrentName');
  const modelPillBadge = document.getElementById('modelPillBadge');
  const modelSparkIcon = document.getElementById('modelSparkIcon');
  const modelOptionsList = document.getElementById('modelOptionsList');
  const themeBtns = document.querySelectorAll('.theme-btn');
  const sessionMetricBadge = document.getElementById('metricMsgCount');
  const toggleCanvasBtn = document.getElementById('toggleCanvasBtn');

  // Export Menu
  const exportMenuBtn = document.getElementById('exportMenuBtn');
  const exportDropdownWrapper = exportMenuBtn?.closest('.export-dropdown-wrapper');
  const exportMarkdownBtn = document.getElementById('exportMarkdownBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const clearCurrentChatBtn = document.getElementById('clearCurrentChatBtn');

  // Feed & Welcome
  const messagesContainer = document.getElementById('messagesContainer');
  const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
  const welcomeScreen = document.getElementById('welcomeScreen');
  const dynamicTimeGreeting = document.getElementById('dynamicTimeGreeting');
  const modeSelectorGrid = document.getElementById('modeSelectorGrid');
  const activeModeBanner = document.getElementById('activeModeBanner');
  const activeModeTag = document.getElementById('activeModeTag');
  const activeModeDesc = document.getElementById('activeModeDesc');
  const suggestionPillsContainer = document.getElementById('suggestionPillsContainer');
  const bannerModelTitle = document.getElementById('bannerModelTitle');
  const bannerModelDesc = document.getElementById('bannerModelDesc');
  const bannerModelSvg = document.getElementById('bannerModelSvg');
  const categoryTabs = document.querySelectorAll('.cat-tab');
  const promptCards = document.querySelectorAll('.prompt-card');

  // Composer
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const stopGenerationBtn = document.getElementById('stopGenerationBtn');
  const streamingIndicator = document.getElementById('streamingIndicator');
  const hintModelName = document.getElementById('hintModelName');
  const hintContextSize = document.getElementById('hintContextSize');
  const openSysPromptModalBtn = document.getElementById('openSysPromptModalBtn');
  const activePromptLabel = document.getElementById('activePromptLabel');
  const deepThinkToggleBtn = document.getElementById('deepThinkToggleBtn');
  const webSearchToggleBtn = document.getElementById('webSearchToggleBtn');
  const webSearchLabel = document.getElementById('webSearchLabel');
  const attachFileMockBtn = document.getElementById('attachFileMockBtn');

  // Canvas Panel
  const artifactsCanvasPanel = document.getElementById('artifactsCanvasPanel');
  const closeCanvasBtn = document.getElementById('closeCanvasBtn');
  const canvasDocumentTitle = document.getElementById('canvasDocumentTitle');
  const canvasTypeTag = document.getElementById('canvasTypeTag');
  const canvasTabs = document.querySelectorAll('.canvas-tab');
  const canvasCodePane = document.getElementById('canvasCodePane');
  const canvasPreviewPane = document.getElementById('canvasPreviewPane');
  const canvasMarkdownPane = document.getElementById('canvasMarkdownPane');
  const canvasCodeContent = document.getElementById('canvasCodeContent');
  const canvasLanguageBadge = document.getElementById('canvasLanguageBadge');
  const canvasLineCount = document.getElementById('canvasLineCount');
  const canvasPreviewFrame = document.getElementById('canvasPreviewFrame');
  const canvasMarkdownContent = document.getElementById('canvasMarkdownContent');
  const copyCanvasContentBtn = document.getElementById('copyCanvasContentBtn');
  const downloadCanvasBtn = document.getElementById('downloadCanvasBtn');

  // Settings Modal
  const systemPromptModal = document.getElementById('systemPromptModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const customSystemPrompt = document.getElementById('customSystemPrompt');
  const resetModalPromptBtn = document.getElementById('resetModalPromptBtn');
  const temperatureSlider = document.getElementById('temperatureSlider');
  const tempValBadge = document.getElementById('tempValBadge');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const presetPills = document.querySelectorAll('.preset-pill');
  const systemPromptDrawerBtn = document.getElementById('systemPromptDrawerBtn');

  // Persona Presets for Domain Intelligence
  const PERSONA_PRESETS = {
    scientist: 'You are a rigorous scientific researcher. Apply the scientific method to every problem. Form hypotheses, gather evidence, test rigorously, and always quantify your uncertainty. Distinguish clearly between what is established, what is probable, and what is speculative.',
    mathematician: 'You are a mathematician. Approach every problem with mathematical rigor. Provide formal definitions, state theorems precisely, prove claims step by step, and verify results.',
    engineer: 'You are a principal systems engineer. Focus on architecture, scalability, reliability, and operational excellence. Always present trade-offs, identify failure modes, and consider cost.',
    builder: 'You are an elite full-stack software engineer and architect. Provide clean, modular, production-ready code with robust error handling, modern patterns, and clear architectural explanations.',
    reasoner: 'You are a rigorous frontier reasoning AI. Break down all problems step-by-step with structured logical analysis, deep mathematical rigor, and explicit chain-of-thought verification.',
    concise: 'You are an ultra-concise expert. Output direct, optimal answers and solutions with minimal preamble or conversational filler.'
  };

  // Migration from legacy omni_sessions to atlas_investigations
  const savedInvestigations = localStorage.getItem('atlas_investigations') || localStorage.getItem('omni_sessions') || '[]';

  let state = {
    theme: localStorage.getItem('omni_theme') || 'vylex',
    currentModel: localStorage.getItem('omni_model') || 'openrouter/free',
    models: FREE_MODELS,
    activeMode: localStorage.getItem('atlas_mode') || 'research',
    systemPrompt: localStorage.getItem('omni_sys_prompt') || PERSONA_PRESETS.scientist,
    activePreset: localStorage.getItem('omni_preset') || 'scientist',
    temperature: parseFloat(localStorage.getItem('omni_temp') || '0.7'),
    isDeepReasoning: true,
    isWebSearch: localStorage.getItem('omni_web_search') === 'true',
    sessions: JSON.parse(savedInvestigations),
    activeSessionId: null,
    isGenerating: false,
    abortController: null,
    activeArtifact: null,
    lastUserPrompt: ''
  };


  // --- Rich Callout Alert Icons & Definitions ---
  const CALLOUT_ICONS = {
    note: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    tip: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>',
    important: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    warning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    caution: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
  };

  // Configure marked with rich typography extensions
  if (window.marked) {
    const customRenderer = new marked.Renderer();

    // 1. Rich Responsive Table Wrapper
    customRenderer.table = function (tokenOrHeader, body) {
      if (tokenOrHeader && typeof tokenOrHeader === 'object' && !body) {
        // Modern Marked (v12+): tokenOrHeader is a table token object
        const token = tokenOrHeader;
        let headerHtml = '';
        let bodyHtml = '';

        if (token.header && Array.isArray(token.header)) {
          headerHtml = '<tr>' + token.header.map(cell => {
            const cellContent = this.parser && cell.tokens ? this.parser.parseInline(cell.tokens) : (cell.text || '');
            const align = cell.align ? ` align="${cell.align}"` : '';
            return `<th${align}>${cellContent}</th>`;
          }).join('') + '</tr>';
        }

        if (token.rows && Array.isArray(token.rows)) {
          bodyHtml = token.rows.map(row => {
            return '<tr>' + row.map(cell => {
              const cellContent = this.parser && cell.tokens ? this.parser.parseInline(cell.tokens) : (cell.text || '');
              const align = cell.align ? ` align="${cell.align}"` : '';
              return `<td${align}>${cellContent}</td>`;
            }).join('') + '</tr>';
          }).join('');
        }

        return `<div class="table-container"><table class="rich-table"><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table></div>`;
      }

      // Legacy Marked (v4-v11): (header, body)
      return `<div class="table-container"><table class="rich-table"><thead>${tokenOrHeader || ''}</thead><tbody>${body || ''}</tbody></table></div>`;
    };

    // 2. GitHub-style Alert Callouts inside blockquotes
    customRenderer.blockquote = function (tokenOrQuote) {
      let quoteHtml = '';
      if (tokenOrQuote && typeof tokenOrQuote === 'object' && !Array.isArray(tokenOrQuote)) {
        // Modern Marked v12+ token
        quoteHtml = this.parser && tokenOrQuote.tokens ? this.parser.parse(tokenOrQuote.tokens) : (tokenOrQuote.text || '');
      } else {
        quoteHtml = String(tokenOrQuote || '');
      }

      const match = quoteHtml.match(/^\s*(?:<p>)?\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br>|\n)?([\s\S]*?)(?:<\/p>)?\s*$/i);
      if (match) {
        const type = match[1].toLowerCase();
        const icon = CALLOUT_ICONS[type] || CALLOUT_ICONS.note;
        const title = type.charAt(0).toUpperCase() + type.slice(1);
        const bodyContent = match[2];
        return `<div class="callout-card callout-${type}"><div class="callout-header">${icon}<span>${title}</span></div><div class="callout-body"><p>${bodyContent}</p></div></div>`;
      }
      return `<blockquote>${quoteHtml}</blockquote>`;
    };

    // 3. Task list checkboxes & list items
    customRenderer.listitem = function (tokenOrText, task, checked) {
      let itemHtml = '';
      let isTask = false;
      let isChecked = false;

      if (tokenOrText && typeof tokenOrText === 'object' && !Array.isArray(tokenOrText)) {
        // Modern Marked v12+ token: { type: 'list_item', text, task, checked, tokens }
        isTask = Boolean(tokenOrText.task);
        isChecked = Boolean(tokenOrText.checked);
        if (this.parser && tokenOrText.tokens) {
          itemHtml = this.parser.parseInline(tokenOrText.tokens);
        } else {
          itemHtml = tokenOrText.text || '';
        }
      } else {
        // Legacy Marked signature: (text, task, checked)
        itemHtml = String(tokenOrText || '');
        isTask = Boolean(task);
        isChecked = Boolean(checked);
      }

      if (isTask) {
        return `<li class="task-list-item"><input type="checkbox" class="task-list-checkbox" ${isChecked ? 'checked' : ''} disabled /><span>${itemHtml}</span></li>`;
      }
      return `<li>${itemHtml}</li>`;
    };

    // 4. Clean divider
    customRenderer.hr = function () {
      return `<hr class="rich-divider" />`;
    };

    marked.setOptions({
      renderer: customRenderer,
      highlight: function (code, lang) {
        if (window.hljs && lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (e) {
            console.warn(e);
          }
        }
        if (window.hljs) {
          try {
            return hljs.highlightAuto(code).value;
          } catch (e) {
            return code;
          }
        }
        return code;
      },
      breaks: true,
      gfm: true
    });
  }

  // --- INITIALIZATION ---
  async function init() {
    applyTheme(state.theme);
    updateDynamicGreeting();
    renderModelOptions();
    syncModelDisplay(state.currentModel);
    syncModeDisplay(state.activeMode);
    loadSavedSettings();
    initSessionManager();
    await checkBackendHealth();
    setupEventListeners();
    setupModeSelector();
  }

  // --- THEME CONTROLLER ---
  function applyTheme(themeName) {
    state.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('omni_theme', themeName);

    themeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme-val') === themeName);
    });
  }

  // --- MODE CONTROLLER (7 Investigation Modes) ---
  function setupModeSelector() {
    if (!modeSelectorGrid) return;

    modeSelectorGrid.querySelectorAll('.mode-card-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const modeId = pill.getAttribute('data-mode');
        selectMode(modeId);
      });
    });
  }

  function selectMode(modeId) {
    if (!INVESTIGATION_MODES[modeId]) return;
    state.activeMode = modeId;
    localStorage.setItem('atlas_mode', modeId);
    syncModeDisplay(modeId);

    // If an active session exists and is empty, update its mode
    const session = getActiveSession();
    if (session && session.messages.length === 0) {
      session.mode = modeId;
      saveSessions();
    }
  }

  function syncModeDisplay(modeId) {
    const mode = INVESTIGATION_MODES[modeId] || INVESTIGATION_MODES.research;

    // Update active pill in grid
    if (modeSelectorGrid) {
      modeSelectorGrid.querySelectorAll('.mode-card-pill').forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-mode') === mode.id);
      });
    }

    // Update active banner
    if (activeModeTag) activeModeTag.textContent = `${mode.icon} Mode: ${mode.name}`;
    if (activeModeDesc) activeModeDesc.textContent = mode.desc;
    if (activePromptLabel) activePromptLabel.textContent = `Mode: ${mode.name}`;

    // Update suggestion pills
    if (suggestionPillsContainer && mode.suggestions) {
      suggestionPillsContainer.innerHTML = '';
      mode.suggestions.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'prompt-card suggestion-pill';
        btn.setAttribute('data-prompt', item.prompt);
        btn.textContent = item.label;
        btn.addEventListener('click', () => {
          messageInput.value = item.prompt;
          autoResizeTextarea();
          messageInput.focus();
        });
        suggestionPillsContainer.appendChild(btn);
      });
    }
  }

  // --- DYNAMIC GREETING ---
  function updateDynamicGreeting() {
    if (!dynamicTimeGreeting) return;
    const hour = new Date().getHours();
    let greeting = 'Good evening';
    if (hour >= 5 && hour < 12) greeting = 'Good morning';
    else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 22 || hour < 5) greeting = 'Good night';
    dynamicTimeGreeting.textContent = `${greeting} — Research Environment`;
  }

  // --- BACKEND HEALTH & MODELS ---
  async function checkBackendHealth() {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Fetch dynamic models list from backend
      const mRes = await fetch(`${API_BASE}/api/models`);
      const mData = await mRes.json();
      if (mData.models && Array.isArray(mData.models) && mData.models.length > 0) {
        state.models = mData.models;
        renderModelOptions();
        syncModelDisplay(state.currentModel);
      }
    } catch (err) {
      console.warn('Backend offline:', err);
    }
  }

  // --- MODEL DROPDOWN CONTROLLER ---
  function renderModelOptions() {
    if (!modelOptionsList) return;
    modelOptionsList.innerHTML = '';

    state.models.forEach(model => {
      const card = document.createElement('div');
      card.className = `model-option-card ${model.id === state.currentModel ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="model-option-top">
          <span class="model-option-name" style="display: flex; align-items: center; gap: 6px;">
            ${getModelIcon(model.id)}
            <span>${escapeHtml(model.name)}</span>
          </span>
          <span class="model-option-tag">${model.badge}</span>
        </div>
        <div class="model-option-desc">${escapeHtml(model.description || model.desc || '')}</div>
      `;

      card.addEventListener('click', () => {
        selectModel(model.id);
        modelDropdownCapsule?.classList.remove('open');
      });

      modelOptionsList.appendChild(card);
    });
  }

  function selectModel(modelId) {
    state.currentModel = modelId;
    localStorage.setItem('omni_model', modelId);
    syncModelDisplay(modelId);
    renderModelOptions();
  }

  function syncModelDisplay(modelId) {
    const model = state.models.find(m => m.id === modelId) || state.models[0];
    if (!model) return;

    if (modelCurrentName) modelCurrentName.textContent = model.name;
    if (modelPillBadge) modelPillBadge.textContent = model.badge;
    if (modelSparkIcon) modelSparkIcon.innerHTML = getModelIcon(model.id);
    if (hintModelName) hintModelName.textContent = model.name;
    if (hintContextSize) hintContextSize.textContent = model.context;

    if (bannerModelTitle) bannerModelTitle.textContent = model.name;
    if (bannerModelDesc) bannerModelDesc.textContent = `${model.context} context window • ${model.description || model.desc || ''}`;
    if (bannerModelSvg) bannerModelSvg.innerHTML = getModelIcon(model.id);
  }

  // --- SIDEBAR TOGGLE CONTROLLER ---
  function toggleSidebar() {
    if (window.innerWidth <= 768) {
      const isOpen = sidebar.classList.toggle('open');
      sidebarBackdrop?.classList.toggle('active', isOpen);
    } else {
      sidebar.classList.toggle('collapsed');
    }
  }

  function closeMobileSidebar() {
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('open');
      sidebarBackdrop?.classList.remove('active');
    }
  }

  // --- INVESTIGATION & HISTORY MANAGEMENT ---
  function initSessionManager() {
    if (state.sessions.length === 0) {
      startNewSession();
    } else {
      loadSession(state.sessions[0].id);
    }
    renderHistoryTree();
  }

  function startNewSession() {
    const newSession = {
      id: 'inv_' + Date.now(),
      title: 'New Investigation',
      mode: state.activeMode,
      timestamp: Date.now(),
      messages: [],
      model: state.currentModel,
      hasAiTitle: false
    };

    state.sessions.unshift(newSession);
    saveSessions();
    loadSession(newSession.id);
    renderHistoryTree();
  }

  function getActiveSession() {
    return state.sessions.find(s => s.id === state.activeSessionId);
  }

  function loadSession(sessionId) {
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return;

    state.activeSessionId = session.id;
    if (session.mode && INVESTIGATION_MODES[session.mode]) {
      state.activeMode = session.mode;
      syncModeDisplay(session.mode);
    }

    messagesContainer.innerHTML = '';

    if (session.messages.length === 0) {
      if (welcomeScreen) {
        messagesContainer.appendChild(welcomeScreen);
        welcomeScreen.style.display = 'flex';
      }
    } else {
      if (welcomeScreen) welcomeScreen.style.display = 'none';
      session.messages.forEach(msg => {
        renderMessageItem(msg.role, msg.content, msg.reasoning, false);
      });
    }

    updateMetrics();
    renderHistoryTree();
    scrollToBottom();
  }

  function saveSessions() {
    localStorage.setItem('atlas_investigations', JSON.stringify(state.sessions));
    localStorage.setItem('omni_sessions', JSON.stringify(state.sessions)); // backward compat
  }


  function renderHistoryTree(filterQuery = '') {
    if (!historyListToday || !historyListYesterday || !historyListPrevious) return;

    historyListToday.innerHTML = '';
    historyListYesterday.innerHTML = '';
    historyListPrevious.innerHTML = '';

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    let matchCount = 0;

    state.sessions.forEach(session => {
      if (filterQuery && !session.title.toLowerCase().includes(filterQuery.toLowerCase())) {
        return;
      }
      matchCount++;

      const item = document.createElement('div');
      item.className = `history-item ${session.id === state.activeSessionId ? 'active' : ''}`;
      item.setAttribute('data-session-id', session.id);
      item.innerHTML = `
        <span class="history-item-title">${escapeHtml(session.title)}</span>
        <div class="history-item-actions">
          <button class="item-action-btn delete-chat-btn" title="Delete conversation">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.delete-chat-btn')) {
          e.stopPropagation();
          deleteSession(session.id);
          return;
        }
        loadSession(session.id);
        closeMobileSidebar();
      });

      const age = now - session.timestamp;
      if (age < oneDay) {
        historyListToday.appendChild(item);
      } else if (age < oneDay * 2) {
        historyListYesterday.appendChild(item);
      } else {
        historyListPrevious.appendChild(item);
      }
    });

    if (emptyHistoryState) {
      emptyHistoryState.style.display = matchCount === 0 ? 'block' : 'none';
    }
  }

  function deleteSession(sessionId) {
    state.sessions = state.sessions.filter(s => s.id !== sessionId);
    saveSessions();
    if (state.sessions.length === 0) {
      startNewSession();
    } else if (state.activeSessionId === sessionId) {
      loadSession(state.sessions[0].id);
    } else {
      renderHistoryTree();
    }
  }

  function updateMetrics() {
    const session = getActiveSession();
    const count = session ? session.messages.length : 0;
    if (sessionMetricBadge) {
      sessionMetricBadge.textContent = `${count} msg${count === 1 ? '' : 's'}`;
    }
  }

  // --- AI CHAT TITLE GENERATION (Claude / ChatGPT / Gemini style) ---
  async function triggerAiTitleGeneration(session, userPrompt) {
    if (session.hasAiTitle || !userPrompt) return;

    try {
      const res = await fetch(`${API_BASE}/api/title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userPrompt,
          model: state.currentModel
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.title && data.title.trim().length > 0) {
          session.title = data.title.trim();
          session.hasAiTitle = true;
          saveSessions();

          // Smoothly update title in sidebar DOM
          const el = document.querySelector(`.history-item[data-session-id="${session.id}"] .history-item-title`);
          if (el) {
            el.style.opacity = '0';
            setTimeout(() => {
              el.textContent = session.title;
              el.style.opacity = '1';
            }, 180);
          }
        }
      }
    } catch (e) {
      console.warn('Background AI Title generation skipped:', e.message);
    }
  }

  // --- ANIMATED REASONING & STREAMING VERB ENGINE ---
  function startVerbAnimation(element, verbs = THOUGHT_VERBS, prefix = '', suffix = '...') {
    let index = Math.floor(Math.random() * verbs.length);
    element.textContent = `${prefix}${verbs[index]}${suffix}`;

    const timer = setInterval(() => {
      index = (index + 1) % verbs.length;
      element.style.opacity = '0.35';
      setTimeout(() => {
        element.textContent = `${prefix}${verbs[index]}${suffix}`;
        element.style.opacity = '1';
      }, 150);
    }, 1400);

    return () => clearInterval(timer);
  }

  // --- RESILIENT ERROR CLASSIFIER & DIAGNOSTIC CARD ENGINE ---
  const ERROR_TYPES = {
    OFFLINE: 'OFFLINE',
    RATE_LIMIT: 'RATE_LIMIT',
    CONTEXT_OVERFLOW: 'CONTEXT_OVERFLOW',
    CONTENT_FILTER: 'CONTENT_FILTER',
    STREAM_INTERRUPTED: 'STREAM_INTERRUPTED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    GENERAL: 'GENERAL'
  };

  function classifyError(err, hasPartialContent = false) {
    const msg = (err.message || '').toLowerCase();

    if (!navigator.onLine || msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('err_connection')) {
      return ERROR_TYPES.OFFLINE;
    }
    if (hasPartialContent && (msg.includes('network') || msg.includes('stream') || msg.includes('aborted') || msg.includes('timeout'))) {
      return ERROR_TYPES.STREAM_INTERRUPTED;
    }
    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('throttled')) {
      return ERROR_TYPES.RATE_LIMIT;
    }
    if (msg.includes('context') || msg.includes('maximum context') || msg.includes('token limit') || msg.includes('too long') || msg.includes('prompt is too long')) {
      return ERROR_TYPES.CONTEXT_OVERFLOW;
    }
    if (msg.includes('moderation') || msg.includes('safety') || msg.includes('policy') || msg.includes('flagged') || msg.includes('content violation')) {
      return ERROR_TYPES.CONTENT_FILTER;
    }
    if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504') || msg.includes('overloaded') || msg.includes('internal server')) {
      return ERROR_TYPES.SERVICE_UNAVAILABLE;
    }
    if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized') || msg.includes('api key')) {
      return ERROR_TYPES.AUTH_REQUIRED;
    }
    return ERROR_TYPES.GENERAL;
  }

  function buildDiagnosticErrorCard(err, failedPrompt, options = {}) {
    const errorType = classifyError(err, Boolean(options.hasPartialContent));
    const errorMsg = err.message || 'Unknown network error';

    let title = 'Studio Engine Exception';
    let badge = 'ERROR';
    let badgeBg = 'rgba(239, 68, 68, 0.2)';
    let badgeColor = '#fca5a5';
    let desc = errorMsg;
    let resolution = 'Please retry your request or switch to an alternate engine.';
    let showCountdown = false;
    let countdownSeconds = options.retryAfter || 15;
    let allowPruneHistory = false;
    let allowEditPrompt = false;

    switch (errorType) {
      case ERROR_TYPES.OFFLINE:
        title = 'Network Offline / Connection Lost';
        badge = 'OFFLINE';
        badgeBg = 'rgba(239, 68, 68, 0.25)';
        badgeColor = '#f87171';
        desc = 'Your device lost connection to the internet or the Atlas server.';
        resolution = 'Check your network connection. Atlas has preserved your unsent message draft and will automatically reconnect when online.';
        break;

      case ERROR_TYPES.RATE_LIMIT:
        title = 'Provider Rate Limit / High Concurrency (429)';
        badge = 'RATE LIMITED';
        badgeBg = 'rgba(245, 158, 11, 0.25)';
        badgeColor = '#fcd34d';
        desc = 'Upstream AI host is experiencing temporary high concurrency.';
        resolution = 'Atlas has scheduled an automated cooldown. Wait for the countdown to finish or switch to Atlas Default Engine.';
        showCountdown = true;
        break;

      case ERROR_TYPES.CONTEXT_OVERFLOW:
        title = 'Conversation Context Window Overflow';
        badge = 'CONTEXT LIMIT';
        badgeBg = 'rgba(168, 85, 247, 0.25)';
        badgeColor = '#d8b4fe';
        desc = 'The total conversation history exceeds the active model’s token capacity.';
        resolution = 'Start a fresh session (your history remains saved in the sidebar) or prune older messages to continue.';
        allowPruneHistory = true;
        break;

      case ERROR_TYPES.CONTENT_FILTER:
        title = 'Safety & Content Policy Filter';
        badge = 'POLICY FILTER';
        badgeBg = 'rgba(234, 179, 8, 0.25)';
        badgeColor = '#fef08a';
        desc = 'The requested prompt or response triggered upstream content safety filters.';
        resolution = 'Please edit your prompt to adjust phrasing or remove sensitive terms.';
        allowEditPrompt = true;
        break;

      case ERROR_TYPES.SERVICE_UNAVAILABLE:
        title = 'Model Host Temporarily Overloaded';
        badge = 'HOST OVERLOADED';
        badgeBg = 'rgba(249, 115, 22, 0.25)';
        badgeColor = '#fdba74';
        desc = 'The selected upstream AI cluster is temporarily congested.';
        resolution = 'Click retry or switch to Atlas Default Engine to auto-balance across available clusters.';
        break;

      case ERROR_TYPES.AUTH_REQUIRED:
        title = 'Authorization Required (401/403)';
        badge = 'UNAUTHORIZED';
        badgeBg = 'rgba(239, 68, 68, 0.25)';
        badgeColor = '#fca5a5';
        desc = 'Server authentication credentials missing or unauthorized.';
        resolution = 'Verify that the Atlas API credentials are configured properly on your host environment.';
        break;

      default:
        title = 'Studio Execution Exception';
        badge = 'DIAGNOSTIC';
        desc = errorMsg;
        resolution = 'Click Retry Prompt or switch models if the issue persists.';
        break;
    }

    const card = document.createElement('div');
    card.className = 'error-diagnostic-card';

    card.innerHTML = `
      <div class="error-card-header">
        <div class="error-card-title">
          <span style="color: #ef4444; display: flex; align-items: center;">${ICONS.alert}</span>
          <span>${escapeHtml(title)}</span>
        </div>
        <span class="error-card-badge" style="background: ${badgeBg}; color: ${badgeColor};">
          ${badge}
        </span>
      </div>

      <p class="error-card-desc">${escapeHtml(desc)}</p>

      <div class="error-card-resolution" style="border-left-color: ${badgeColor};">
        <strong>Actionable Resolution:</strong> ${escapeHtml(resolution)}
      </div>

      <div class="error-card-actions">
        ${showCountdown ? `
          <button type="button" class="error-action-btn primary retry-countdown-btn" disabled>
            <span>⏳ Wait (${countdownSeconds}s)</span>
          </button>
        ` : `
          <button type="button" class="error-action-btn primary retry-btn">
            ${ICONS.retry}
            <span>Retry Prompt</span>
          </button>
        `}

        ${allowPruneHistory ? `
          <button type="button" class="error-action-btn secondary prune-retry-btn">
            <span>✂️ Prune Oldest & Retry</span>
          </button>
          <button type="button" class="error-action-btn secondary new-session-btn">
            <span>🌱 New Session</span>
          </button>
        ` : ''}

        ${allowEditPrompt ? `
          <button type="button" class="error-action-btn secondary edit-prompt-btn">
            <span>✏️ Edit Prompt</span>
          </button>
        ` : ''}

        ${!allowPruneHistory && !allowEditPrompt ? `
          <button type="button" class="error-action-btn secondary switch-router-btn">
            ${ICONS.freeRouter}
            <span>Switch to Atlas Default</span>
          </button>
        ` : ''}

        <button type="button" class="error-action-btn outline copy-diag-btn" title="Copy trace for debugging">
          ${ICONS.copy}
          <span>Copy Trace</span>
        </button>
      </div>
    `;

    // Hook countdown if active
    if (showCountdown) {
      const countdownBtn = card.querySelector('.retry-countdown-btn');
      let remaining = countdownSeconds;
      const interval = setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          if (countdownBtn) countdownBtn.innerHTML = `<span>⏳ Wait (${remaining}s)</span>`;
        } else {
          clearInterval(interval);
          if (countdownBtn) {
            countdownBtn.disabled = false;
            countdownBtn.innerHTML = `${ICONS.retry} <span>⚡ Retry Now</span>`;
          }
        }
      }, 1000);

      countdownBtn?.addEventListener('click', () => {
        if (failedPrompt) {
          messageInput.value = failedPrompt;
          chatForm.dispatchEvent(new Event('submit'));
        }
      });
    }

    // Hook standard Retry button
    card.querySelector('.retry-btn')?.addEventListener('click', () => {
      if (failedPrompt) {
        messageInput.value = failedPrompt;
        chatForm.dispatchEvent(new Event('submit'));
      }
    });

    // Hook Switch to Atlas Default
    card.querySelector('.switch-router-btn')?.addEventListener('click', () => {
      selectModel('openrouter/free');
      if (failedPrompt) {
        messageInput.value = failedPrompt;
        chatForm.dispatchEvent(new Event('submit'));
      }
    });

    // Hook Prune Oldest & Retry
    card.querySelector('.prune-retry-btn')?.addEventListener('click', () => {
      const session = getActiveSession();
      if (session && session.messages.length > 2) {
        session.messages = session.messages.slice(-2);
        saveSessions();
      }
      if (failedPrompt) {
        messageInput.value = failedPrompt;
        chatForm.dispatchEvent(new Event('submit'));
      }
    });

    // Hook New Session
    card.querySelector('.new-session-btn')?.addEventListener('click', () => {
      startNewSession();
      if (failedPrompt) {
        messageInput.value = failedPrompt;
        autoResizeTextarea();
        messageInput.focus();
      }
    });

    // Hook Edit Prompt
    card.querySelector('.edit-prompt-btn')?.addEventListener('click', () => {
      if (failedPrompt) {
        messageInput.value = failedPrompt;
        autoResizeTextarea();
        messageInput.focus();
      }
    });

    // Hook Copy diagnostic log
    card.querySelector('.copy-diag-btn')?.addEventListener('click', (e) => {
      const logData = `[Atlas Diagnostic Report — Vylex Technologies]\nTimestamp: ${new Date().toISOString()}\nEngine: Atlas\nError Type: ${errorType}\nTitle: ${title}\nBadge: ${badge}\nError Message: ${errorMsg}\nEndpoint: ${API_BASE}/api/chat`;
      navigator.clipboard.writeText(logData).then(() => {
        const btn = e.currentTarget;
        btn.innerHTML = `${ICONS.check} <span style="color:#10b981;">Copied</span>`;
        setTimeout(() => {
          btn.innerHTML = `${ICONS.copy} <span>Copy Trace</span>`;
        }, 2000);
      });
    });

    return card;
  }

  function appendStreamCutoffBar(bubble, accumulatedContent, userText) {
    const bar = document.createElement('div');
    bar.className = 'stream-cutoff-bar';
    bar.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px; font-weight: 600;">
        <span style="color: #f59e0b; display: flex;">${ICONS.alert}</span>
        <span>Generation interrupted mid-stream.</span>
      </div>
      <div class="stream-cutoff-actions">
        <button type="button" class="error-action-btn primary continue-gen-btn">
          <span>⏯️ Continue</span>
        </button>
        <button type="button" class="error-action-btn secondary regen-full-btn">
          ${ICONS.retry}
          <span>Regenerate</span>
        </button>
      </div>
    `;

    bar.querySelector('.continue-gen-btn')?.addEventListener('click', () => {
      bar.remove();
      const lastContext = accumulatedContent.slice(-100).trim();
      const continuePrompt = `Continue generating your response exactly from where it was cut off: "${lastContext}"`;
      messageInput.value = continuePrompt;
      chatForm.dispatchEvent(new Event('submit'));
    });

    bar.querySelector('.regen-full-btn')?.addEventListener('click', () => {
      bar.remove();
      if (userText) {
        messageInput.value = userText;
        chatForm.dispatchEvent(new Event('submit'));
      }
    });

    bubble.appendChild(bar);
  }

  // --- ACTION CARDS & EXECUTION LAYER ---
  function renderActionCard({ title, description, status = 'automatic', steps = [], code = '', actionLabel = 'View Output', onAction = null }) {
    const card = document.createElement('div');
    card.className = 'atlas-action-card';

    const statusLabels = { automatic: 'Executed Automatically', approval: 'Approval Required', never: 'Action Blocked' };

    card.innerHTML = `
      <div class="action-card-header">
        <div class="action-card-title-group">
          <div class="action-card-icon">${ICONS.code}</div>
          <h4 class="action-card-title">${escapeHtml(title)}</h4>
        </div>
        <div class="action-status-pill ${status}">
          <span class="action-status-dot"></span>
          <span>${statusLabels[status] || status}</span>
        </div>
      </div>
      <div class="action-card-body">
        <div class="action-card-desc">${escapeHtml(description)}</div>
        ${steps && steps.length > 0 ? `
          <div class="action-steps-checklist">
            ${steps.map(s => `
              <div class="action-step-row ${s.status || 'done'}">
                <span>${s.status === 'running' ? '⏳' : s.status === 'pending' ? '○' : '✓'}</span>
                <span>${escapeHtml(s.text)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${code ? `<pre class="action-code-preview"><code>${escapeHtml(code)}</code></pre>` : ''}
      </div>
      <div class="action-card-footer">
        ${status === 'approval' ? `
          <button type="button" class="action-card-btn secondary cancel-action-btn">Cancel</button>
        ` : ''}
        <button type="button" class="action-card-btn ${status === 'automatic' ? 'primary' : status === 'approval' ? 'success' : 'secondary'} execute-action-btn">
          ${escapeHtml(actionLabel)}
        </button>
      </div>
    `;

    if (onAction) {
      card.querySelector('.execute-action-btn')?.addEventListener('click', onAction);
    }

    return card;
  }

  // --- MESSAGE RENDERING ---
  function renderMessageItem(role, content = '', reasoning = '', shouldScroll = true) {
    if (welcomeScreen && welcomeScreen.parentNode) {
      welcomeScreen.style.display = 'none';
    }

    const row = document.createElement('div');
    row.className = `message-row ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = role === 'user' ? 'U' : 'AI';

    const wrapper = document.createElement('div');
    wrapper.className = 'message-content-wrapper';

    // Active Thought Status Banner (animated verbs)
    let thoughtBanner = null;
    let thoughtWord = null;
    let stopThoughtAnim = null;

    if (role === 'assistant' && !content && !reasoning) {
      thoughtBanner = document.createElement('div');
      thoughtBanner.className = 'active-thought-banner';
      thoughtBanner.innerHTML = `
        <span class="active-thought-spark">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
        </span>
        <span class="active-thought-word">Formulating Hypothesis Space...</span>
      `;
      thoughtWord = thoughtBanner.querySelector('.active-thought-word');
      stopThoughtAnim = startVerbAnimation(thoughtWord, THOUGHT_VERBS, '', '...');
      wrapper.appendChild(thoughtBanner);
    }

    // Reasoning accordion
    let reasoningAccordion = null;
    let reasoningBody = null;
    let reasoningToggleBtn = null;

    if (role === 'assistant') {
      reasoningAccordion = document.createElement('div');
      reasoningAccordion.className = 'reasoning-accordion';
      reasoningAccordion.style.display = reasoning ? 'block' : 'none';
      reasoningAccordion.innerHTML = `
        <button class="reasoning-toggle-btn" type="button">
          <span class="reasoning-left-label">
            <span class="reasoning-icon">${ICONS.reasoning}</span>
            <span class="reasoning-label-text">Reasoning Process</span>
          </span>
          <span class="reasoning-toggle-arrow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </span>
        </button>
        <div class="reasoning-content" style="display: none;">${escapeHtml(reasoning)}</div>
      `;

      reasoningToggleBtn = reasoningAccordion.querySelector('.reasoning-toggle-btn');
      reasoningBody = reasoningAccordion.querySelector('.reasoning-content');
      reasoningToggleBtn.addEventListener('click', () => {
        const isOpen = reasoningBody.style.display === 'block';
        reasoningBody.style.display = isOpen ? 'none' : 'block';
        reasoningToggleBtn.querySelector('.reasoning-toggle-arrow svg').style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
      });

      wrapper.appendChild(reasoningAccordion);
    }

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (role === 'user') {
      bubble.textContent = content;
    } else {
      bubble.innerHTML = parseMarkdownSafely(content);
      enhanceCodeBlocks(bubble);
    }
    wrapper.appendChild(bubble);

    // Message meta & actions
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    meta.innerHTML = `
      <span>${role === 'user' ? 'You' : 'Atlas'} • ${time}</span>
      <div class="message-actions-bar">
        <button class="msg-action-btn copy-msg-btn" title="Copy text">
          ${ICONS.copy}
          <span>Copy</span>
        </button>
        ${role === 'assistant' ? `
          <button class="msg-action-btn challenge-msg-btn" title="Challenge this reasoning & hypotheses">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="12 8 8 12 12 16 12 13 16 13 16 11 12 11 12 8"></polygon></svg>
            <span>Challenge</span>
          </button>
          <button class="msg-action-btn speak-msg-btn" title="Read aloud">
            ${ICONS.speaker}
            <span>Speak</span>
          </button>
        ` : ''}
      </div>
    `;

    meta.querySelector('.copy-msg-btn')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      navigator.clipboard.writeText(content).then(() => {
        btn.innerHTML = `${ICONS.check} <span style="color: #10b981;">Copied</span>`;
        setTimeout(() => {
          btn.innerHTML = `${ICONS.copy} <span>Copy</span>`;
        }, 2000);
      });
    });

    meta.querySelector('.challenge-msg-btn')?.addEventListener('click', () => {
      const challengePrompt = `Challenge this analysis: Expose hidden assumptions, identify contradicting evidence or edge cases, state alternative hypotheses, and propose an experiment or verification method to test it.`;
      messageInput.value = challengePrompt;
      autoResizeTextarea();
      messageInput.focus();
      chatForm.dispatchEvent(new Event('submit'));
    });

    meta.querySelector('.speak-msg-btn')?.addEventListener('click', () => {
      toggleSpeech(content);
    });

    wrapper.appendChild(meta);
    row.appendChild(avatar);
    row.appendChild(wrapper);
    messagesContainer.appendChild(row);

    if (shouldScroll) scrollToBottom(true);

    return {
      row,
      bubble,
      reasoningAccordion,
      reasoningBody,
      thoughtBanner,
      stopThoughtAnim,
      reasoningToggleBtn
    };
  }


  function unescapeStringContent(str) {
    if (!str) return '';
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  function cleanAndTransformToolCalls(raw) {
    if (!raw) return '';
    let text = raw;

    // 1. Convert completed tool calls: <|tool_call_start|>[write(filepath='...', content='...')]<|tool_call_end|>
    text = text.replace(/<\|tool_call_start\|>\s*\[?write\(\s*filepath=['"]([^'"]+)['"]\s*,\s*content=(['"])([\s\S]*?)\2\s*\)?\]?\s*<\|tool_call_end\|>/gi, (match, filepath, quote, content) => {
      const ext = filepath.split('.').pop() || 'text';
      return `\n\n**File:** \`${filepath}\`\n\`\`\`${ext}\n${unescapeStringContent(content)}\n\`\`\`\n\n`;
    });

    // 2. Convert raw [write(filepath='...', content='...')]
    text = text.replace(/\[write\(\s*filepath=['"]([^'"]+)['"]\s*,\s*content=(['"])([\s\S]*?)\2\s*\)\]/gi, (match, filepath, quote, content) => {
      const ext = filepath.split('.').pop() || 'text';
      return `\n\n**File:** \`${filepath}\`\n\`\`\`${ext}\n${unescapeStringContent(content)}\n\`\`\`\n\n`;
    });

    // 3. Convert in-progress streaming write calls: <|tool_call_start|>[write(filepath='...', content='...
    text = text.replace(/<\|tool_call_start\|>\s*\[?write\(\s*filepath=['"]([^'"]+)['"]\s*,\s*content=['"]?([\s\S]*)/gi, (match, filepath, content) => {
      let cleanContent = content.replace(/['"]\s*\)?\]?\s*(<\|tool_call_end\|>)?\s*$/i, '');
      const ext = filepath.split('.').pop() || 'text';
      return `\n\n**File:** \`${filepath}\`\n\`\`\`${ext}\n${unescapeStringContent(cleanContent)}\n\`\`\`\n\n`;
    });

    // 4. Handle other tool calls like [execute(command='...')]
    text = text.replace(/<\|tool_call_start\|>\s*\[?(\w+)\(([\s\S]*?)\)\]?\s*<\|tool_call_end\|>/gi, (match, toolName, args) => {
      return `\n\n*Tool: \`${toolName}\`*\n\`\`\`bash\n${unescapeStringContent(args)}\n\`\`\`\n\n`;
    });

    // 5. Clean stray special tokens, delimiters, and trailing fragments
    text = text
      .replace(/<\|tool_call_start\|>/gi, '')
      .replace(/<\|tool_call_end\|>/gi, '')
      .replace(/<\|im_start\|>/gi, '')
      .replace(/<\|im_end\|>/gi, '')
      .replace(/<\|endoftext\|>/gi, '')
      .replace(/<\|plugin\|>/gi, '')
      .replace(/<\|startoftext\|>/gi, '')
      .replace(/<tool_call>/gi, '')
      .replace(/<\/tool_call>/gi, '')
      .replace(/\s*'\)\]<\|tool_call_end\|>/gi, '')
      .replace(/\s*"\)\]<\|tool_call_end\|>/gi, '')
      .replace(/['"]\s*\)\s*\]\s*$/g, '');

    return text;
  }

  // --- AGENT TOOL EXECUTION ENGINE ---
  const executedToolCalls = new Set();

  function updateAgentUI(type, message, status = 'success') {
    const terminalOutput = document.getElementById('terminalOutput');
    const agentTaskList = document.getElementById('agentTaskList');
    const artifactsCanvasPanel = document.getElementById('artifactsCanvasPanel');
    const toggleCanvasBtn = document.getElementById('toggleCanvasBtn');

    if (!terminalOutput || !agentTaskList) return;

    // Auto-open canvas to Agent Activity tab
    artifactsCanvasPanel.classList.add('open');
    toggleCanvasBtn.classList.add('active');
    switchCanvasTab('agent');

    // Remove placeholder task if it exists
    const placeholder = agentTaskList.querySelector('.placeholder');
    if (placeholder) placeholder.remove();

    if (type === 'task') {
      const li = document.createElement('li');
      li.className = `task-item running`;
      li.innerHTML = `
        <span class="status-icon">${ICONS.canvas}</span>
        <span>${escapeHtml(message)}</span>
      `;
      agentTaskList.appendChild(li);
    } else if (type === 'terminal') {
      const line = document.createElement('div');
      line.className = `terminal-line ${status}`;
      line.textContent = message;
      terminalOutput.appendChild(line);
      terminalOutput.scrollTop = terminalOutput.scrollHeight;

      // Update the last running task to completed/error
      const lastTask = agentTaskList.lastElementChild;
      if (lastTask && lastTask.classList.contains('running')) {
        lastTask.classList.remove('running');
        lastTask.classList.add(status === 'error' ? 'pending' : 'completed');
        const iconSpan = lastTask.querySelector('.status-icon');
        if (iconSpan) {
          iconSpan.innerHTML = status === 'error' ? ICONS.alert : ICONS.check;
        }
      }
    }
  }

  async function executeAgentTools(content) {
    if (!content) return;

    const regex = /<\|tool_call_start\|>\s*\[?(\w+)\(([\s\S]*?)\)\]?\s*<\|tool_call_end\|>/gi;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const fullMatch = match[0];
      const toolName = match[1];
      const argsStr = match[2];

      if (executedToolCalls.has(fullMatch)) continue;
      executedToolCalls.add(fullMatch);

      // Try to parse arguments
      const args = {};
      try {
        const filepathMatch = argsStr.match(/filepath=['"]([^'"]+)['"]/);
        if (filepathMatch) args.filepath = filepathMatch[1];

        const contentMatch = argsStr.match(/content=(['"])([\s\S]*?)\1/);
        if (contentMatch) args.content = unescapeStringContent(contentMatch[2]);

        const commandMatch = argsStr.match(/command=['"]([^'"]+)['"]/);
        if (commandMatch) args.command = unescapeStringContent(commandMatch[1]);
      } catch (e) {
        console.warn('Failed to parse tool arguments:', e);
      }

      let endpointToolName = toolName;
      if (toolName === 'write') endpointToolName = 'write_file';
      if (toolName === 'execute') endpointToolName = 'execute_command';
      if (toolName === 'read') endpointToolName = 'read_file';

      updateAgentUI('task', `Executing ${toolName}...`);
      updateAgentUI('terminal', `> ${toolName} ${JSON.stringify(args).slice(0, 100)}...`, 'command');

      try {
        const res = await fetch(`${API_BASE}/api/tool/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: endpointToolName, args })
        });

        const data = await res.json();
        if (data.status === 'success') {
          updateAgentUI('terminal', JSON.stringify(data.data), 'output');
        } else {
          updateAgentUI('terminal', data.error || 'Execution failed', 'error');
        }
      } catch (err) {
        updateAgentUI('terminal', `Error: ${err.message}`, 'error');
      }
    }
  }

  function extractTextFromDelta(val) {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) {
      return val.map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return item.text || item.content || item.value || (item.url ? `[${item.title || item.name || 'Source'}](${item.url})` : '');
        }
        return '';
      }).join('');
    }
    if (typeof val === 'object') {
      return val.text || val.content || val.value || (val.url ? `[${val.title || val.name || 'Source'}](${val.url})` : '');
    }
    return String(val);
  }

  function repairIncompleteMarkdown(raw) {
    if (!raw) return '';
    const rawString = extractTextFromDelta(raw);
    let text = cleanAndTransformToolCalls(rawString);

    // Virtual closure for unclosed code blocks during streaming
    const codeBlockCount = (text.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      text += '\n```\n';
    }

    // Virtual closure for unclosed inline code backtick
    const withoutCodeBlocks = text.replace(/```[\s\S]*?```/g, '');
    const inlineBacktickCount = (withoutCodeBlocks.match(/`/g) || []).length;
    if (inlineBacktickCount % 2 !== 0) {
      text += '`';
    }

    return text;
  }

  function parseMarkdownSafely(raw, isStreaming = false) {
    if (!raw) return isStreaming ? '<span class="streaming-caret" aria-hidden="true"></span>' : '<span class="pulse-dot"></span>';
    const repaired = repairIncompleteMarkdown(raw);
    let html = window.marked ? marked.parse(repaired) : repaired;
    if (window.DOMPurify) {
      html = DOMPurify.sanitize(html, {
        ADD_TAGS: ['kbd', 'mark', 'details', 'summary', 'input', 'svg', 'circle', 'line', 'path', 'polyline', 'polygon', 'rect'],
        ADD_ATTR: ['target', 'disabled', 'checked', 'type', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'd', 'points', 'width', 'height', 'aria-hidden']
      });
    }
    if (isStreaming) {
      html += '<span class="streaming-caret" aria-hidden="true"></span>';
    }
    return html;
  }

  // --- CODE BLOCKS & ARTIFACTS CANVAS ---
  function enhanceCodeBlocks(container) {
    container.querySelectorAll('pre').forEach(pre => {
      if (pre.querySelector('.code-header-bar')) return;

      const code = pre.querySelector('code');
      const langClass = code ? code.className : '';
      const match = langClass.match(/language-(\w+)/);
      const language = match ? match[1] : 'code';
      const codeText = code ? code.innerText : pre.innerText;

      const header = document.createElement('div');
      header.className = 'code-header-bar';
      header.innerHTML = `
        <span style="font-weight: 600;">${language.toUpperCase()}</span>
        <div class="code-header-actions">
          <button class="code-action-btn canvas-open-btn" type="button" title="Open in Artifacts Canvas">
            ${ICONS.canvas}
            <span>Canvas</span>
          </button>
          <button class="code-action-btn copy-code-btn" type="button" title="Copy Code">
            ${ICONS.copy}
            <span>Copy</span>
          </button>
        </div>
      `;

      const copyBtn = header.querySelector('.copy-code-btn');
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeText).then(() => {
          copyBtn.innerHTML = `${ICONS.check} <span>Copied</span>`;
          setTimeout(() => {
            copyBtn.innerHTML = `${ICONS.copy} <span>Copy</span>`;
          }, 2000);
        });
      });

      const canvasBtn = header.querySelector('.canvas-open-btn');
      canvasBtn.addEventListener('click', () => {
        openInArtifactsCanvas(language, codeText);
      });

      pre.insertBefore(header, pre.firstChild);
    });
  }

  function openInArtifactsCanvas(language, codeText) {
    state.activeArtifact = { language, codeText };
    artifactsCanvasPanel.classList.add('open');
    toggleCanvasBtn.classList.add('active');

    if (canvasDocumentTitle) canvasDocumentTitle.textContent = `${language.toUpperCase()} Artifact`;
    if (canvasTypeTag) canvasTypeTag.textContent = `${codeText.split('\n').length} lines`;
    if (canvasLanguageBadge) canvasLanguageBadge.textContent = language.toUpperCase();
    if (canvasLineCount) canvasLineCount.textContent = `${codeText.split('\n').length} lines • ${new Blob([codeText]).size} bytes`;

    if (canvasCodeContent) {
      if (window.hljs && hljs.getLanguage(language)) {
        canvasCodeContent.innerHTML = hljs.highlight(codeText, { language }).value;
      } else {
        canvasCodeContent.textContent = codeText;
      }
    }

    if (canvasMarkdownContent) {
      canvasMarkdownContent.innerHTML = parseMarkdownSafely(codeText);
    }

    if (canvasPreviewFrame) {
      if (language === 'html' || language === 'svg' || language === 'xml') {
        canvasPreviewFrame.srcdoc = codeText;
      } else {
        canvasPreviewFrame.srcdoc = `
          <!DOCTYPE html><html><head><style>body{font-family:sans-serif;background:#0d1117;color:#c9d1d9;padding:20px;}</style></head><body><h3>Artifact Preview</h3><pre><code>${escapeHtml(codeText)}</code></pre></body></html>
        `;
      }
    }

    if (language === 'html' || language === 'svg') {
      switchCanvasTab('preview');
    } else {
      switchCanvasTab('code');
    }
  }

  function switchCanvasTab(tabName) {
    canvasTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabName));
    if (canvasCodePane) canvasCodePane.classList.toggle('active', tabName === 'code');
    if (canvasPreviewPane) canvasPreviewPane.classList.toggle('active', tabName === 'preview');
    if (canvasMarkdownPane) canvasMarkdownPane.classList.toggle('active', tabName === 'markdown');
  }

  // --- SPEECH ENGINE ---
  function toggleSpeech(text) {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech not supported in this browser.');
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const cleanText = text.replace(/[#*`_~[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  // --- STREAMING CHAT SUBMISSION ---
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userText = messageInput.value.trim();
    if (!userText || state.isGenerating) return;

    const session = getActiveSession();
    if (!session) return;

    state.lastUserPrompt = userText;

    if (session.messages.length === 0) {
      session.title = userText.slice(0, 36) + (userText.length > 36 ? '...' : '');
      saveSessions();
      renderHistoryTree();
    }

    messageInput.value = '';
    autoResizeTextarea();

    session.messages.push({ role: 'user', content: userText });
    saveSessions();
    renderMessageItem('user', userText);
    updateMetrics();

    const {
      bubble,
      reasoningAccordion,
      reasoningBody,
      thoughtBanner,
      stopThoughtAnim
    } = renderMessageItem('assistant', '');

    state.isGenerating = true;
    sendBtn.disabled = true;
    if (stopGenerationBtn) stopGenerationBtn.style.display = 'flex';
    if (sendBtn) sendBtn.style.display = 'none';

    // Show 'Thinking...' or 'Searching web...' indicator in floating toolbar
    if (streamingIndicator) {
      streamingIndicator.style.display = 'flex';
      const textElem = streamingIndicator.querySelector('.indicator-text');
      if (textElem) {
        textElem.textContent = state.isWebSearch ? 'Searching web & reasoning...' : 'Thinking...';
      }
    }

    const payloadMessages = [];
    if (state.systemPrompt && state.systemPrompt.trim()) {
      payloadMessages.push({ role: 'system', content: state.systemPrompt.trim() });
    }
    session.messages.forEach(m => payloadMessages.push({ role: m.role, content: m.content }));

    let accumulatedContent = '';
    let accumulatedReasoning = '';
    let inThinkTag = false;
    let hasReceivedFirstContent = false;
    let lastRenderTime = 0;

    state.abortController = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: state.abortController.signal,
        body: JSON.stringify({
          model: state.currentModel,
          messages: payloadMessages,
          stream: true,
          mode: state.activeMode,
          systemPrompt: state.systemPrompt,
          temperature: state.temperature,
          webSearch: state.isWebSearch
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status} (${response.statusText})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
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
            
            // Handle tool execution start event -> render Action Card
            if (parsed.__tool_start__) {
              const toolInfo = parsed.__tool_start__;
              const toolNamePretty = (toolInfo.name || 'tool').replace(/_/g, ' ').toUpperCase();
              const actionCard = renderActionCard({
                title: `Execute: ${toolNamePretty}`,
                description: `Executing real-time tool with parameters: ${JSON.stringify(toolInfo.args || {})}`,
                status: 'automatic',
                steps: [
                  { text: 'Validated input parameters', status: 'done' },
                  { text: `Executing ${toolInfo.name}`, status: 'running' }
                ],
                actionLabel: 'Executing...'
              });
              bubble.appendChild(actionCard);
              scrollToBottom(false);
              continue;
            }

            // Handle tool execution completion event
            if (parsed.__tool_done__) {
              const lastActionCard = bubble.querySelector('.atlas-action-card:last-child');
              if (lastActionCard) {
                const stepRow = lastActionCard.querySelector('.action-step-row.running');
                if (stepRow) {
                  stepRow.classList.remove('running');
                  stepRow.classList.add('done');
                  stepRow.innerHTML = `<span>✓</span><span>Execution completed successfully</span>`;
                }
                const actionBtn = lastActionCard.querySelector('.execute-action-btn');
                if (actionBtn) {
                  actionBtn.textContent = 'Completed';
                  actionBtn.disabled = true;
                }
              }
              continue;
            }

            // Handle injected widget rendering
            if (parsed.__widget__) {
                if (window.atlasRenderWidget) {
                    const widgetHtml = window.atlasRenderWidget(parsed.__widget__.type, parsed.__widget__.data);
                    if (widgetHtml) {
                        accumulatedContent += `\n\n${widgetHtml}\n\n`;
                        bubble.innerHTML = parseMarkdownSafely(accumulatedContent, true);
                        scrollToBottom(false);
                    }
                }
                continue;
            }
            
            if (parsed.error) {
                 throw new Error(parsed.error);
            }

            const choice = parsed.choices?.[0];
            const rawContent = choice?.delta?.content ?? choice?.delta?.text ?? choice?.text ?? '';
            const rawReasoning = choice?.delta?.reasoning ?? choice?.delta?.reasoning_content ?? choice?.delta?.thought ?? '';

            const delta = extractTextFromDelta(rawContent);
            const reasoningDelta = extractTextFromDelta(rawReasoning);

            if (reasoningDelta) {
              accumulatedReasoning += reasoningDelta;
              if (reasoningAccordion) reasoningAccordion.style.display = 'block';
              if (reasoningBody) reasoningBody.textContent = accumulatedReasoning;
            }

            if (delta.includes('<think>')) {
              inThinkTag = true;
              if (reasoningAccordion) reasoningAccordion.style.display = 'block';
            }

            if (inThinkTag) {
              if (delta.includes('</think>')) {
                inThinkTag = false;
                const parts = delta.split('</think>');
                accumulatedReasoning += parts[0].replace('<think>', '');
                accumulatedContent += parts[1] || '';
              } else {
                accumulatedReasoning += delta.replace('<think>', '');
              }

              if (reasoningBody) {
                reasoningBody.textContent = accumulatedReasoning;
              }
            } else if (delta) {
              accumulatedContent += delta;

              // Hide thought banner once real text starts streaming
              if (!hasReceivedFirstContent && accumulatedContent.trim().length > 0) {
                hasReceivedFirstContent = true;
                if (stopThoughtAnim) stopThoughtAnim();
                if (thoughtBanner) thoughtBanner.style.display = 'none';
              }

              const now = Date.now();
              if (now - lastRenderTime > 45) {
                lastRenderTime = now;
                requestAnimationFrame(() => {
                  bubble.innerHTML = parseMarkdownSafely(accumulatedContent, true);
                  enhanceCodeBlocks(bubble);
                  scrollToBottom(false);
                });
              }

              // Incrementally execute fully formed tools
              await executeAgentTools(accumulatedContent);
            }

            scrollToBottom(false);
          } catch (jsonErr) {
            // Chunk fragment
          }
        }
      }

      if (!accumulatedContent) {
        accumulatedContent = accumulatedReasoning || '(Empty response received)';
      }

      // Final complete render without streaming caret
      bubble.innerHTML = parseMarkdownSafely(accumulatedContent, false);

      if (stopThoughtAnim) stopThoughtAnim();
      if (thoughtBanner) thoughtBanner.style.display = 'none';

      accumulatedContent = cleanAndTransformToolCalls(accumulatedContent);
      session.messages.push({
        role: 'assistant',
        content: accumulatedContent,
        reasoning: accumulatedReasoning
      });
      saveSessions();
      enhanceCodeBlocks(bubble);
      updateMetrics();

      // Trigger automatic AI chat naming like Claude/ChatGPT/Gemini
      if (!session.hasAiTitle && session.messages.length === 2) {
        triggerAiTitleGeneration(session, userText);
      }
    } catch (err) {
      if (stopThoughtAnim) stopThoughtAnim();
      if (thoughtBanner) thoughtBanner.style.display = 'none';

      if (err.name === 'AbortError') {
        bubble.innerHTML = parseMarkdownSafely(accumulatedContent, false);
        bubble.innerHTML += `<div style="margin-top: 6px; font-size: 0.78rem; color: var(--text-subtle); font-style: italic;">[Generation halted by user]</div>`;
        enhanceCodeBlocks(bubble);
      } else if (accumulatedContent.trim().length > 0) {
        // Scenario 5: Stream interrupted mid-generation - preserve partial text & add continuation actions
        console.warn('Stream interrupted mid-generation:', err);
        bubble.innerHTML = parseMarkdownSafely(accumulatedContent, false);
        enhanceCodeBlocks(bubble);
        appendStreamCutoffBar(bubble, accumulatedContent, userText);

        session.messages.push({
          role: 'assistant',
          content: accumulatedContent,
          reasoning: accumulatedReasoning
        });
        saveSessions();
      } else {
        console.error('Generation Error:', err);
        // Inject production-grade diagnostic error card
        bubble.innerHTML = '';
        bubble.appendChild(buildDiagnosticErrorCard(err, userText, { hasPartialContent: false }));
      }
    } finally {
      state.isGenerating = false;
      sendBtn.disabled = false;
      if (stopGenerationBtn) stopGenerationBtn.style.display = 'none';
      if (sendBtn) sendBtn.style.display = 'flex';
      if (streamingIndicator) streamingIndicator.style.display = 'none';
      messageInput.focus();
      scrollToBottom(false);
    }
  });

  // Stop Generation
  stopGenerationBtn?.addEventListener('click', () => {
    if (state.abortController) {
      state.abortController.abort();
    }
  });

  // --- EVENT LISTENERS & NETWORK LIFECYCLE ---
  function setupEventListeners() {
    const offlineBanner = document.getElementById('offlineBanner');

    // Online / Offline Network Lifecycle Listeners
    window.addEventListener('online', () => {
      if (offlineBanner) offlineBanner.style.display = 'none';
      if (!state.isGenerating && sendBtn) sendBtn.disabled = false;
      checkBackendHealth();
    });

    window.addEventListener('offline', () => {
      if (offlineBanner) offlineBanner.style.display = 'flex';
      if (sendBtn) sendBtn.disabled = true;
    });

    sidebarCollapseBtn?.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeMobileSidebar();
      } else {
        sidebar.classList.add('collapsed');
      }
    });

    sidebarToggleBtn?.addEventListener('click', () => {
      toggleSidebar();
    });

    sidebarBackdrop?.addEventListener('click', () => {
      closeMobileSidebar();
    });

    newChatBtn?.addEventListener('click', () => {
      startNewSession();
      closeMobileSidebar();
    });

    historySearchInput?.addEventListener('input', (e) => {
      renderHistoryTree(e.target.value.trim());
    });

    modelPillTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      modelDropdownCapsule?.classList.toggle('open');
    });

    themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        applyTheme(btn.getAttribute('data-theme-val'));
      });
    });

    toggleCanvasBtn?.addEventListener('click', () => {
      artifactsCanvasPanel.classList.toggle('open');
      toggleCanvasBtn.classList.toggle('active', artifactsCanvasPanel.classList.contains('open'));
    });

    closeCanvasBtn?.addEventListener('click', () => {
      artifactsCanvasPanel.classList.remove('open');
      toggleCanvasBtn.classList.remove('active');
    });

    canvasTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        switchCanvasTab(tab.getAttribute('data-tab'));
      });
    });

    copyCanvasContentBtn?.addEventListener('click', () => {
      if (state.activeArtifact?.codeText) {
        navigator.clipboard.writeText(state.activeArtifact.codeText).then(() => {
          alert('Canvas code copied');
        });
      }
    });

    downloadCanvasBtn?.addEventListener('click', () => {
      if (!state.activeArtifact?.codeText) return;
      const ext = state.activeArtifact.language === 'javascript' ? 'js' : state.activeArtifact.language === 'python' ? 'py' : state.activeArtifact.language === 'html' ? 'html' : 'txt';
      const blob = new Blob([state.activeArtifact.codeText], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `artifact_${Date.now()}.${ext}`;
      a.click();
    });

    exportMenuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      exportDropdownWrapper?.classList.toggle('open');
    });

    exportMarkdownBtn?.addEventListener('click', () => exportConversation('md'));
    exportJsonBtn?.addEventListener('click', () => exportConversation('json'));
    clearCurrentChatBtn?.addEventListener('click', () => {
      const session = getActiveSession();
      if (session && confirm('Clear all messages in active session?')) {
        session.messages = [];
        saveSessions();
        loadSession(session.id);
      }
    });

    categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const cat = tab.getAttribute('data-category');
        promptCards.forEach(card => {
          if (cat === 'all' || card.getAttribute('data-cat') === cat) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

    promptCards.forEach(card => {
      card.addEventListener('click', () => {
        const prompt = card.getAttribute('data-prompt');
        messageInput.value = prompt;
        autoResizeTextarea();
        messageInput.focus();
      });
    });

    const ocrTriggerBtn = document.getElementById('ocrTriggerBtn');
    ocrTriggerBtn?.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('atlas:open-ocr'));
    });
    
    document.addEventListener('atlas:ocr-result', (e) => {
        messageInput.value = (messageInput.value + '\n\n' + e.detail).trim();
        autoResizeTextarea();
        messageInput.focus();
    });

    deepThinkToggleBtn?.addEventListener('click', () => {
      state.isDeepReasoning = !state.isDeepReasoning;
      deepThinkToggleBtn.querySelector('.think-dot').style.backgroundColor = state.isDeepReasoning ? '#10b981' : '#64748b';
      deepThinkToggleBtn.querySelector('span:last-child').textContent = state.isDeepReasoning ? 'Reasoning: Active' : 'Reasoning: Off';
    });

    webSearchToggleBtn?.addEventListener('click', () => {
      state.isWebSearch = !state.isWebSearch;
      localStorage.setItem('omni_web_search', state.isWebSearch.toString());
      syncWebSearchUI();
    });

    attachFileMockBtn?.addEventListener('click', () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.txt,.js,.json,.html,.css,.py,.md,.csv';
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            messageInput.value += `\n\n--- File: ${file.name} ---\n${evt.target.result}\n--- End File ---\n`;
            autoResizeTextarea();
          };
          reader.readAsText(file);
        }
      };
      fileInput.click();
    });

    openSysPromptModalBtn?.addEventListener('click', () => openSettingsModal());
    systemPromptDrawerBtn?.addEventListener('click', () => openSettingsModal());
    closeModalBtn?.addEventListener('click', () => systemPromptModal.classList.remove('open'));

    presetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        presetPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const presetKey = pill.getAttribute('data-preset');
        state.activePreset = presetKey;
        customSystemPrompt.value = PERSONA_PRESETS[presetKey] || '';
      });
    });

    resetModalPromptBtn?.addEventListener('click', () => {
      customSystemPrompt.value = PERSONA_PRESETS.scientist;
    });

    temperatureSlider?.addEventListener('input', (e) => {
      if (tempValBadge) tempValBadge.textContent = e.target.value;
    });

    saveSettingsBtn?.addEventListener('click', () => {
      state.systemPrompt = customSystemPrompt.value.trim();
      state.temperature = parseFloat(temperatureSlider.value);
      localStorage.setItem('omni_sys_prompt', state.systemPrompt);
      localStorage.setItem('omni_preset', state.activePreset);
      localStorage.setItem('omni_temp', state.temperature.toString());

      if (activePromptLabel) {
        const mode = INVESTIGATION_MODES[state.activeMode] || INVESTIGATION_MODES.research;
        activePromptLabel.textContent = `Mode: ${mode.name}`;
      }

      systemPromptModal.classList.remove('open');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.model-dropdown-capsule')) {
        modelDropdownCapsule?.classList.remove('open');
      }
      if (!e.target.closest('.export-dropdown-wrapper')) {
        exportDropdownWrapper?.classList.remove('open');
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        startNewSession();
      }
      if (e.key === 'Escape') {
        systemPromptModal?.classList.remove('open');
        modelDropdownCapsule?.classList.remove('open');
        exportDropdownWrapper?.classList.remove('open');
      }
    });

    messageInput?.addEventListener('input', autoResizeTextarea);
    messageInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!state.isGenerating && messageInput.value.trim().length > 0) {
          chatForm.dispatchEvent(new Event('submit'));
        }
      }
    });
  }

  function syncWebSearchUI() {
    if (!webSearchToggleBtn) return;
    webSearchToggleBtn.classList.toggle('active-web', state.isWebSearch);
    if (webSearchLabel) {
      webSearchLabel.textContent = state.isWebSearch ? 'Web: Active' : 'Web: Off';
    }
  }

  function openSettingsModal() {
    customSystemPrompt.value = state.systemPrompt;
    temperatureSlider.value = state.temperature;
    if (tempValBadge) tempValBadge.textContent = state.temperature;
    presetPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-preset') === state.activePreset));
    systemPromptModal.classList.add('open');
  }

  function loadSavedSettings() {
    if (activePromptLabel) {
      const mode = INVESTIGATION_MODES[state.activeMode] || INVESTIGATION_MODES.research;
      activePromptLabel.textContent = `Mode: ${mode.name}`;
    }
    syncWebSearchUI();
  }

  function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 160) + 'px';
  }

  let isUserPinnedToBottom = true;
  let scrollRafId = null;

  function handleContainerScroll() {
    if (!messagesContainer) return;
    const distFromBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
    if (distFromBottom <= 80) {
      isUserPinnedToBottom = true;
      if (scrollToBottomBtn) scrollToBottomBtn.style.display = 'none';
    } else {
      isUserPinnedToBottom = false;
      if (scrollToBottomBtn) scrollToBottomBtn.style.display = 'inline-flex';
    }
  }

  messagesContainer?.addEventListener('scroll', handleContainerScroll, { passive: true });

  scrollToBottomBtn?.addEventListener('click', () => {
    isUserPinnedToBottom = true;
    if (scrollToBottomBtn) scrollToBottomBtn.style.display = 'none';
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth'
    });
  });

  function scrollToBottom(force = false) {
    if (!messagesContainer) return;
    if (force) {
      isUserPinnedToBottom = true;
      if (scrollToBottomBtn) scrollToBottomBtn.style.display = 'none';
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      return;
    }

    if (!isUserPinnedToBottom) return;

    if (scrollRafId) cancelAnimationFrame(scrollRafId);
    scrollRafId = requestAnimationFrame(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function exportConversation(format) {
    const session = getActiveSession();
    if (!session || session.messages.length === 0) {
      alert('No messages to export in active conversation.');
      return;
    }

    let fileContent = '';
    let fileName = `chat_${Date.now()}.${format}`;

    if (format === 'json') {
      fileContent = JSON.stringify(session, null, 2);
    } else {
      fileContent = `# ${session.title}\n*Exported from Atlas by Vylex Technologies (vylex.co.za) on ${new Date().toLocaleString()}*\n*Engine: Atlas*\n\n---\n\n`;
      session.messages.forEach(m => {
        fileContent += `### ${m.role === 'user' ? 'User' : 'Atlas'}\n\n`;
        if (m.reasoning) {
          fileContent += `> **Reasoning Process:**\n> ${m.reasoning.replace(/\n/g, '\n> ')}\n\n`;
        }
        fileContent += `${m.content}\n\n---\n\n`;
      });
    }

    const blob = new Blob([fileContent], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
  }

  init();
});
