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
  const systemPromptModal = document.getElementById('systemPromptModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const customSystemPrompt = document.getElementById('customSystemPrompt');
  const resetModalPromptBtn = document.getElementById('resetModalPromptBtn');
  const temperatureSlider = document.getElementById('temperatureSlider');
  const tempValBadge = document.getElementById('tempValBadge');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const presetPills = document.querySelectorAll('.preset-pill');
  const systemPromptDrawerBtn = document.getElementById('systemPromptDrawerBtn');

  // General Settings Modal
  const generalSettingsModal = document.getElementById('generalSettingsModal');
  const generalSettingsSidebarBtn = document.getElementById('generalSettingsSidebarBtn');
  const closeGeneralSettingsBtn = document.getElementById('closeGeneralSettingsBtn');
  const clearAllDataBtn = document.getElementById('clearAllDataBtn');

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
    if (activePromptLabel) activePromptLabel.textContent = mode.name;

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
    const newSession = {
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      title: 'New Investigation',
      mode: state.activeMode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };

    state.sessions.unshift(newSession);
    saveSessions();
    loadSession(newSession.id);
    renderHistoryTree();

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
    localStorage.setItem('atlas_investigations', JSON.stringify(state.sessions));
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
    const filtered = state.sessions.filter(s =>
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
    if (state.activeSessionId === sessionId) {
      if (state.sessions.length > 0) loadSession(state.sessions[0].id);
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

    // Reasoning accordion (if any reasoning is provided)
    if (role === 'assistant' && reasoning) {
      const details = document.createElement('details');
      details.className = 'reasoning-accordion';
      details.innerHTML = `
        <summary>Reasoning Chain</summary>
        <div class="reasoning-body">${escapeHtml(reasoning)}</div>
      `;
      wrapper.appendChild(details);
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

    return { row, bubble, wrapper, widgetsContainer };
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
          throwOnError: false
        });
      } catch (e) {
        console.warn('[KaTeX]', e);
      }
    }
  }

  function parseMarkdownSafely(raw, isStreaming = false) {
    if (!raw) return isStreaming ? '<span class="streaming-caret" aria-hidden="true"></span>' : '';
    let html = window.marked ? marked.parse(raw) : escapeHtml(raw);
    if (window.DOMPurify) {
      html = DOMPurify.sanitize(html, {
        ADD_TAGS: ['kbd', 'mark', 'details', 'summary', 'svg', 'path', 'circle', 'line', 'polyline', 'polygon', 'rect'],
        ADD_ATTR: ['target', 'disabled', 'checked', 'type', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'd', 'points', 'width', 'height', 'aria-hidden']
      });
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

    // Prepare assistant message bubble
    const { bubble, wrapper, widgetsContainer } = renderMessageItem('assistant', '', '', true);
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
              accumulatedReasoning += rawReasoning;
            }

            if (rawContent.includes('<think>')) {
              inThinkTag = true;
            }

            if (inThinkTag) {
              if (rawContent.includes('</think>')) {
                inThinkTag = false;
                const parts = rawContent.split('</think>');
                accumulatedReasoning += parts[0].replace('<think>', '');
                accumulatedContent += parts[1] || '';
              } else {
                accumulatedReasoning += rawContent.replace('<think>', '');
              }
            } else if (rawContent) {
              accumulatedContent += rawContent;

              const now = Date.now();
              if (now - lastRenderTime > 35) {
                lastRenderTime = now;
                bubble.innerHTML = parseMarkdownSafely(accumulatedContent, true);
                enhanceCodeBlocks(bubble);
                scrollToBottom(false);
              }
            }
          } catch (jsonErr) {
            // Partial chunk ignored
          }
        }
      }

      if (!accumulatedContent) {
        accumulatedContent = accumulatedReasoning || '(Empty response received)';
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
      const errorInfo = formatUserFriendlyError(err, err.status);
      const errorHtml = renderErrorCard(errorInfo);
      if (accumulatedContent) {
        bubble.innerHTML = parseMarkdownSafely(accumulatedContent, false) + errorHtml;
      } else {
        bubble.innerHTML = errorHtml;
      }
    } finally {
      state.isGenerating = false;
      if (stopGenerationBtn) stopGenerationBtn.style.display = 'none';
      if (sendBtn) sendBtn.style.display = 'flex';
      if (streamingIndicator) streamingIndicator.style.display = 'none';
      scrollToBottom(true);
    }
  }

  function formatUserFriendlyError(err, statusCode = null) {
    if (!navigator.onLine) {
      return {
        title: 'Connection Offline',
        desc: 'You appear to be offline. Please check your network connection.',
        type: 'offline'
      };
    }

    if (err && err.name === 'AbortError') {
      return {
        title: 'Investigation Halted',
        desc: 'Generation was stopped by user.',
        type: 'info'
      };
    }

    const raw = (err && (err.message || String(err))) || '';
    const lower = raw.toLowerCase();

    if (statusCode === 429 || lower.includes('rate limit') || lower.includes('too many requests')) {
      return {
        title: 'Rate Limit Reached',
        desc: 'You are sending requests a bit too quickly. Please wait a few moments before trying again.',
        type: 'warning'
      };
    }

    if (statusCode === 403 || lower.includes('unauthorized model') || lower.includes('not available')) {
      return {
        title: 'Model Unavailable',
        desc: 'This reasoning model is momentarily unavailable. Please switch to another model from the menu.',
        type: 'warning'
      };
    }

    if (
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
        title: 'Engines Busy',
        desc: 'The reasoning engines are currently experiencing high demand. Please try your question again in a moment.',
        type: 'warning'
      };
    }

    if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network error') || lower.includes('load failed')) {
      return {
        title: 'Connection Interrupted',
        desc: 'Unable to reach the server. Please verify your internet connection and try again.',
        type: 'offline'
      };
    }

    if (statusCode === 400 && lower.includes('system prompt')) {
      return {
        title: 'Instructions Too Long',
        desc: 'Your custom instructions exceed the allowed character limit. Please shorten them in Studio Parameters.',
        type: 'warning'
      };
    }

    return {
      title: 'Service Notice',
      desc: 'Unable to complete this step right now. Please try again shortly.',
      type: 'error'
    };
  }

  function renderErrorCard(errorInfo) {
    const icon = errorInfo.type === 'offline'
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.56 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    return `
      <div class="atlas-error-card ${errorInfo.type}">
        <div class="atlas-error-icon">${icon}</div>
        <div class="atlas-error-body">
          <div class="atlas-error-title">${escapeHtml(errorInfo.title)}</div>
          <div class="atlas-error-desc">${escapeHtml(errorInfo.desc)}</div>
        </div>
      </div>
    `;
  }

  async function fetchSessionTitle(userPrompt, sessionId) {
    try {
      const res = await fetch(`${API_BASE}/api/title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userPrompt })
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

    openSysPromptModalBtn?.addEventListener('click', () => openSettingsModal());
    systemPromptDrawerBtn?.addEventListener('click', () => openSettingsModal());
    closeModalBtn?.addEventListener('click', () => closeSettingsModal());

    generalSettingsSidebarBtn?.addEventListener('click', () => {
      generalSettingsModal?.classList.add('show');
    });

    closeGeneralSettingsBtn?.addEventListener('click', () => {
      generalSettingsModal?.classList.remove('show');
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
      closeSettingsModal();
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

  function syncWebSearchUI() {
    if (!webSearchToggleBtn) return;
    webSearchToggleBtn.classList.toggle('active-web', state.isWebSearch);
    if (webSearchLabel) {
      webSearchLabel.textContent = state.isWebSearch ? 'Web Active' : 'Web Off';
    }
  }

  function openSettingsModal() {
    customSystemPrompt.value = state.systemPrompt;
    temperatureSlider.value = state.temperature;
    if (tempValBadge) tempValBadge.textContent = state.temperature;
    presetPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-preset') === state.activePreset));
    systemPromptModal.classList.add('show');
  }

  function closeSettingsModal() {
    systemPromptModal.classList.remove('show');
  }

  function loadSavedSettings() {
    syncWebSearchUI();
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
