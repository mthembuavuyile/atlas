/**
 * Atlas — Scientific Intelligence Platform by Vylex Technologies
 * https://vylex.co.za
 * Technical Reasoning · Multi-Model Deliberation · Action Execution Layer
 */

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = (window.location.protocol.startsWith('http'))
    ? window.location.origin
    : 'http://localhost:3000';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- 7 Investigation Modes Definitions (Zero Emojis) ---
  const INVESTIGATION_MODES = {
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

  // --- Curated Dynamic Investigation Status Terms (Mode-Aware) ---
  const INVESTIGATION_STATUS_TERMS = {
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

  // --- Clean Precision Vector SVGs (Zero Emojis) ---
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

  const FREE_MODELS = [
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

  // --- DOM Elements ---
  const sidebar = document.getElementById('sidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const newChatBtn = document.getElementById('newChatBtn');
  const historySearchInput = document.getElementById('historySearchInput');
  const historyGroupToday = document.getElementById('historyGroupToday');
  const historyGroupYesterday = document.getElementById('historyGroupYesterday');
  const historyGroupPrevious = document.getElementById('historyGroupPrevious');
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

  // Composer
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const stopGenerationBtn = document.getElementById('stopGenerationBtn');
  const streamingIndicator = document.getElementById('streamingIndicator');
  const hintModelName = document.getElementById('hintModelName');
  const openSysPromptModalBtn = document.getElementById('openSysPromptModalBtn');
  const activePromptLabel = document.getElementById('activePromptLabel');
  const deepThinkToggleBtn = document.getElementById('deepThinkToggleBtn');
  const webSearchToggleBtn = document.getElementById('webSearchToggleBtn');
  const composerAttachBtn = document.getElementById('composerAttachBtn');
  const composerAttachMenu = document.getElementById('composerAttachMenu');
  const attachOptionFile = document.getElementById('attachOptionFile');
  const attachOptionQR = document.getElementById('attachOptionQR');
  const attachOptionOCR = document.getElementById('attachOptionOCR');
  const projectContextBar = document.getElementById('projectContextBar');
  const projectContextLabel = document.getElementById('projectContextLabel');
  const clearProjectContextBtn = document.getElementById('clearProjectContextBtn');

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
  const unifiedSettingsModal = document.getElementById('unifiedSettingsModal');
  const settingsSidebarBtn = document.getElementById('settingsSidebarBtn');
  const closeUnifiedSettingsBtn = document.getElementById('closeUnifiedSettingsBtn');
  const settingsNavBtns = document.querySelectorAll('.settings-nav-btn');
  const settingsPanes = document.querySelectorAll('.settings-pane');
  const activeSettingsTitle = document.getElementById('activeSettingsTitle');
  const activeSettingsDesc = document.getElementById('activeSettingsDesc');
  const customSystemPrompt = document.getElementById('customSystemPrompt');
  const resetModalPromptBtn = document.getElementById('resetModalPromptBtn');
  const temperatureSlider = document.getElementById('temperatureSlider');
  const tempValBadge = document.getElementById('tempValBadge');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const presetPills = document.querySelectorAll('.preset-pill');

  // General Settings
  const sidebarProfileMenu = document.getElementById('sidebarProfileMenu');
  const sidebarProfileAvatar = document.getElementById('sidebarProfileAvatar');
  const profileMenuAvatar = document.getElementById('profileMenuAvatar');
  const profileMenuName = document.getElementById('profileMenuName');
  const profileSettingsBtn = document.getElementById('profileSettingsBtn');
  const accountNameInput = document.getElementById('accountNameInput');
  const saveProfileNameBtn = document.getElementById('saveProfileNameBtn');
  const defaultVoiceSelect = document.getElementById('defaultVoiceSelect');
  const saveGeneralSettingsBtn = document.getElementById('saveGeneralSettingsBtn');
  const voiceStatusHint = document.getElementById('voiceStatusHint');
  const clearAllDataBtn = document.getElementById('clearAllDataBtn');
  const customApiKeyInput = document.getElementById('customApiKeyInput');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const apiKeyStatusHint = document.getElementById('apiKeyStatusHint');

  // Persona Presets for Domain Intelligence
  const PERSONA_PRESETS = {
    auto: 'You are an adaptive technical assistant. Match your depth, structure, tone, and method to the user request. Answer any reasonable question directly, using rigorous analysis, code, examples, or concise guidance when helpful. Do not force a specialist format onto a general question.',
    scientist: 'You are a rigorous scientific researcher. Apply the scientific method to every problem. Form hypotheses, gather evidence, test rigorously, and always quantify your uncertainty. Distinguish clearly between what is established, what is probable, and what is speculative.',
    mathematician: 'You are a mathematician. Approach every problem with mathematical rigor. Provide formal definitions, state theorems precisely, prove claims step by step, and verify results.',
    engineer: 'You are a principal systems engineer. Focus on architecture, scalability, reliability, and operational excellence. Always present trade-offs, identify failure modes, and consider cost.',
    builder: 'You are an elite full-stack software engineer and architect. Provide clean, modular, production-ready code with robust error handling, modern patterns, and clear architectural explanations.',
    reasoner: 'You are a rigorous frontier reasoning AI. Break down all problems step-by-step with structured logical analysis, deep mathematical rigor, and explicit chain-of-thought verification.',
    concise: 'You are an ultra-concise expert. Output direct, optimal answers and solutions with minimal preamble or conversational filler.'
  };

  const savedInvestigations = localStorage.getItem('atlas_investigations') || localStorage.getItem('omni_sessions') || '[]';
  let initialSessions = [];
  try {
    const rawParsed = JSON.parse(savedInvestigations);
    if (Array.isArray(rawParsed)) {
      initialSessions = rawParsed.filter(s => s && Array.isArray(s.messages) && s.messages.length > 0);
    }
  } catch (e) {
    initialSessions = [];
  }

  let state = {
    theme: localStorage.getItem('omni_theme') || 'vylex',
    currentModel: localStorage.getItem('omni_model') || 'openrouter/free',
    models: FREE_MODELS,
    apiKey: localStorage.getItem('atlas_openrouter_api_key') || '',
    activeMode: localStorage.getItem('atlas_mode') || 'auto',
    accountName: localStorage.getItem('atlas_account_name') || 'Your Name',
    systemPrompt: localStorage.getItem('omni_sys_prompt') || PERSONA_PRESETS.auto,
    activePreset: localStorage.getItem('omni_preset') || 'auto',
    temperature: parseFloat(localStorage.getItem('omni_temp') || '0.7'),
    defaultVoiceName: localStorage.getItem('atlas_default_voice') || '',
    isDeepReasoning: localStorage.getItem('omni_deep_reasoning') === 'true',
    isWebSearch: localStorage.getItem('omni_web_search') === 'true',
    sessions: initialSessions,
    activeSessionId: null,
    isGenerating: false,
    abortController: null,
    activeArtifact: null,
    lastUserPrompt: '',
    isReadingResponse: false,
    activeSpeechButton: null,
    projectFiles: []
  };

  // Configure marked with rich typography extensions
  if (window.marked) {
    const customRenderer = new marked.Renderer();

    // Table renderer supporting both object tokens (marked v12+) and classic string arguments
    customRenderer.table = function (header, body) {
      let headerContent = '';
      let bodyContent = '';

      if (typeof header === 'object' && header !== null) {
        const token = header;
        if (token.header) {
          headerContent = Array.isArray(token.header)
            ? '<tr>' + token.header.map(cell => `<th>${cell.text || cell}</th>`).join('') + '</tr>'
            : String(token.header);
        }
        if (token.rows) {
          bodyContent = Array.isArray(token.rows)
            ? token.rows.map(row => '<tr>' + (Array.isArray(row) ? row.map(cell => `<td>${cell.text || cell}</td>`).join('') : `<td>${row}</td>`) + '</tr>').join('')
            : String(token.rows);
        }
      } else {
        headerContent = header || '';
        bodyContent = body || '';
      }

      return `
        <div class="table-container">
          <table class="rich-table">
            <thead>${headerContent}</thead>
            <tbody>${bodyContent}</tbody>
          </table>
        </div>
      `;
    };

    // Link renderer ensuring clean target="_blank" and no [object Object]
    customRenderer.link = function (href, title, text) {
      let cleanHref = '';
      let cleanTitle = '';
      let cleanText = '';

      if (typeof href === 'object' && href !== null) {
        cleanHref = href.href || '';
        cleanTitle = href.title || '';
        cleanText = href.text || href.raw || cleanHref;
      } else {
        cleanHref = href || '';
        cleanTitle = title || '';
        cleanText = text || cleanHref;
      }

      return `<a href="${cleanHref}" ${cleanTitle ? `title="${cleanTitle}"` : ''} target="_blank" rel="noopener noreferrer">${cleanText}</a>`;
    };

    marked.setOptions({
      renderer: customRenderer,
      gfm: true,
      breaks: true
    });
  }

  // --- INITIALIZATION ---
  function init() {
    applyTheme(state.theme);
    renderHistoryTree();
    initInvestigationModes();
    renderModelOptions();
    syncModelDisplay(state.currentModel);
    loadSavedSettings();
    updateDynamicGreeting();
    setupEventListeners();
    checkBackendHealth();

    if (state.sessions.length > 0) {
      loadSession(state.sessions[0].id);
    } else {
      createNewSession();
    }
  }

  // --- THEME SWITCHER ---
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('omni_theme', theme);

    themeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme-val') === theme);
    });
  }

  // --- INVESTIGATION MODES CONTROLLER ---
  function initInvestigationModes() {
    syncModeDisplay(state.activeMode);

    modeSelectorGrid?.querySelectorAll('.mode-card-pill').forEach(pill => {
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

    const session = getActiveSession();
    if (session && session.messages.length === 0) {
      session.mode = modeId;
      saveSessions();
    }
  }

  function syncModeDisplay(modeId) {
    const mode = INVESTIGATION_MODES[modeId] || INVESTIGATION_MODES.auto;

    if (modeSelectorGrid) {
      modeSelectorGrid.querySelectorAll('.mode-card-pill').forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-mode') === mode.id);
      });
    }

    if (activeModeTag) activeModeTag.textContent = `Mode: ${mode.name}`;
    if (activeModeDesc) activeModeDesc.textContent = mode.desc;

    updateDynamicGreeting(mode.id);

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

  // --- DYNAMIC GREETING ENGINE ---
  function updateDynamicGreeting(modeId) {
    if (!dynamicTimeGreeting) return;
    const hour = new Date().getHours();
    let salutation = 'Good evening';
    let isLateNight = false;

    if (hour >= 5 && hour < 12) {
      salutation = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      salutation = 'Good afternoon';
    } else if (hour >= 17 && hour < 22) {
      salutation = 'Good evening';
    } else {
      salutation = 'Working late?';
      isLateNight = true;
    }

    dynamicTimeGreeting.textContent = salutation;

    const punctElem = document.getElementById('greetingPunct');
    if (punctElem) {
      punctElem.textContent = isLateNight ? '' : ',';
    }

    const actionElem = document.getElementById('dynamicGreetingAction');
    if (actionElem) {
      const targetModeId = modeId || state.activeMode;
      const mode = (targetModeId && INVESTIGATION_MODES[targetModeId]) ? INVESTIGATION_MODES[targetModeId] : null;
      if (mode && mode.actionHint) {
        actionElem.textContent = isLateNight
          ? `Let's investigate: ${mode.actionHint}`
          : mode.actionHint;
      } else {
        if (isLateNight) {
          actionElem.textContent = "Let's work through it together.";
        } else if (hour >= 5 && hour < 9) {
          actionElem.textContent = "what would you like to work on today?";
        } else if (hour >= 9 && hour < 12) {
          actionElem.textContent = 'what would you like to work on today?';
        } else if (hour >= 12 && hour < 17) {
          actionElem.textContent = 'what challenge shall we tackle?';
        } else {
          actionElem.textContent = 'what would be useful to work through?';
        }
      }
    }
  }

  // --- BACKEND HEALTH & MODELS ---
  async function checkBackendHealth() {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

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

  function formatBadge(badge) {
    return String(badge || '').replace(/\s*FREE\s*/gi, '').trim() || 'PRO';
  }

  // --- MODEL DROPDOWN CONTROLLER ---
  function renderModelOptions() {
    if (!modelOptionsList) return;
    modelOptionsList.innerHTML = '';

    state.models.forEach(model => {
      const item = document.createElement('div');
      item.className = `model-option-item ${model.id === state.currentModel ? 'selected' : ''}`;
      item.innerHTML = `
        <div class="model-option-title">
          <span style="display: flex; align-items: center; gap: 6px;">
            ${getModelIcon(model.id)}
            <span>${escapeHtml(model.name)}</span>
          </span>
          <span class="model-pill-badge">${formatBadge(model.badge)}</span>
        </div>
        <div class="model-option-desc">${escapeHtml(model.description || model.desc || '')}</div>
      `;

      item.addEventListener('click', () => {
        selectModel(model.id);
        modelDropdownMenu?.classList.remove('show');
      });

      modelOptionsList.appendChild(item);
    });
  }

  function selectModel(modelId) {
    state.currentModel = modelId;
    localStorage.setItem('omni_model', modelId);
    syncModelDisplay(modelId);
    renderModelOptions();
  }

  function syncModelDisplay(modelId) {
    const model = state.models.find(m => m.id === modelId) || FREE_MODELS[0];
    if (modelCurrentName) modelCurrentName.textContent = model.name;
    if (modelPillBadge) modelPillBadge.textContent = formatBadge(model.badge);
    if (hintModelName) hintModelName.textContent = model.id;
    if (modelSparkIcon) modelSparkIcon.innerHTML = getModelIcon(model.id);
  }

  // --- INVESTIGATION SESSION MANAGEMENT ---
  function createNewSession() {
    const active = getActiveSession();
    if (active && (!active.messages || active.messages.length === 0)) {
      renderSessionMessages(active);
      updateSessionMetrics();
      if (messageInput) messageInput.focus();
      if (window.innerWidth <= 768) closeMobileSidebar();
      return;
    }

    // Clean up any empty sessions
    state.sessions = state.sessions.filter(s => s && Array.isArray(s.messages) && s.messages.length > 0);

    const newSession = {
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      title: 'New Session',
      mode: state.activeMode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };

    state.sessions.unshift(newSession);
    state.activeSessionId = newSession.id;
    saveSessions();
    renderHistoryTree();
    renderSessionMessages(newSession);
    updateSessionMetrics();

    if (messageInput) messageInput.focus();
    if (window.innerWidth <= 768) {
      closeMobileSidebar();
    }
  }

  function loadSession(sessionId) {
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return;

    state.activeSessionId = sessionId;
    if (session.mode && INVESTIGATION_MODES[session.mode]) {
      selectMode(session.mode);
    }

    renderHistoryTree();
    renderSessionMessages(session);
    updateSessionMetrics();

    if (messageInput) messageInput.focus();
  }

  function getActiveSession() {
    return state.sessions.find(s => s.id === state.activeSessionId);
  }

  function saveSessions() {
    const validSessions = state.sessions.filter(s => s && Array.isArray(s.messages) && s.messages.length > 0);
    localStorage.setItem('atlas_investigations', JSON.stringify(validSessions));
  }

  function updateSessionMetrics() {
    const session = getActiveSession();
    const count = session ? session.messages.length : 0;
    if (sessionMetricBadge) {
      sessionMetricBadge.textContent = `${count} msg${count === 1 ? '' : 's'}`;
    }
  }

  function getSessionDateCategory(session) {
    const rawDate = session.createdAt || session.updatedAt;
    if (!rawDate) return 'previous';

    const sessionDate = new Date(rawDate);
    if (isNaN(sessionDate.getTime())) return 'previous';

    const now = new Date();
    // Real calendar day comparison (midnight to midnight) in user's local timezone
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const itemDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

    if (itemDay.getTime() === today.getTime()) {
      return 'today';
    } else if (itemDay.getTime() === yesterday.getTime()) {
      return 'yesterday';
    }
    return 'previous';
  }

  function renderHistoryTree(searchQuery = '') {
    if (!historyListToday || !historyListYesterday || !historyListPrevious) return;

    historyListToday.innerHTML = '';
    historyListYesterday.innerHTML = '';
    historyListPrevious.innerHTML = '';

    const query = searchQuery.toLowerCase();
    const validSessions = state.sessions.filter(s => s && Array.isArray(s.messages) && s.messages.length > 0);
    const filtered = validSessions.filter(s => {
      const title = s.title || s.messages.find(m => m.role === 'user' && m.content)?.content || 'New Session';
      return !query || title.toLowerCase().includes(query) || (s.messages && s.messages.some(m => m.content && m.content.toLowerCase().includes(query)));
    });

    if (filtered.length === 0) {
      if (emptyHistoryState) emptyHistoryState.style.display = 'block';
      if (historyGroupToday) historyGroupToday.style.display = 'none';
      if (historyGroupYesterday) historyGroupYesterday.style.display = 'none';
      if (historyGroupPrevious) historyGroupPrevious.style.display = 'none';
      return;
    }
    if (emptyHistoryState) emptyHistoryState.style.display = 'none';

    filtered.forEach(session => {
      const category = getSessionDateCategory(session);
      let targetList = historyListPrevious;

      if (category === 'today') targetList = historyListToday;
      else if (category === 'yesterday') targetList = historyListYesterday;

      const item = document.createElement('div');
      item.className = `history-item ${session.id === state.activeSessionId ? 'active' : ''}`;
      const sessionTitle = session.title || session.messages.find(m => m.role === 'user' && m.content)?.content || 'New Session';
      item.innerHTML = `
        <span class="history-item-title">${escapeHtml(sessionTitle.slice(0, 60))}</span>
        <button class="history-item-del-btn" title="Delete" aria-label="Delete">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.history-item-del-btn')) {
          e.stopPropagation();
          deleteSession(session.id);
        } else {
          loadSession(session.id);
          if (window.innerWidth <= 768) closeMobileSidebar();
        }
      });

      targetList.appendChild(item);
    });

    if (historyGroupToday) historyGroupToday.style.display = historyListToday.children.length > 0 ? 'block' : 'none';
    if (historyGroupYesterday) historyGroupYesterday.style.display = historyListYesterday.children.length > 0 ? 'block' : 'none';
    if (historyGroupPrevious) historyGroupPrevious.style.display = historyListPrevious.children.length > 0 ? 'block' : 'none';
  }

  function deleteSession(sessionId) {
    state.sessions = state.sessions.filter(s => s.id !== sessionId);
    saveSessions();
    const remainingValid = state.sessions.filter(s => s.messages && s.messages.length > 0);
    if (state.activeSessionId === sessionId) {
      if (remainingValid.length > 0) loadSession(remainingValid[0].id);
      else createNewSession();
    } else {
      renderHistoryTree();
    }
  }

  // --- MESSAGE FEED RENDERING ---
  function renderSessionMessages(session) {
    if (!messagesContainer) return;
    messagesContainer.innerHTML = '';

    if (!session || !session.messages || session.messages.length === 0) {
      if (welcomeScreen) {
        messagesContainer.appendChild(welcomeScreen);
        welcomeScreen.style.display = 'flex';
        updateDynamicGreeting(state.activeMode);
      }
      return;
    }

    if (welcomeScreen && welcomeScreen.parentNode) {
      welcomeScreen.style.display = 'none';
    }

    session.messages.forEach(msg => {
      renderMessageItem(msg.role, msg.content, msg.reasoning, false, msg.widgets || [], msg.attachments || []);
    });

    scrollToBottom(true);
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function startStatusAnimation(bubble, modeId) {
    const terms = INVESTIGATION_STATUS_TERMS[modeId] || INVESTIGATION_STATUS_TERMS.default;
    let stepIndex = 0;

    const loader = document.createElement('div');
    loader.className = 'bubble-status-loader';
    loader.innerHTML = `<span class="status-spinner"></span><span class="bubble-status-text">${escapeHtml(terms[0])}</span>`;
    bubble.innerHTML = '';
    bubble.appendChild(loader);

    const textElem = loader.querySelector('.bubble-status-text');

    const intervalId = setInterval(() => {
      stepIndex = (stepIndex + 1) % terms.length;
      const currentTerm = terms[stepIndex];
      if (textElem && textElem.isConnected) {
        textElem.style.opacity = '0';
        setTimeout(() => {
          if (textElem && textElem.isConnected) {
            textElem.textContent = currentTerm;
            textElem.style.opacity = '1';
          }
        }, 150);
      }
    }, 2000);

    return {
      stop: () => {
        clearInterval(intervalId);
        if (loader.parentNode === bubble) {
          loader.remove();
        }
      }
    };
  }

  function renderMessageItem(role, content = '', reasoning = '', shouldScroll = true, widgets = [], attachments = []) {
    if (welcomeScreen && welcomeScreen.parentNode) {
      welcomeScreen.style.display = 'none';
    }

    const row = document.createElement('div');
    row.className = `message-row ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = role === 'user' ? 'U' : 'A';

    const wrapper = document.createElement('div');
    wrapper.className = 'message-content-wrapper';

    let reasoningDetails = null;
    let reasoningBody = null;

    function setReasoning(text) {
      if (!text || !text.trim()) return;
      if (!reasoningDetails) {
        reasoningDetails = document.createElement('details');
        reasoningDetails.className = 'reasoning-accordion';
        reasoningDetails.open = true; // Always show thought process when present
        reasoningDetails.innerHTML = `
          <summary>Thought Process</summary>
          <div class="reasoning-body"></div>
        `;
        wrapper.insertBefore(reasoningDetails, wrapper.firstChild);
        reasoningBody = reasoningDetails.querySelector('.reasoning-body');
      }
      if (reasoningBody) {
        reasoningBody.textContent = text;
      }
    }

    // Reasoning accordion (if any reasoning is provided initially)
    if (role === 'assistant' && reasoning) {
      setReasoning(reasoning);
    }

    // Dedicated widgets container (weather, crypto, math, etc.)
    const widgetsContainer = document.createElement('div');
    widgetsContainer.className = 'message-widgets-container';
    wrapper.appendChild(widgetsContainer);

    if (Array.isArray(widgets) && widgets.length > 0) {
      widgets.forEach(w => {
        if (window.atlasRenderWidget) {
          const wHtml = window.atlasRenderWidget(w.type, w.data);
          if (wHtml) {
            const wBox = document.createElement('div');
            wBox.className = 'widget-mount-point';
            wBox.innerHTML = wHtml;
            widgetsContainer.appendChild(wBox);
          }
        }
      });
    }

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = parseMarkdownSafely(content, false);

    enhanceCodeBlocks(bubble);
    renderMathSafely(bubble);
    wrapper.appendChild(bubble);

    if (role === 'user' && Array.isArray(attachments) && attachments.length > 0) {
      const attachmentBlock = document.createElement('div');
      attachmentBlock.className = 'message-attachments';
      attachmentBlock.innerHTML = `
        <div class="message-attachments-heading">
          <span class="message-attachments-icon" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h3l2 2h6A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"></path></svg>
          </span>
          <span>${attachments.length} attached file${attachments.length === 1 ? '' : 's'}</span>
        </div>
        <div class="message-attachments-list"></div>
      `;
      const attachmentList = attachmentBlock.querySelector('.message-attachments-list');
      attachments.slice(0, 5).forEach(attachment => {
        const fileName = document.createElement('span');
        fileName.className = 'message-attachment-name';
        fileName.textContent = attachment.path || 'Attached file';
        attachmentList.appendChild(fileName);
      });
      if (attachments.length > 5) {
        const remaining = document.createElement('span');
        remaining.className = 'message-attachment-more';
        remaining.textContent = `+${attachments.length - 5} more`;
        attachmentList.appendChild(remaining);
      }
      wrapper.insertBefore(attachmentBlock, bubble);
    }

    if (role === 'assistant') {
      const actionsBar = document.createElement('div');
      actionsBar.className = 'message-actions-bar';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'action-btn copy-btn';
      copyBtn.innerHTML = ICONS.copy || 'Copy';
      copyBtn.title = 'Copy response';

      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(bubble.innerText);
          copyBtn.innerHTML = ICONS.check || 'Copied';
          setTimeout(() => { copyBtn.innerHTML = ICONS.copy || 'Copy'; }, 2000);
        } catch (e) {
          console.warn('Clipboard write failed', e);
        }
      });

      const speakBtn = document.createElement('button');
      speakBtn.className = 'action-btn speak-btn';
      speakBtn.innerHTML = ICONS.speaker || 'Speak';
      speakBtn.title = 'Speak response';

      const setSpeechButtonState = (isSpeaking) => {
        speakBtn.classList.toggle('is-speaking', isSpeaking);
        speakBtn.title = isSpeaking ? 'Stop reading response' : 'Speak response';
        speakBtn.innerHTML = isSpeaking ? (ICONS.stop || 'Stop') : (ICONS.speaker || 'Speak');
      };

      speakBtn.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) return;

        if (state.isReadingResponse && state.activeSpeechButton === speakBtn) {
          window.speechSynthesis.cancel();
          state.isReadingResponse = false;
          state.activeSpeechButton = null;
          setSpeechButtonState(false);
          return;
        }

        if (state.activeSpeechButton && state.activeSpeechButton !== speakBtn) {
          state.activeSpeechButton.innerHTML = ICONS.speaker || 'Speak';
          state.activeSpeechButton.title = 'Speak response';
          state.activeSpeechButton.classList.remove('is-speaking');
        }

        const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
        const selectedVoice = voices.find(v => v.name === state.defaultVoiceName)
          || voices.find(v => v.name.toLowerCase() === (state.defaultVoiceName || '').toLowerCase())
          || voices.find(v => v.default)
          || voices[0]
          || null;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(bubble.innerText);
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.onend = () => {
          if (state.activeSpeechButton === speakBtn) {
            state.isReadingResponse = false;
            state.activeSpeechButton = null;
            setSpeechButtonState(false);
          }
        };
        utterance.onerror = () => {
          if (state.activeSpeechButton === speakBtn) {
            state.isReadingResponse = false;
            state.activeSpeechButton = null;
            setSpeechButtonState(false);
          }
        };

        state.isReadingResponse = true;
        state.activeSpeechButton = speakBtn;
        setSpeechButtonState(true);
        window.speechSynthesis.speak(utterance);
      });

      actionsBar.appendChild(copyBtn);
      actionsBar.appendChild(speakBtn);
      wrapper.appendChild(actionsBar);
    }

    row.appendChild(avatar);
    row.appendChild(wrapper);

    messagesContainer.appendChild(row);

    if (shouldScroll) {
      scrollToBottom(true);
    }

    return { row, bubble, wrapper, widgetsContainer, setReasoning };
  }

  // ─────────────────────────────────────────────────────────────
  // ADVANCED MATHEMATICAL & SCIENTIFIC FORMULA PARSER (KaTeX + mhchem)
  // ─────────────────────────────────────────────────────────────

  function extractMathTokens(raw) {
    if (!raw) return { text: '', tokens: [] };

    const tokens = [];
    let counter = 0;

    // 1. Protect code blocks and inline code so math syntax inside code blocks is preserved as-is
    const codeBlocks = [];
    let text = raw.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
      const ph = `@@ATLAS_CODE_SHIELD_${codeBlocks.length}@@`;
      codeBlocks.push({ placeholder: ph, content: match });
      return ph;
    });

    // 2. Block math: $$ ... $$
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      const trimmed = formula.trim();
      if (!trimmed) return '';
      const id = counter++;
      const ph = `@@ATLAS_MATH_BLOCK_${id}@@`;
      tokens.push({ id, placeholder: ph, formula: trimmed, isBlock: true });
      return `\n\n${ph}\n\n`;
    });

    // 3. Block math: \[ ... \]
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
      const trimmed = formula.trim();
      if (!trimmed) return '';
      const id = counter++;
      const ph = `@@ATLAS_MATH_BLOCK_${id}@@`;
      tokens.push({ id, placeholder: ph, formula: trimmed, isBlock: true });
      return `\n\n${ph}\n\n`;
    });

    // 4. Block math LaTeX environments: \begin{equation}...\end{equation}, \begin{align}...\end{align}, etc.
    const latexEnvs = 'equation|equation\\*|align|align\\*|aligned|matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|cases|gather|gather\\*|flalign|flalign\\*|split|multline|multline\\*';
    const envRegex = new RegExp(`\\\\begin\\{(${latexEnvs})\\}([\\s\\S]*?)\\\\end\\{\\1\\}`, 'g');
    text = text.replace(envRegex, (match) => {
      const trimmed = match.trim();
      if (!trimmed) return '';
      const id = counter++;
      const ph = `@@ATLAS_MATH_BLOCK_${id}@@`;
      tokens.push({ id, placeholder: ph, formula: trimmed, isBlock: true });
      return `\n\n${ph}\n\n`;
    });

    // 5. Inline math: \( ... \)
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
      const trimmed = formula.trim();
      if (!trimmed) return '';
      const id = counter++;
      const ph = `@@ATLAS_MATH_INLINE_${id}@@`;
      tokens.push({ id, placeholder: ph, formula: trimmed, isBlock: false });
      return ph;
    });

    // 6. Inline math: $...$ (ensuring we don't accidentally match currency e.g. $50 or $100.00)
    text = text.replace(/(^|[^\$\w])\$((?!\s)[^\$\n]+?(?<!\s))\$(?!\d)/g, (match, prefix, formula) => {
      const trimmed = formula.trim();
      if (/^[\d,]+(\.\d+)?$/.test(trimmed)) {
        return match;
      }
      const id = counter++;
      const ph = `@@ATLAS_MATH_INLINE_${id}@@`;
      tokens.push({ id, placeholder: ph, formula: trimmed, isBlock: false });
      return `${prefix}${ph}`;
    });

    // 7. Unshield code blocks
    for (const cb of codeBlocks) {
      text = text.replace(cb.placeholder, cb.content);
    }

    return { text, tokens };
  }

  function renderMathTokenToHtml(token) {
    if (!token || !token.formula) return '';
    const formula = token.formula;
    let katexHtml = '';

    if (window.katex) {
      try {
        katexHtml = window.katex.renderToString(formula, {
          displayMode: token.isBlock,
          throwOnError: false,
          output: 'htmlAndMathml',
          strict: false,
          trust: true
        });
      } catch (err) {
        katexHtml = token.isBlock
          ? `<div class="katex-display">$$${escapeHtml(formula)}$$</div>`
          : `<span class="katex">$${escapeHtml(formula)}$</span>`;
      }
    } else {
      katexHtml = token.isBlock
        ? `<div class="katex-display">$$${escapeHtml(formula)}$$</div>`
        : `<span class="katex">$${escapeHtml(formula)}$</span>`;
    }

    if (token.isBlock) {
      const rawEscaped = encodeURIComponent(formula);
      return `
        <div class="math-block-wrapper" data-latex="${rawEscaped}">
          <div class="math-block-header">
            <span class="math-block-tag">FORMULA</span>
            <button class="math-copy-btn" type="button" title="Copy LaTeX formula" aria-label="Copy LaTeX formula">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy LaTeX</span>
            </button>
          </div>
          <div class="math-block-body">
            ${katexHtml}
          </div>
        </div>
      `;
    } else {
      return `<span class="katex-inline-wrapper">${katexHtml}</span>`;
    }
  }

  function enhanceMathBlocks(container) {
    if (!container) return;
    const copyBtns = container.querySelectorAll('.math-copy-btn');
    copyBtns.forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = 'true';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wrapper = btn.closest('.math-block-wrapper');
        if (!wrapper) return;
        const latex = decodeURIComponent(wrapper.getAttribute('data-latex') || '');
        if (!latex) return;
        navigator.clipboard.writeText(latex).then(() => {
          const span = btn.querySelector('span');
          if (span) {
            const old = span.textContent;
            span.textContent = 'Copied!';
            setTimeout(() => { span.textContent = old; }, 1800);
          }
        }).catch(() => { });
      });
    });
  }

  function renderMathSafely(container) {
    if (!container) return;
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(container, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'svg'],
          throwOnError: false,
          strict: false
        });
      } catch (e) {
        console.warn('[KaTeX auto-render]', e);
      }
    }
    enhanceMathBlocks(container);
  }

  function parseMarkdownSafely(raw, isStreaming = false) {
    if (!raw) return isStreaming ? '<span class="streaming-caret" aria-hidden="true"></span>' : '';

    // 1. Extract and shield LaTeX mathematical & scientific formulas
    const { text: shieldedText, tokens: mathTokens } = extractMathTokens(raw);

    // 2. Parse markdown with marked
    let html = window.marked ? marked.parse(shieldedText) : escapeHtml(shieldedText);

    // 3. Sanitize HTML
    if (window.DOMPurify) {
      html = DOMPurify.sanitize(html, {
        ADD_TAGS: ['kbd', 'mark', 'details', 'summary', 'svg', 'path', 'circle', 'line', 'polyline', 'polygon', 'rect', 'math', 'semantics', 'mrow', 'mo', 'mn', 'mi', 'annotation', 'mfrac', 'msup', 'msub', 'msubsup', 'msqrt', 'mroot', 'mtable', 'mtr', 'mtd', 'mtext'],
        ADD_ATTR: ['target', 'disabled', 'checked', 'type', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'd', 'points', 'width', 'height', 'aria-hidden', 'xmlns', 'display', 'data-latex']
      });
    }

    // 4. Substitute rendered KaTeX formulas back
    for (const token of mathTokens) {
      const renderedMath = renderMathTokenToHtml(token);
      if (token.isBlock) {
        const pRegex = new RegExp(`<p>\\s*${token.placeholder}\\s*<\\/p>`, 'g');
        if (pRegex.test(html)) {
          html = html.replace(pRegex, renderedMath);
        } else {
          html = html.split(token.placeholder).join(renderedMath);
        }
      } else {
        html = html.split(token.placeholder).join(renderedMath);
      }
    }

    if (isStreaming) {
      html += '<span class="streaming-caret" aria-hidden="true"></span>';
    }
    return html;
  }

  function enhanceCodeBlocks(container) {
    if (!container) return;
    const preBlocks = container.querySelectorAll('pre');

    preBlocks.forEach(pre => {
      if (pre.closest('.code-block-container')) return;

      const codeElem = pre.querySelector('code');
      const codeText = codeElem ? codeElem.innerText : pre.innerText;
      let language = 'code';

      if (codeElem && codeElem.className) {
        const match = codeElem.className.match(/language-(\w+)/);
        if (match) language = match[1];
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-container';

      const header = document.createElement('div');
      header.className = 'code-block-header';
      header.innerHTML = `
        <span>${language.toUpperCase()}</span>
        <span class="code-block-actions">
          <button class="copy-code-btn" type="button">Copy</button>
          <button class="open-canvas-btn" type="button" title="Open in Canvas" aria-label="Open code in Canvas">${ICONS.canvas || 'Canvas'}</button>
        </span>
      `;

      header.querySelector('.copy-code-btn')?.addEventListener('click', (e) => {
        navigator.clipboard.writeText(codeText).then(() => {
          e.target.textContent = 'Copied';
          setTimeout(() => { e.target.textContent = 'Copy'; }, 1500);
        });
      });

      header.querySelector('.open-canvas-btn')?.addEventListener('click', () => {
        openCodeInCanvas(codeText, language);
      });

      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);

      if (window.hljs && codeElem && !codeElem.classList.contains('hljs')) {
        hljs.highlightElement(codeElem);
      }

      // Populate canvas with significant code blocks
      if (codeText.length > 80 && !state.activeArtifact) {
        updateCanvasArtifact({
          title: `Code (${language})`,
          codeText,
          language,
          type: 'Code Snippet'
        });
      }
    });
  }

  function openCodeInCanvas(codeText, language) {
    updateCanvasArtifact({
      title: `Code (${language})`,
      codeText,
      language,
      type: 'Code Snippet'
    });
    artifactsCanvasPanel?.classList.add('open');
    toggleCanvasBtn?.classList.add('active');
    switchCanvasTab(language === 'html' ? 'preview' : 'code');
  }

  function updateCanvasArtifact({ title, codeText, language, type }) {
    state.activeArtifact = { title, codeText, language, type };

    if (canvasDocumentTitle) canvasDocumentTitle.textContent = title || 'Artifact';
    if (canvasTypeTag) canvasTypeTag.textContent = type || 'Code';
    if (canvasLanguageBadge) canvasLanguageBadge.textContent = (language || 'TEXT').toUpperCase();

    const lineCount = codeText ? codeText.split('\n').length : 0;
    const byteCount = codeText ? new Blob([codeText]).size : 0;
    if (canvasLineCount) canvasLineCount.textContent = `${lineCount} lines • ${byteCount} bytes`;

    if (canvasCodeContent) {
      canvasCodeContent.textContent = codeText;
      if (window.hljs) hljs.highlightElement(canvasCodeContent);
    }

    if (canvasMarkdownContent && window.marked) {
      canvasMarkdownContent.innerHTML = parseMarkdownSafely(codeText);
      enhanceCodeBlocks(canvasMarkdownContent);
      renderMathSafely(canvasMarkdownContent);
    }

    if (canvasPreviewFrame && (language === 'html' || codeText.includes('<!DOCTYPE') || codeText.includes('<html'))) {
      canvasPreviewFrame.srcdoc = codeText;
    }
  }

  function switchCanvasTab(tabKey) {
    canvasTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabKey));
    if (canvasCodePane) canvasCodePane.classList.toggle('active', tabKey === 'code');
    if (canvasPreviewPane) canvasPreviewPane.classList.toggle('active', tabKey === 'preview');
    if (canvasMarkdownPane) canvasMarkdownPane.classList.toggle('active', tabKey === 'markdown');
    if (document.getElementById('canvasAgentPane')) {
      document.getElementById('canvasAgentPane').classList.toggle('active', tabKey === 'agent');
    }
  }

  // --- SUBMIT MESSAGE & STREAMING ---
  async function handleChatSubmit(e) {
    if (e) e.preventDefault();
    const prompt = messageInput.value.trim();
    if (!prompt || state.isGenerating) return;

    if (prompt.toLowerCase().trim() === '/settings') {
      messageInput.value = '';
      if (typeof autoResizeTextarea === 'function') autoResizeTextarea();
      if (typeof openUnifiedSettings === 'function') openUnifiedSettings();
      return;
    }

    if (prompt.toLowerCase().trim() === '/clear') {
      messageInput.value = '';
      if (typeof autoResizeTextarea === 'function') autoResizeTextarea();
      let session = getActiveSession();
      if (session && confirm('Clear all messages in this investigation?')) {
        session.messages = [];
        saveSessions();
        renderHistoryTree();
        renderSessionMessages(session);
        updateSessionMetrics();
      }
      return;
    }

    if (prompt.toLowerCase().trim() === '/exit' || prompt.toLowerCase().trim() === '/new') {
      messageInput.value = '';
      if (typeof autoResizeTextarea === 'function') autoResizeTextarea();
      createNewSession();
      return;
    }

    messageInput.value = '';
    if (typeof autoResizeTextarea === 'function') autoResizeTextarea();

    let session = getActiveSession();
    if (!session) {
      createNewSession();
      session = getActiveSession();
    }

    // First user message sets title
    if (session.messages.length === 0) {
      session.title = prompt.slice(0, 36);
      fetchSessionTitle(prompt, session.id);
    }

    const messageAttachments = state.projectFiles.map(file => ({ path: file.path }));
    session.messages.push({ role: 'user', content: prompt, attachments: messageAttachments });
    session.updatedAt = new Date().toISOString();
    saveSessions();
    renderHistoryTree();

    renderMessageItem('user', prompt, '', true, [], messageAttachments);
    updateSessionMetrics();

    // Prepare assistant message bubble & status animator
    const { bubble, wrapper, widgetsContainer, setReasoning } = renderMessageItem('assistant', '', '', true);
    let statusAnimator = startStatusAnimation(bubble, state.activeMode);
    state.isGenerating = true;

    if (stopGenerationBtn) stopGenerationBtn.style.display = 'flex';
    if (sendBtn) sendBtn.style.display = 'none';
    if (streamingIndicator) streamingIndicator.style.display = 'flex';

    const payloadMessages = session.messages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant'))
      .map(m => ({ role: m.role, content: m.content }));
    const projectContext = buildProjectContext();
    if (projectContext && payloadMessages.length > 0) {
      payloadMessages[payloadMessages.length - 1].content += projectContext;
    }
    let requestWebSearch = state.isWebSearch;

    let accumulatedContent = '';
    let accumulatedReasoning = '';
    let accumulatedWidgets = [];
    let inThinkTag = false;
    let lastRenderTime = 0;

    state.abortController = new AbortController();

    const runLocalWidget = async (toolToCall, argsPayload, statusText) => {
      if (statusAnimator) { statusAnimator.stop(); statusAnimator = null; }
      const res = await fetch(`${API_BASE}/api/widget/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: state.abortController.signal,
        body: JSON.stringify({ tool: toolToCall, args: argsPayload })
      });

      if (!res.ok) throw new Error('Widget service failed');
      const widgetResult = await res.json();

      accumulatedWidgets.push(widgetResult);

      if (window.atlasRenderWidget) {
        const widgetHtml = window.atlasRenderWidget(widgetResult.type, widgetResult.data);
        if (widgetHtml && widgetsContainer) {
          const widgetBox = document.createElement('div');
          widgetBox.className = 'widget-mount-point';
          widgetBox.innerHTML = widgetHtml;
          widgetsContainer.appendChild(widgetBox);
        }
      }

      bubble.innerHTML = parseMarkdownSafely(statusText, false);

      session.messages.push({
        role: 'assistant',
        content: statusText,
        widgets: accumulatedWidgets
      });
      session.updatedAt = new Date().toISOString();
      saveSessions();
      updateSessionMetrics();

      state.isGenerating = false;
      if (stopGenerationBtn) stopGenerationBtn.style.display = 'none';
      if (sendBtn) sendBtn.style.display = 'flex';
      if (streamingIndicator) streamingIndicator.style.display = 'none';
      scrollToBottom(true);
    };

    const detectLocalWidgetIntent = (text) => {
      const trimmed = text.trim();
      const lower = trimmed.toLowerCase();

      // NEVER hijack prompts in Build mode or when user is asking to build/write/code something
      if (state.activeMode === 'build' || /\b(build|write|create|code|html|css|js|javascript|python|component|website|app|portfolio|page)\b/i.test(lower)) {
        return null;
      }

      // If the prompt is a long, multi-sentence prompt, do not hijack with single-intent widgets
      if (trimmed.length > 100 && !/^(what'?s the weather|convert\s+\d+|what is the time)/i.test(trimmed)) {
        return null;
      }

      const stripTrailing = (value) => value.replace(/[?.!]+$/g, '').trim();
      const pickMatch = (patterns) => {
        for (const pattern of patterns) {
          const match = trimmed.match(pattern);
          if (match?.[1]) return stripTrailing(match[1]);
        }
        return '';
      };

      // Strict OCR trigger: only when explicitly commanding to scan/open OCR
      if (/^(?:open\s+)?(?:scan\s+)?ocr\b/i.test(trimmed) || /^(?:scan|extract|read)\s+text\s+from\s+(?:an?\s+)?(?:image|photo|camera|screenshot|picture)$/i.test(trimmed)) {
        return { tool: 'scan_ocr', args: {}, label: 'Opened OCR scanner.' };
      }

      // QR Code Scan trigger
      if (/^(?:open\s+)?(?:scan|read|decode)\s+(?:a\s+)?qr(?:\s*code)?$/i.test(trimmed) || /^(?:qr\s*(?:scan|scanner|reader)|scan\s*qr)$/i.test(trimmed)) {
        return { tool: 'scan_qr', args: {}, label: 'Opened QR Code Scanner.' };
      }

      // QR Code Generation trigger
      const qrGenMatch = trimmed.match(/^(?:generate|make|create|build|encode)\s+(?:a\s+)?(?:qr|qr\s*code)\s+(?:for|of|with|saying|containing)?\s*(.+)$/i)
        || trimmed.match(/^(?:qr|qr\s*code)\s+(?:for|of|with)?\s*(.+)$/i);
      if (qrGenMatch && qrGenMatch[1] && !/\b(scanner|reader|camera)\b/i.test(qrGenMatch[1])) {
        const qrData = stripTrailing(qrGenMatch[1].replace(/^(?:the\s+)?(?:note|text|link|url|phrase|string|message)\s+/i, '').trim());
        if (qrData) {
          return { tool: 'generate_qr', args: { data: qrData }, label: `Generated QR code for "${qrData}".` };
        }
      }

      const currency = trimmed.match(/^\s*(?:convert\s+)?(\d+(?:\.\d+)?)\s*([a-z]{3})\s+(?:to|in|into)\s+([a-z]{3})\s*\??$/i);
      if (currency) {
        return {
          tool: 'convert_currency',
          args: { amount: parseFloat(currency[1]), from: currency[2].toUpperCase(), to: currency[3].toUpperCase() },
          label: 'Converted live currency rate.'
        };
      }

      const unit = trimmed.match(/^\s*(?:convert\s+)?(-?\d+(?:\.\d+)?)\s*([a-zA-Z°/ ]{1,22})\s+(?:to|in|into)\s+([a-zA-Z°/ ]{1,22})\s*\??$/i);
      if (unit && !/^[a-z]{3}$/i.test(unit[2].trim()) && !/^[a-z]{3}$/i.test(unit[3].trim())) {
        return {
          tool: 'convert_units',
          args: { value: parseFloat(unit[1]), from: unit[2].trim(), to: unit[3].trim() },
          label: 'Converted units.'
        };
      }

      const bible = pickMatch([
        /^(?:give me\s+)?(?:a\s+)?(?:bible verse|scripture|verse)\s+(?:for|about|from)?\s*(.+)$/i,
        /^([1-3]?\s*[a-z]+(?:\s+[a-z]+)?\s+\d+:\d+(?:-\d+)?)$/i
      ]);
      if (bible || /^(a bible verse|random scripture|give me a scripture)$/i.test(trimmed)) {
        return { tool: 'get_bible_verse', args: { reference: bible || '' }, label: 'Fetched scripture.' };
      }

      const definition = pickMatch([/^(?:define|meaning of|what does)\s+["']?([a-z][a-z-]*)["']?(?:\s+mean)?\??$/i]);
      if (definition) {
        return { tool: 'define_word', args: { word: definition }, label: 'Fetched dictionary definition.' };
      }

      const weather = pickMatch([/^(?:what'?s the\s+)?weather\s+(?:in|for|at)\s+(.+)\??$/i, /^(?:forecast|temperature)\s+(?:in|for|at)\s+(.+)\??$/i]);
      if (weather) {
        return { tool: 'get_weather', args: { city: weather }, label: 'Fetched live weather.' };
      }

      const crypto = pickMatch([/^(?:what'?s the\s+)?(?:price of|price for|crypto price of)\s+([a-z0-9 ,&+.-]+)\??$/i, /^([a-z0-9 ,&+.-]+)\s+(?:price|crypto price|price right now)\??$/i]);
      if (crypto && /\b(bitcoin|btc|ethereum|eth|solana|sol|xrp|doge|cardano|ada|crypto)\b/i.test(crypto)) {
        return { tool: 'get_crypto_price', args: { coin: crypto.replace(/\bcrypto\b/gi, '').trim() || 'bitcoin' }, label: 'Fetched live crypto price.' };
      }

      const subreddit = pickMatch([/^(?:show me\s+)?(?:reddit|subreddit)\s+(?:posts|news|threads|discussions)?\s*(?:from|for|in)?\s*\/?r\/?([a-z0-9_]+)$/i, /^r\/([a-z0-9_]+)$/i]);
      if (subreddit) {
        return { tool: 'get_reddit_posts', args: { subreddit: subreddit || 'news' }, label: 'Fetched live discussions.' };
      }

      // Strict Image search: must start with explicit image search phrase
      const image = pickMatch([/^(?:show me|find|search)\s+(?:an?\s+)?(?:images?|photos?|pictures?)\s+(?:of|for)\s+(.+)$/i, /^photos?\s+(?:of|for)\s+(.+)$/i]);
      if (image && !/\b(website|portfolio|button|page|component)\b/i.test(image)) {
        return { tool: 'search_images', args: { query: image }, label: 'Fetched visual references.' };
      }

      const math = pickMatch([/^(?:derivative|integral|simplify|factor|solve|limit)\s+(?:of\s+)?(.+)$/i]);
      if (math && /[0-9x-z=+\-*/^()]/i.test(math) && trimmed.length < 50) {
        const opMatch = lower.match(/\b(derivative|integral|simplify|factor|solve|limit)\b/);
        const operation = opMatch ? opMatch[1] : 'simplify';
        return { tool: 'solve_math', args: { expression: math, operation }, label: 'Solved math expression.' };
      }

      const spaceTopic = pickMatch([/^(?:space|spacex|nasa|mars|artemis|jwst)\s+(?:news|updates|headlines)\s*(.*)$/i]);
      if (spaceTopic || /^(space news|spacex updates|nasa news|mars rover|artemis mission|jwst discoveries)$/i.test(lower)) {
        return { tool: 'get_space_news', args: { topic: spaceTopic }, label: 'Fetched space intelligence.' };
      }

      const newsTopic = pickMatch([/^(?:show me\s+)?(?:latest|current|today'?s)?\s*(?:news|headlines|top stories)\s*(?:about|on|for|in)?\s*(.*)$/i]);
      if (/^(news|headlines|top stories)$/i.test(lower)) {
        return { tool: 'get_news_headlines', args: { topic: newsTopic || 'top stories' }, label: 'Fetched live headlines.' };
      }

      const time = pickMatch([/^(?:what'?s the\s+)?(?:time|date)\s+(?:in|for|at)\s+(.+)\??$/i]);
      if (time || /^(what'?s\s+)?(?:the\s+)?(?:current\s+)?time\??$/i.test(trimmed)) {
        return { tool: 'get_current_time', args: { timezone: time }, label: 'Resolved live time.' };
      }

      const place = pickMatch([/^(?:find|search for|show me)\s+(.+?)\s+(?:near|in)\s+(.+)$/i]);
      if (place && /\b(restaurant|coffee|cafe|hotel|clinic|hospital|library|school|museum|landmark|shop|store|atm|bank|park)\b/i.test(place)) {
        const match = trimmed.match(/^(?:find|search for|show me)\s+(.+?)\s+(?:near|in)\s+(.+)$/i);
        return { tool: 'search_places', args: { query: stripTrailing(match[1]), near: stripTrailing(match[2]) }, label: 'Searched places.' };
      }

      if (/^(tell me a joke|another joke|daily humor)$/i.test(lower)) {
        return { tool: 'tell_joke', args: {}, label: 'Fetched a joke.' };
      }

      if (/^(give me some advice|words of wisdom|life advice)$/i.test(lower)) {
        return { tool: 'give_advice', args: {}, label: 'Fetched advice.' };
      }

      return null;
    };

    // ----------------------------------------------------
    // OFFLINE CAPABILITIES: SLASH COMMAND ROUTING
    // ----------------------------------------------------
    const slashMatch = prompt.match(/^\/([a-z]+)(?:\s+(.*))?/i);
    if (slashMatch) {
      const command = slashMatch[1].toLowerCase();
      const arg = slashMatch[2] || '';

      let toolToCall = null;
      let argsPayload = {};

      if (command === 'crypto') {
        toolToCall = 'get_crypto_price';
        argsPayload = { coin: arg || 'bitcoin' };
      } else if (command === 'web') {
        requestWebSearch = true;
        if (arg && payloadMessages.length > 0) {
          payloadMessages[payloadMessages.length - 1].content = `${arg}${projectContext || ''}`;
        }
      } else if (command === 'define' || command === 'dict') {
        toolToCall = 'define_word';
        argsPayload = { word: arg || 'intelligence' };
      } else if (command === 'reddit') {
        toolToCall = 'get_reddit_posts';
        argsPayload = { subreddit: arg || 'news' };
      } else if (command === 'weather') {
        toolToCall = 'get_weather';
        argsPayload = { city: arg || 'London' };
      } else if (command === 'space' || command === 'spacenews') {
        toolToCall = 'get_space_news';
        argsPayload = { topic: arg || '' };
      } else if (command === 'news' || command === 'headlines') {
        toolToCall = 'get_news_headlines';
        argsPayload = { topic: arg || 'top stories' };
      } else if (command === 'bible' || command === 'verse') {
        toolToCall = 'get_bible_verse';
        argsPayload = { reference: arg || 'John 3:16' };
      } else if (command === 'joke') {
        toolToCall = 'tell_joke';
        argsPayload = {};
      } else if (command === 'advice') {
        toolToCall = 'give_advice';
        argsPayload = {};
      } else if (command === 'currency' || command === 'convert') {
        const parts = arg.split(' ').map(p => p.trim()).filter(Boolean);
        toolToCall = 'convert_currency';
        const convertMatch = arg.match(/(\d+(?:\.\d+)?)\s*([a-z]{3})\s+(?:to|in|into)?\s*([a-z]{3})/i);
        argsPayload = convertMatch
          ? { amount: parseFloat(convertMatch[1]), from: convertMatch[2].toUpperCase(), to: convertMatch[3].toUpperCase() }
          : { amount: parseFloat(parts[0]) || 1, from: parts[1] || 'USD', to: (parts[2] || parts[3]) || 'EUR' };
      } else if (command === 'math') {
        toolToCall = 'solve_math';
        argsPayload = { expression: arg || '2+2', operation: 'simplify' };
      } else if (command === 'image') {
        toolToCall = 'search_images';
        argsPayload = { query: arg || 'beautiful landscape' };
      } else if (command === 'qr' || command === 'generateqr') {
        toolToCall = 'generate_qr';
        argsPayload = { data: arg || 'Atlas Intelligence' };
      } else if (command === 'scanqr' || command === 'qrscan') {
        toolToCall = 'scan_qr';
        argsPayload = {};
      } else if (command === 'ocr') {
        toolToCall = 'scan_ocr';
        argsPayload = {};
      } else if (command === 'time') {
        toolToCall = 'get_current_time';
        argsPayload = { timezone: arg || '' };
      } else if (command === 'unit') {
        const unitMatch = arg.match(/(-?\d+(?:\.\d+)?)\s*([a-zA-Z°/ ]{1,22})\s+(?:to|in|into)\s+([a-zA-Z°/ ]{1,22})/i);
        toolToCall = 'convert_units';
        argsPayload = unitMatch
          ? { value: parseFloat(unitMatch[1]), from: unitMatch[2].trim(), to: unitMatch[3].trim() }
          : { value: 1, from: 'km', to: 'miles' };
      } else if (command === 'places' || command === 'place') {
        const nearMatch = arg.match(/(.+?)\s+(?:near|in)\s+(.+)$/i);
        toolToCall = 'search_places';
        argsPayload = nearMatch
          ? { query: nearMatch[1].trim(), near: nearMatch[2].trim() }
          : { query: arg || 'coffee shop' };
      }

      if (toolToCall) {
        try {
          await runLocalWidget(toolToCall, argsPayload, `Executed local command \`/${command}\`.`);
          return;
        } catch (err) {
          // Fall through to standard error handler
          throw err;
        }
      }
    }
    // ----------------------------------------------------

    const localIntent = detectLocalWidgetIntent(prompt);
    if (localIntent) {
      try {
        await runLocalWidget(localIntent.tool, localIntent.args, localIntent.label);
        return;
      } catch (err) {
        throw err;
      }
    }

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(state.apiKey ? { 'X-OpenRouter-Key': state.apiKey } : {})
        },
        signal: state.abortController.signal,
        body: JSON.stringify({
          model: state.currentModel,
          messages: payloadMessages,
          stream: true,
          mode: state.activeMode,
          systemPrompt: state.systemPrompt,
          temperature: state.temperature,
          webSearch: requestWebSearch,
          reasoning: state.isDeepReasoning,
          maxTokens: 4096,
          apiKey: state.apiKey || undefined
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const customErr = new Error(errJson.error || 'Request failed');
        customErr.status = response.status;
        throw customErr;
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

            // Handle injected widget rendering directly in message
            if (parsed.__widget__) {
              if (statusAnimator) { statusAnimator.stop(); statusAnimator = null; }
              accumulatedWidgets.push(parsed.__widget__);
              if (window.atlasRenderWidget) {
                const widgetHtml = window.atlasRenderWidget(parsed.__widget__.type, parsed.__widget__.data);
                if (widgetHtml && widgetsContainer) {
                  const widgetBox = document.createElement('div');
                  widgetBox.className = 'widget-mount-point';
                  widgetBox.innerHTML = widgetHtml;
                  widgetsContainer.appendChild(widgetBox);
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

            if (rawReasoning) {
              if (statusAnimator) { statusAnimator.stop(); statusAnimator = null; }
              accumulatedReasoning += rawReasoning;
              setReasoning(accumulatedReasoning);
              scrollToBottom(false);
            }

            if (rawContent.includes('<think>')) {
              inThinkTag = true;
            }

            if (inThinkTag) {
              if (statusAnimator) { statusAnimator.stop(); statusAnimator = null; }
              if (rawContent.includes('</think>')) {
                inThinkTag = false;
                const parts = rawContent.split('</think>');
                accumulatedReasoning += parts[0].replace('<think>', '');
                accumulatedContent += parts[1] || '';
              } else {
                accumulatedReasoning += rawContent.replace('<think>', '');
              }
              setReasoning(accumulatedReasoning);
              scrollToBottom(false);
            } else if (rawContent) {
              if (statusAnimator) { statusAnimator.stop(); statusAnimator = null; }
              accumulatedContent += rawContent;

              const now = Date.now();
              if (now - lastRenderTime > 35) {
                lastRenderTime = now;
                bubble.innerHTML = parseMarkdownSafely(accumulatedContent, true);
                enhanceCodeBlocks(bubble);
                enhanceMathBlocks(bubble);
                scrollToBottom(false);
              }
            }
          } catch (jsonErr) {
            // Partial chunk ignored
          }
        }
      }

      if (statusAnimator) { statusAnimator.stop(); statusAnimator = null; }

      if (!accumulatedContent) {
        accumulatedContent = accumulatedReasoning || '*(The model returned an empty response. This usually happens due to a safety filter or a temporary model glitch. Please try again or switch to a different model.)*';
      }

      if (accumulatedReasoning) {
        setReasoning(accumulatedReasoning);
      }

      bubble.innerHTML = parseMarkdownSafely(accumulatedContent, false);
      enhanceCodeBlocks(bubble);
      renderMathSafely(bubble);

      session.messages.push({
        role: 'assistant',
        content: accumulatedContent,
        reasoning: accumulatedReasoning,
        widgets: accumulatedWidgets
      });
      session.updatedAt = new Date().toISOString();
      saveSessions();
      updateSessionMetrics();

    } catch (err) {
      if (statusAnimator) { statusAnimator.stop(); statusAnimator = null; }
      const errorInfo = formatUserFriendlyError(err, err.status);
      const errorHtml = renderErrorCard(errorInfo);
      if (accumulatedContent) {
        bubble.innerHTML = parseMarkdownSafely(accumulatedContent, false) + errorHtml;
      } else {
        bubble.innerHTML = errorHtml;
      }
    } finally {
      if (statusAnimator) { statusAnimator.stop(); statusAnimator = null; }
      state.isGenerating = false;
      if (stopGenerationBtn) stopGenerationBtn.style.display = 'none';
      if (sendBtn) sendBtn.style.display = 'flex';
      if (streamingIndicator) streamingIndicator.style.display = 'none';
      scrollToBottom(true);
    }
  }

  function formatUserFriendlyError(err, statusCode = null) {
    // 1. Offline State
    if (!navigator.onLine) {
      return {
        title: 'Connection Offline',
        desc: 'You appear to be offline. Please check your network connection.',
        action: 'We will send your chat when you reconnect.',
        type: 'offline',
        canRetry: true
      };
    }

    if (err && err.name === 'AbortError') {
      return {
        title: 'Investigation Halted',
        desc: 'Generation was stopped by user.',
        action: '',
        type: 'info',
        canRetry: false
      };
    }

    const raw = (err && (err.message || String(err))) || '';
    const lower = raw.toLowerCase();

    if (
      lower.includes('free-models-per-day') ||
      lower.includes('daily free reasoning quota') ||
      lower.includes('free tier daily') ||
      lower.includes('purchase credits to raise')
    ) {
      return {
        title: 'Daily Free Quota Reached',
        desc: 'The shared daily free reasoning quota has been reached (50 requests/day). It automatically resets at midnight UTC.',
        action: 'You can configure a custom OpenRouter key in Settings for immediate access.',
        type: 'warning',
        canRetry: false
      };
    }

    if (statusCode === 401 || lower.includes('api key not configured') || lower.includes('unauthorized') || lower.includes('invalid api key')) {
      return {
        title: 'API Key Required',
        desc: 'OpenRouter API key is missing or invalid.',
        action: 'You can supply your own OpenRouter key in Settings to continue.',
        type: 'warning',
        canRetry: false
      };
    }

    if (statusCode === 429 || lower.includes('rate limit') || lower.includes('too many requests')) {
      return {
        title: 'Rate Limit Reached',
        desc: 'You are sending messages too fast.',
        action: 'Please wait a few seconds before trying again.',
        type: 'warning',
        canRetry: true
      };
    }

    if (statusCode === 413 || lower.includes('payload too large')) {
      return {
        title: 'File Too Large',
        desc: 'This file is too large to be processed.',
        action: 'Choose a file under 25MB and try again.',
        type: 'warning',
        canRetry: false
      };
    }

    if (statusCode === 403 || lower.includes('unauthorized model') || lower.includes('not available')) {
      return {
        title: 'Model Unavailable',
        desc: 'This reasoning model is momentarily unavailable.',
        action: 'Please switch to another model from the menu.',
        type: 'warning',
        canRetry: false
      };
    }

    if (
      statusCode === 500 ||
      statusCode === 503 ||
      statusCode === 504 ||
      statusCode === 502 ||
      lower.includes('high demand') ||
      lower.includes('concurrency') ||
      lower.includes('overloaded') ||
      lower.includes('temporarily unavailable') ||
      lower.includes('timed out') ||
      lower.includes('timeout')
    ) {
      return {
        title: 'Engines Busy or Unreachable',
        desc: 'Our servers are resting or experiencing high demand.',
        action: 'Your message is saved. Please try your question again in a moment.',
        type: 'warning',
        canRetry: true
      };
    }

    if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network error') || lower.includes('load failed')) {
      return {
        title: 'Connection Interrupted',
        desc: 'Unable to reach the servers.',
        action: 'Check your internet connection and try again.',
        type: 'offline',
        canRetry: true
      };
    }

    if (statusCode === 400 && lower.includes('system prompt')) {
      return {
        title: 'Instructions Too Long',
        desc: 'Your custom instructions exceed the allowed character limit.',
        action: 'Please shorten them in Studio Parameters.',
        type: 'warning',
        canRetry: false
      };
    }

    return {
      title: 'Service Notice',
      desc: 'Something went wrong while processing your request.',
      action: 'Please try again shortly.',
      type: 'error',
      canRetry: true
    };
  }

  function renderErrorCard(errorInfo) {
    const icon = errorInfo.type === 'offline'
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.56 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    const retryBtn = errorInfo.canRetry
      ? `<button class="atlas-retry-btn" onclick="window.atlasRetryLast()" style="margin-top: 10px; padding: 6px 12px; background: var(--border-light); border: 1px solid var(--border-focus); border-radius: 4px; color: var(--text-main); font-family: inherit; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">${ICONS.retry} Try Again</button>`
      : '';

    const actionText = errorInfo.action ? `<div class="atlas-error-action" style="margin-top: 4px; font-weight: 500;">${escapeHtml(errorInfo.action)}</div>` : '';

    return `
      <div class="atlas-error-card ${errorInfo.type}">
        <div class="atlas-error-icon">${icon}</div>
        <div class="atlas-error-body">
          <div class="atlas-error-title">${escapeHtml(errorInfo.title)}</div>
          <div class="atlas-error-desc">${escapeHtml(errorInfo.desc)}</div>
          ${actionText}
          ${retryBtn}
        </div>
      </div>
    `;
  }

  // --- SMART RETRY ---
  window.atlasRetryLast = async function () {
    if (state.isGenerating) return;
    const session = getActiveSession();
    if (!session || session.messages.length === 0) return;

    const chatMessagesEl = document.getElementById('chatMessages');

    // If the last message is from the user, it means the assistant failed
    if (session.messages[session.messages.length - 1].role === 'user') {
      // Remove the failed assistant bubble from the DOM
      if (chatMessagesEl && chatMessagesEl.lastElementChild && chatMessagesEl.lastElementChild.classList.contains('assistant')) {
        chatMessagesEl.removeChild(chatMessagesEl.lastElementChild);
      }

      const lastUserMsg = session.messages.pop(); // Remove it temporarily
      messageInput.value = lastUserMsg.content; // Put it in the input
      handleChatSubmit(new Event('submit')); // Resubmit
    }
  };

  async function fetchSessionTitle(userPrompt, sessionId) {
    try {
      const res = await fetch(`${API_BASE}/api/title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(state.apiKey ? { 'X-OpenRouter-Key': state.apiKey } : {})
        },
        body: JSON.stringify({
          message: userPrompt,
          model: state.currentModel,
          apiKey: state.apiKey || undefined
        })
      });
      if (!res.ok) throw new Error(`Title request failed with status ${res.status}`);
      const data = await res.json();
      const title = typeof data.title === 'string' ? data.title.trim() : '';
      if (title) {
        const session = state.sessions.find(s => s.id === sessionId);
        if (session) {
          session.title = title;
          saveSessions();
          renderHistoryTree();
        }
      }
    } catch (e) { }
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    chatForm?.addEventListener('submit', handleChatSubmit);

    newChatBtn?.addEventListener('click', () => createNewSession());

    sidebarCollapseBtn?.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeMobileSidebar();
      } else {
        sidebar.classList.toggle('collapsed');
      }
    });

    sidebarToggleBtn?.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.toggle('mobile-open');
        sidebarBackdrop.classList.toggle('active', sidebar.classList.contains('mobile-open'));
      } else {
        sidebar.classList.toggle('collapsed');
      }
    });

    sidebarBackdrop?.addEventListener('click', closeMobileSidebar);

    historySearchInput?.addEventListener('input', (e) => {
      renderHistoryTree(e.target.value.trim());
    });

    modelPillTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      modelDropdownMenu?.classList.toggle('show');
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
          alert('Artifact copied to clipboard');
        });
      }
    });

    downloadCanvasBtn?.addEventListener('click', () => {
      if (!state.activeArtifact?.codeText) return;
      const ext = state.activeArtifact.language === 'javascript' ? 'js' : state.activeArtifact.language === 'python' ? 'py' : state.activeArtifact.language === 'html' ? 'html' : 'txt';
      const blob = new Blob([state.activeArtifact.codeText], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `atlas_artifact_${Date.now()}.${ext}`;
      a.click();
    });

    exportMenuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('exportMenuPopup')?.classList.toggle('show');
    });

    exportMarkdownBtn?.addEventListener('click', () => exportConversation('md'));
    exportJsonBtn?.addEventListener('click', () => exportConversation('json'));

    clearCurrentChatBtn?.addEventListener('click', () => {
      const session = getActiveSession();
      if (session && confirm('Clear all messages in this investigation?')) {
        session.messages = [];
        saveSessions();
        loadSession(session.id);
      }
    });

    deepThinkToggleBtn?.addEventListener('click', () => {
      state.isDeepReasoning = !state.isDeepReasoning;
      localStorage.setItem('omni_deep_reasoning', state.isDeepReasoning.toString());
      deepThinkToggleBtn.classList.toggle('active-web', state.isDeepReasoning);
    });

    webSearchToggleBtn?.addEventListener('click', () => {
      state.isWebSearch = !state.isWebSearch;
      localStorage.setItem('omni_web_search', state.isWebSearch.toString());
      syncWebSearchUI();
    });

    stopGenerationBtn?.addEventListener('click', () => {
      if (state.abortController) state.abortController.abort();
    });

    // Unified Attachments & Scanners Menu Toggle
    composerAttachBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = composerAttachMenu ? composerAttachMenu.hidden : true;
      if (composerAttachMenu) {
        composerAttachMenu.hidden = !isHidden;
        composerAttachBtn.setAttribute('aria-expanded', String(isHidden));
      }
    });

    // Close attach popup on outside click
    document.addEventListener('click', (e) => {
      if (composerAttachMenu && !composerAttachMenu.hidden) {
        if (!e.target.closest('.composer-attach-wrapper')) {
          composerAttachMenu.hidden = true;
          composerAttachBtn?.setAttribute('aria-expanded', 'false');
        }
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && composerAttachMenu && !composerAttachMenu.hidden) {
        composerAttachMenu.hidden = true;
        composerAttachBtn?.setAttribute('aria-expanded', 'false');
      }
    });

    // Flow 1: Attach Files
    attachOptionFile?.addEventListener('click', () => {
      if (composerAttachMenu) composerAttachMenu.hidden = true;
      composerAttachBtn?.setAttribute('aria-expanded', 'false');

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.html,.css,.js,.json,.md,.txt,.py,.ts,.jsx,.tsx,.csv,.xml,.yml,.yaml,.pdf';
      fileInput.multiple = true;
      fileInput.onchange = (e) => {
        const files = Array.from(e.target.files || []).filter(file => file.size <= 500000);
        if (!files.length) return;

        Promise.all(files.map(file => new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve({
            path: file.webkitRelativePath || file.name,
            content: String(reader.result || '')
          });
          reader.onerror = () => resolve(null);
          reader.readAsText(file);
        }))).then(importedFiles => {
          const validFiles = importedFiles.filter(Boolean);
          if (validFiles.length) {
            const existing = state.projectFiles || [];
            const combined = [...existing, ...validFiles];
            const seen = new Set();
            state.projectFiles = combined.filter(f => {
              if (seen.has(f.path)) return false;
              seen.add(f.path);
              return true;
            }).sort((a, b) => a.path.localeCompare(b.path));
            syncProjectContextUI();
          }
        });
      };
      fileInput.click();
    });

    // Flow 2: Scan QR Code
    attachOptionQR?.addEventListener('click', () => {
      if (composerAttachMenu) composerAttachMenu.hidden = true;
      composerAttachBtn?.setAttribute('aria-expanded', 'false');
      document.dispatchEvent(new CustomEvent('atlas:open-qr-scanner'));
    });

    // Flow 3: Extract Text (OCR)
    attachOptionOCR?.addEventListener('click', () => {
      if (composerAttachMenu) composerAttachMenu.hidden = true;
      composerAttachBtn?.setAttribute('aria-expanded', 'false');
      document.dispatchEvent(new CustomEvent('atlas:open-ocr'));
    });

    document.addEventListener('atlas:ocr-result', (e) => {
      if (messageInput) {
        messageInput.value = (messageInput.value ? messageInput.value + '\n\n' : '') + e.detail;
        autoResizeTextarea();
        messageInput.focus();
      }
    });

    document.addEventListener('atlas:qr-result', (e) => {
      if (messageInput) {
        const prefix = messageInput.value ? messageInput.value + '\n\n' : '';
        messageInput.value = `${prefix}QR result:\n\n${e.detail}`;
        autoResizeTextarea();
        messageInput.focus();
      }
    });

    clearProjectContextBtn?.addEventListener('click', () => {
      state.projectFiles = [];
      syncProjectContextUI();
    });

    openSysPromptModalBtn?.addEventListener('click', () => openUnifiedSettings('studio-parameters'));
    settingsSidebarBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = sidebarProfileMenu && !sidebarProfileMenu.hidden;
      if (sidebarProfileMenu) {
        sidebarProfileMenu.hidden = isOpen;
      }
      if (settingsSidebarBtn) {
        settingsSidebarBtn.setAttribute('aria-expanded', String(!isOpen));
      }
    });
    profileSettingsBtn?.addEventListener('click', () => {
      if (sidebarProfileMenu) sidebarProfileMenu.hidden = true;
      if (settingsSidebarBtn) settingsSidebarBtn.setAttribute('aria-expanded', 'false');
      openUnifiedSettings('general-settings');
    });
    closeUnifiedSettingsBtn?.addEventListener('click', () => closeUnifiedSettings());

    // Settings Navigation Tabs Logic
    settingsNavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        // Update active states for tabs
        settingsNavBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update active states for panes
        settingsPanes.forEach(pane => pane.classList.remove('active'));
        const activePane = document.getElementById(`pane-${targetTab}`);
        if (activePane) activePane.classList.add('active');

        // Update header text based on selected tab
        if (activeSettingsTitle && activeSettingsDesc) {
          if (targetTab === 'studio-parameters') {
            activeSettingsTitle.textContent = 'Personalization';
            activeSettingsDesc.textContent = 'Configure model instructions, temperature, and domain presets';
          } else if (targetTab === 'general-settings') {
            activeSettingsTitle.textContent = 'General';
            activeSettingsDesc.textContent = 'Manage your application data and preferences';
          }
        }
      });
    });

    saveProfileNameBtn?.addEventListener('click', () => {
      const nextName = (accountNameInput?.value || '').trim() || 'Your Name';
      state.accountName = nextName;
      localStorage.setItem('atlas_account_name', nextName);
      syncSidebarProfileUI();
      if (accountNameInput) accountNameInput.value = nextName;
    });

    saveGeneralSettingsBtn?.addEventListener('click', () => {
      const nextName = (accountNameInput?.value || '').trim() || 'Your Name';
      const nextApiKey = (customApiKeyInput?.value || '').trim();
      const nextVoiceName = defaultVoiceSelect?.value || '';

      state.accountName = nextName;
      state.apiKey = nextApiKey;
      state.defaultVoiceName = nextVoiceName;
      localStorage.setItem('atlas_account_name', nextName);
      localStorage.setItem('atlas_default_voice', nextVoiceName);

      if (nextApiKey) {
        localStorage.setItem('atlas_openrouter_api_key', nextApiKey);
      } else {
        localStorage.removeItem('atlas_openrouter_api_key');
      }

      syncSidebarProfileUI();
      if (apiKeyStatusHint) {
        apiKeyStatusHint.textContent = nextApiKey
          ? 'Custom API key saved and active.'
          : 'Custom key cleared. Default server key active.';
        apiKeyStatusHint.style.display = 'block';
      }
      if (voiceStatusHint) {
        voiceStatusHint.textContent = nextVoiceName ? 'Voice preference saved.' : 'Browser default voice saved.';
      }

      const originalText = saveGeneralSettingsBtn.textContent;
      saveGeneralSettingsBtn.textContent = 'Saved';
      setTimeout(() => {
        saveGeneralSettingsBtn.textContent = originalText;
        closeUnifiedSettings();
      }, 700);
    });

    saveApiKeyBtn?.addEventListener('click', () => {
      const val = (customApiKeyInput?.value || '').trim();
      state.apiKey = val;
      if (val) {
        localStorage.setItem('atlas_openrouter_api_key', val);
        if (apiKeyStatusHint) {
          apiKeyStatusHint.textContent = 'Custom API key saved and active.';
          apiKeyStatusHint.style.display = 'block';
        }
      } else {
        localStorage.removeItem('atlas_openrouter_api_key');
        if (apiKeyStatusHint) {
          apiKeyStatusHint.textContent = 'Custom key cleared. Default server key active.';
          apiKeyStatusHint.style.display = 'block';
        }
      }
    });

    clearAllDataBtn?.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all chats and clear all local storage? This action cannot be undone.')) {
        localStorage.clear();
        state.sessions = [];
        state.activeSessionId = null;
        if (typeof saveSessions === 'function') saveSessions();
        window.location.reload();
      }
    });

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
      customSystemPrompt.value = PERSONA_PRESETS.auto;
    });

    temperatureSlider?.addEventListener('input', (e) => {
      if (tempValBadge) tempValBadge.textContent = e.target.value;
    });

    saveSettingsBtn?.addEventListener('click', () => {
      state.systemPrompt = customSystemPrompt.value.trim();
      state.temperature = parseFloat(temperatureSlider.value);
      state.defaultVoiceName = defaultVoiceSelect ? defaultVoiceSelect.value : '';
      localStorage.setItem('omni_sys_prompt', state.systemPrompt);
      localStorage.setItem('omni_preset', state.activePreset);
      localStorage.setItem('omni_temp', state.temperature.toString());
      localStorage.setItem('atlas_default_voice', state.defaultVoiceName);
      updateActivePromptLabel();

      const originalText = saveSettingsBtn.textContent;
      saveSettingsBtn.textContent = 'Applied';
      setTimeout(() => {
        saveSettingsBtn.textContent = originalText;
        closeUnifiedSettings();
      }, 200);
    });

    unifiedSettingsModal?.addEventListener('click', (e) => {
      if (e.target === unifiedSettingsModal) {
        closeUnifiedSettings();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && unifiedSettingsModal?.classList.contains('show')) {
        closeUnifiedSettings();
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.model-dropdown-capsule')) {
        modelDropdownMenu?.classList.remove('show');
      }
      if (!e.target.closest('.export-dropdown-wrapper')) {
        document.getElementById('exportMenuPopup')?.classList.remove('show');
      }
      const msgImg = e.target.closest('.message-bubble img');
      if (msgImg) {
        e.preventDefault();
        if (window.atlasOpenLightbox) {
          window.atlasOpenLightbox(msgImg.src, msgImg.alt || 'Visual reference', '', 'Visual Reference');
        }
      }
    });

    // Offline / Online Connection State Listeners
    const offlineBanner = document.getElementById('offlineBanner');
    window.addEventListener('offline', () => {
      if (offlineBanner) offlineBanner.style.display = 'flex';
    });
    window.addEventListener('online', () => {
      if (offlineBanner) offlineBanner.style.display = 'none';
    });

    messageInput?.addEventListener('input', (e) => {
      if (typeof autoResizeTextarea === 'function') autoResizeTextarea(e);
      handleSlashCommandInput(e);
    });

    let slashSelectedIndex = 0;

    messageInput?.addEventListener('keydown', (e) => {
      const popup = document.getElementById('slashCommandsPopup');
      const isPopupVisible = popup && popup.style.display === 'flex';

      if (isPopupVisible) {
        const items = popup.querySelectorAll('.slash-command-item');
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          slashSelectedIndex = (slashSelectedIndex + 1) % items.length;
          updateSlashCommandSelection(items);
          return;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          slashSelectedIndex = (slashSelectedIndex - 1 + items.length) % items.length;
          updateSlashCommandSelection(items);
          return;
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (items[slashSelectedIndex]) {
            items[slashSelectedIndex].click();
          }
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          popup.style.display = 'none';
          return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!state.isGenerating && messageInput.value.trim().length > 0) {
          chatForm.dispatchEvent(new Event('submit'));
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        createNewSession();
      }
    });

    function updateSlashCommandSelection(items) {
      items.forEach((item, index) => {
        if (index === slashSelectedIndex) {
          item.classList.add('selected');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('selected');
        }
      });
    }

    const availableSlashCommands = [
      { cmd: '/web', desc: 'Search the web for current information', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>' },
      { cmd: '/image', desc: 'Search visual references', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>' },
      { cmd: '/analyze', desc: 'Deep analysis of uploaded files', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' },
      { cmd: '/code', desc: 'Generate advanced codebase', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>' },
      { cmd: '/reddit', desc: 'Search Reddit discussions', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
      { cmd: '/crypto', desc: 'Check live crypto prices', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 6v2"/><path d="M12 16v2"/></svg>' },
      { cmd: '/weather', desc: 'Get local weather forecasts', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>' },
      { cmd: '/news', desc: 'Get latest general headlines', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>' },
      { cmd: '/space', desc: 'Get space and NASA intelligence', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 3-2 3s1.74-.5 3-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>' },
      { cmd: '/math', desc: 'Solve mathematical equations', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>' },
      { cmd: '/convert', desc: 'Convert currency values', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>' },
      { cmd: '/unit', desc: 'Convert measurements', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>' },
      { cmd: '/time', desc: 'Resolve live time and date', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
      { cmd: '/places', desc: 'Search places and landmarks', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' },
      { cmd: '/define', desc: 'Get precise dictionary definitions', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>' },
      { cmd: '/bible', desc: 'Look up Bible verses', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M12 8v6"/><path d="M10 10h4"/></svg>' },
      { cmd: '/joke', desc: 'Hear a joke or humor', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>' },
      { cmd: '/advice', desc: 'Get wisdom and advice', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>' },
      { cmd: '/qr', desc: 'Generate branded QR code', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01"></path></svg>' },
      { cmd: '/scanqr', desc: 'Scan QR code via camera or file', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01"></path></svg>' },
      { cmd: '/ocr', desc: 'Extract text from images', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>' },
      { cmd: '/clear', desc: 'Clear conversation history', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>' },
      { cmd: '/exit', desc: 'Exit to new session', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>' },
      { cmd: '/settings', desc: 'Open unified settings', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>' }
    ];

    function handleSlashCommandInput(e) {
      const val = messageInput.value;
      const popup = document.getElementById('slashCommandsPopup');
      if (!popup) return;

      if (val.startsWith('/')) {
        const query = val.toLowerCase();
        const filtered = availableSlashCommands.filter(c => c.cmd.startsWith(query));

        if (filtered.length > 0) {
          popup.innerHTML = '';
          filtered.forEach((cmd, idx) => {
            const item = document.createElement('div');
            item.className = 'slash-command-item' + (idx === 0 ? ' selected' : '');
            item.innerHTML = `
              <div class="slash-command-icon">${cmd.icon}</div>
              <div class="slash-command-info">
                <span class="slash-command-name">${cmd.cmd}</span>
                <span class="slash-command-desc">${cmd.desc}</span>
              </div>
            `;
            item.addEventListener('click', () => {
              messageInput.value = cmd.cmd + ' ';
              messageInput.focus();
              popup.style.display = 'none';
            });
            item.addEventListener('mouseenter', () => {
              slashSelectedIndex = idx;
              updateSlashCommandSelection(popup.querySelectorAll('.slash-command-item'));
            });
            popup.appendChild(item);
          });
          slashSelectedIndex = 0;
          popup.style.display = 'flex';
        } else {
          popup.style.display = 'none';
        }
      } else {
        popup.style.display = 'none';
      }
    }
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('mobile-open');
    sidebarBackdrop.classList.remove('active');
  }

  function updateActivePromptLabel() {
    if (!activePromptLabel) return;
    const presetNames = {
      scientist: 'Scientist',
      mathematician: 'Math',
      engineer: 'Engineer',
      builder: 'Builder',
      reasoner: 'Reasoner',
      concise: 'Concise'
    };
    activePromptLabel.textContent = presetNames[state.activePreset] || 'Personalization';
  }

  function syncWebSearchUI() {
    if (!webSearchToggleBtn) return;
    webSearchToggleBtn.classList.toggle('active-web', state.isWebSearch);
    if (webSearchLabel) {
      webSearchLabel.textContent = state.isWebSearch ? 'Web Active' : 'Web Off';
    }
  }

  function syncSidebarProfileUI() {
    const displayName = (state.accountName || '').trim() || 'Your Name';
    const initials = displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'U';

    if (sidebarProfileAvatar) sidebarProfileAvatar.textContent = initials;
    if (profileMenuAvatar) profileMenuAvatar.textContent = initials;
    if (profileMenuName) profileMenuName.textContent = displayName;
    if (accountNameInput) accountNameInput.value = displayName;
  }

  function syncProjectContextUI() {
    const fileCount = state.projectFiles.length;
    if (projectContextBar) projectContextBar.hidden = fileCount === 0;
    if (projectContextLabel) {
      projectContextLabel.textContent = fileCount
        ? `${fileCount} file${fileCount === 1 ? '' : 's'} attached for analysis`
        : 'Attached files';
    }
  }

  function buildProjectContext() {
    if (!state.projectFiles.length) return '';
    const maxContextCharacters = 120000;
    let usedCharacters = 0;
    const files = state.projectFiles.map(file => {
      const section = `\n--- ${file.path} ---\n${file.content}\n--- End ${file.path} ---`;
      if (usedCharacters + section.length > maxContextCharacters) return '';
      usedCharacters += section.length;
      return section;
    }).join('');
    return `\n\nPROJECT CONTEXT\nThe user supplied the website files below. Analyze the existing implementation before changing it. If a change is requested, respond with an approval-ready unified diff, list the affected files, and explain how to apply it. Do not invent files or claim that changes were applied. Files larger than the context limit are omitted; ask the user to import only the relevant files when needed.${files}`;
  }

  function populateVoiceOptions() {
    if (!defaultVoiceSelect) return;

    const voices = 'speechSynthesis' in window && window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    const currentValue = state.defaultVoiceName || '';

    defaultVoiceSelect.innerHTML = '';

    const browserDefaultOption = document.createElement('option');
    browserDefaultOption.value = '';
    browserDefaultOption.textContent = 'Use browser default';
    defaultVoiceSelect.appendChild(browserDefaultOption);

    voices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.name;
      option.textContent = `${voice.name} (${voice.lang})`;
      defaultVoiceSelect.appendChild(option);
    });

    if (voices.length === 0) {
      const loadingOption = document.createElement('option');
      loadingOption.value = '';
      loadingOption.textContent = 'Voice list not ready yet';
      defaultVoiceSelect.appendChild(loadingOption);
    }

    const selectedVoiceExists = voices.some(voice => voice.name === currentValue);
    defaultVoiceSelect.value = selectedVoiceExists ? currentValue : '';
    if (voiceStatusHint) {
      voiceStatusHint.textContent = currentValue && !selectedVoiceExists
        ? 'Saved voice is unavailable in this browser. Choose another voice or use the browser default.'
        : '';
    }
  }

  function openUnifiedSettings(defaultTab = 'studio-parameters') {
    // Populate Studio Parameters
    if (customSystemPrompt) customSystemPrompt.value = state.systemPrompt;
    if (temperatureSlider) temperatureSlider.value = state.temperature;
    if (tempValBadge) tempValBadge.textContent = state.temperature;
    if (presetPills) presetPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-preset') === state.activePreset));

    // Populate General Settings
    if (customApiKeyInput) customApiKeyInput.value = state.apiKey || '';
    if (apiKeyStatusHint) {
      apiKeyStatusHint.style.display = state.apiKey ? 'block' : 'none';
      apiKeyStatusHint.textContent = state.apiKey ? 'Custom key active in this browser.' : '';
    }
    if (accountNameInput) accountNameInput.value = (state.accountName || '').trim() || 'Your Name';
    populateVoiceOptions();

    // Select the default tab
    const tabToSelect = Array.from(settingsNavBtns).find(btn => btn.getAttribute('data-tab') === defaultTab);
    if (tabToSelect) {
      tabToSelect.click();
    }

    unifiedSettingsModal?.classList.add('show');
  }

  function closeUnifiedSettings() {
    unifiedSettingsModal?.classList.remove('show');
  }

  document.addEventListener('click', (event) => {
    if (sidebarProfileMenu && !event.target.closest('.sidebar-profile-wrapper') && !event.target.closest('.profile-settings-btn')) {
      sidebarProfileMenu.hidden = true;
      if (settingsSidebarBtn) settingsSidebarBtn.setAttribute('aria-expanded', 'false');
    }
  });

  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = populateVoiceOptions;
  }

  populateVoiceOptions();

  function loadSavedSettings() {
    syncWebSearchUI();
    syncSidebarProfileUI();
    updateActivePromptLabel();
    if (deepThinkToggleBtn) {
      deepThinkToggleBtn.classList.toggle('active-web', state.isDeepReasoning);
    }
  }

  function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + 'px';
  }

  function scrollToBottom(force = false) {
    if (!messagesContainer) return;
    const distanceFromBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
    // Only auto-scroll if user is near bottom (within 150px) or force is true
    if (force || distanceFromBottom < 150) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  function exportConversation(format) {
    const session = getActiveSession();
    if (!session || session.messages.length === 0) {
      alert('No messages to export.');
      return;
    }

    let dataStr = '';
    let filename = `atlas_investigation_${Date.now()}.${format}`;

    if (format === 'json') {
      dataStr = JSON.stringify(session, null, 2);
    } else {
      dataStr = `# ${session.title}\n\n*Exported from Atlas Reasoning Studio on ${new Date().toLocaleString()}*\n\n---\n\n`;
      session.messages.forEach(m => {
        dataStr += `### ${m.role.toUpperCase()}\n\n${m.content}\n\n`;
        if (m.reasoning) {
          dataStr += `> **Reasoning**:\n> ${m.reasoning.replace(/\n/g, '\n> ')}\n\n`;
        }
      });
    }

    const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  // Start initialization
  init();
});
