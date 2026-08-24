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
      id: 'stealth/ox-alpha',
      name: 'Atlas Reasoning Core',
      badge: '1.05M',
      isFree: true,
      context: '1,048,576 tokens',
      desc: 'Advanced reasoning model for deep mathematical derivation, multi-step proofs, and sustained investigative work.'
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
  const clearAllDataBtn = document.getElementById('clearAllDataBtn');
  const customApiKeyInput = document.getElementById('customApiKeyInput');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const apiKeyStatusHint = document.getElementById('apiKeyStatusHint');

  // Persona Presets for Domain Intelligence
  const PERSONA_PRESETS = {
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
    activeMode: localStorage.getItem('atlas_mode') || 'research',
    systemPrompt: localStorage.getItem('omni_sys_prompt') || PERSONA_PRESETS.scientist,
    activePreset: localStorage.getItem('omni_preset') || 'scientist',
    temperature: parseFloat(localStorage.getItem('omni_temp') || '0.7'),
    isDeepReasoning: localStorage.getItem('omni_deep_reasoning') === 'true',
    isWebSearch: localStorage.getItem('omni_web_search') === 'true',
    sessions: initialSessions,
    activeSessionId: null,
    isGenerating: false,
    abortController: null,
    activeArtifact: null,
    lastUserPrompt: ''
  };

  // Configure marked with rich typography extensions
  if (window.marked) {
    const customRenderer = new marked.Renderer();

    // Table renderer supporting both object tokens (marked v12+) and classic string arguments
    customRenderer.table = function(header, body) {
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
    customRenderer.link = function(href, title, text) {
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
    const mode = INVESTIGATION_MODES[modeId] || INVESTIGATION_MODES.research;

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
          actionElem.textContent = "Let's dive deep into the problem.";
        } else if (hour >= 5 && hour < 9) {
          actionElem.textContent = "where shall we begin today's research?";
        } else if (hour >= 9 && hour < 12) {
          actionElem.textContent = 'what are we investigating today?';
        } else if (hour >= 12 && hour < 17) {
          actionElem.textContent = 'what challenge shall we tackle?';
        } else {
          actionElem.textContent = 'synthesizing research or starting new inquiries?';
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
      title: 'New Investigation',
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
    const filtered = validSessions.filter(s =>
      !query || s.title.toLowerCase().includes(query) || (s.messages && s.messages.some(m => m.content && m.content.toLowerCase().includes(query)))
    );

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
      item.innerHTML = `
        <span class="history-item-title">${escapeHtml(session.title)}</span>
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
      renderMessageItem(msg.role, msg.content, msg.reasoning, false, msg.widgets || []);
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

  function renderMessageItem(role, content = '', reasoning = '', shouldScroll = true, widgets = []) {
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
      
      speakBtn.addEventListener('click', () => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(bubble.innerText);
          window.speechSynthesis.speak(utterance);
        }
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
        }).catch(() => {});
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
        <button class="copy-code-btn" type="button">Copy</button>
      `;

      header.querySelector('.copy-code-btn')?.addEventListener('click', (e) => {
        navigator.clipboard.writeText(codeText).then(() => {
          e.target.textContent = 'Copied';
          setTimeout(() => { e.target.textContent = 'Copy'; }, 1500);
        });
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

    messageInput.value = '';
    autoResizeTextarea();

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

    session.messages.push({ role: 'user', content: prompt });
    session.updatedAt = new Date().toISOString();
    saveSessions();
    renderHistoryTree();

    renderMessageItem('user', prompt, '', true);
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

    let accumulatedContent = '';
    let accumulatedReasoning = '';
    let accumulatedWidgets = [];
    let inThinkTag = false;
    let lastRenderTime = 0;

    state.abortController = new AbortController();

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
        argsPayload = { topic: arg || 'astronomy' };
      } else if (command === 'bible' || command === 'verse') {
        toolToCall = 'get_bible_verse';
        argsPayload = { reference: arg || 'John 3:16' };
      } else if (command === 'joke') {
        toolToCall = 'tell_joke';
        argsPayload = {};
      } else if (command === 'advice') {
        toolToCall = 'give_advice';
        argsPayload = {};
      }
      
      if (toolToCall) {
        try {
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
          
          bubble.innerHTML = parseMarkdownSafely(`Executed local command \`/${command}\`.`, false);
          
          session.messages.push({
            role: 'assistant',
            content: `Executed local command \`/${command}\`.`,
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
          return; // Skip LLM call entirely
        } catch (err) {
           // Fall through to standard error handler
           throw err;
        }
      }
    }
    // ----------------------------------------------------

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
          webSearch: state.isWebSearch,
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
  window.atlasRetryLast = async function() {
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
      const data = await res.json();
      if (data.title) {
        const session = state.sessions.find(s => s.id === sessionId);
        if (session) {
          session.title = data.title;
          saveSessions();
          renderHistoryTree();
        }
      }
    } catch (e) {}
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

    const ocrTriggerBtn = document.getElementById('ocrTriggerBtn');
    ocrTriggerBtn?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('atlas:open-ocr'));
    });

    document.addEventListener('atlas:ocr-result', (e) => {
      messageInput.value = (messageInput.value + '\n\n' + e.detail).trim();
      autoResizeTextarea();
      messageInput.focus();
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
            messageInput.value += `\n\n--- Attachment: ${file.name} ---\n${evt.target.result}\n--- End Attachment ---\n`;
            autoResizeTextarea();
          };
          reader.readAsText(file);
        }
      };
      fileInput.click();
    });

    openSysPromptModalBtn?.addEventListener('click', () => openUnifiedSettings('studio-parameters'));
    settingsSidebarBtn?.addEventListener('click', () => openUnifiedSettings('studio-parameters'));
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

    messageInput?.addEventListener('input', autoResizeTextarea);
    messageInput?.addEventListener('keydown', (e) => {
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

  function loadSavedSettings() {
    syncWebSearchUI();
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
