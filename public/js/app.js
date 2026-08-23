/**
 * Atlas — AI Chat Studio by Vylex Technologies
 * https://vylex.co.za
 * Multi-model workspace with SSE streaming, chain-of-thought reasoning,
 * animated pipeline verbs, auto AI conversation naming,
 * and production-grade resilient error diagnostics.
 */

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = (window.location.protocol.startsWith('http'))
    ? window.location.origin
    : 'http://localhost:3000';

  // Deep Reasoning & Cognitive Architecture Verbs (for Chat Response Bubble)
  const THOUGHT_VERBS = [
    'Extrapolating Latent Space',
    'Formulating Architectural Proof',
    'Deconstructing Logical Constraints',
    'Computing Self-Attention Vectors',
    'Evaluating Algorithmic Trade-offs',
    'Synthesizing Structural Proof',
    'Traversing Semantic Knowledge Graph',
    'Validating Edge Case Invariants',
    'Deriving Formal Proof Steps',
    'Refining Abstract Syntax Trees',
    'Decomposing Distributed Topologies',
    'Optimizing Execution Complexity',
    'Reconstructing Context Dependency',
    'Verifying Type Soundness & Contracts',
    'Resolving Multi-Step Deductions'
  ];

  // Real-Time Token Generation & Telemetry Verbs (for Input Bar Streaming Indicator)
  const STREAMING_VERBS = [
    'Streaming Token Pipeline',
    'Decoding Vector Embeddings',
    'Sampling Token Probabilities',
    'Transmitting SSE Chunks',
    'Broadcasting Model Output',
    'Pipelining Frontier Inference',
    'Synchronizing Stream Buffer',
    'Rendering Markdown AST',
    'Synthesizing Response Stream',
    'Parsing Delimiter Stream',
    'Optimizing Throughput Rate',
    'Flushing Telemetry Stream'
  ];

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
      id: 'openrouter/free', // We keep the internal ID identical so backend still works
      name: 'Atlas Default Engine',
      badge: 'AUTO FREE',
      isFree: true,
      context: 'Dynamic context',
      desc: 'Smart auto-router that automatically selects from available high-performance models based on task requirements.'
    },
    {
      id: 'stealth/ox-alpha',
      name: 'Atlas Alpha',
      badge: '1.05M FREE',
      isFree: true,
      context: '1,048,576 tokens',
      desc: 'Advanced reasoning model designed for coding, sustained agentic work, and long-horizon software engineering.'
    },
    {
      id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
      name: 'Atlas Ultra (MoE)',
      badge: '1M FREE',
      isFree: true,
      context: '1,000,000 tokens',
      desc: 'Frontier-reasoning orchestration engine optimized for deep research and complex architecture planning.'
    },
    {
      id: 'poolside/laguna-s-2.1:free',
      name: 'Atlas Code Engine',
      badge: '262K FREE',
      isFree: true,
      context: '262,144 tokens',
      desc: 'Specialized coding agent model scoring highly on terminal-based agentic software engineering benchmarks.'
    },
    {
      id: 'cohere/north-mini-code:free',
      name: 'Atlas Mini Code',
      badge: '256K FREE',
      isFree: true,
      context: '256,000 tokens',
      desc: 'Optimized, fast-inference MoE engine for rapid code generation, SWE tasks, and terminal workflows.'
    },
    {
      id: 'z-ai/glm-5.2:free',
      name: 'Atlas Project Lead',
      badge: '256K FREE',
      isFree: true,
      context: '256,000 tokens',
      desc: 'Large-scale reasoning model suited for project-level software engineering and multi-step automation.'
    },
    {
      id: 'google/gemma-4-26b-a4b-it:free',
      name: 'Atlas Core',
      badge: '262K FREE',
      isFree: true,
      context: '262,144 tokens',
      desc: 'Instruction-tuned core model with native function calling and configurable thinking mode.'
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
  const connectionStatus = document.getElementById('connectionStatus');

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
  const welcomeScreen = document.getElementById('welcomeScreen');
  const dynamicTimeGreeting = document.getElementById('dynamicTimeGreeting');
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

  // Presets
  const PERSONA_PRESETS = {
    fullstack: 'You are an elite full-stack software engineer and architect. Provide clean, modular, production-ready code with robust error handling, modern patterns, and clear architectural explanations.',
    architect: 'You are a principal enterprise system architect. Focus on high-level system design, scalability, distributed resilience, microservices, cloud patterns, and trade-off analysis.',
    reasoner: 'You are a rigorous frontier reasoning AI. Break down all problems step-by-step with structured logical analysis, deep mathematical rigor, and explicit chain-of-thought verification.',
    concise: 'You are an ultra-concise senior engineer. Output direct, optimal code and solutions with minimal preamble or conversational filler.'
  };

  let state = {
    theme: localStorage.getItem('omni_theme') || 'vylex',
    currentModel: localStorage.getItem('omni_model') || 'openrouter/free',
    models: FREE_MODELS,
    systemPrompt: localStorage.getItem('omni_sys_prompt') || PERSONA_PRESETS.fullstack,
    activePreset: localStorage.getItem('omni_preset') || 'fullstack',
    temperature: parseFloat(localStorage.getItem('omni_temp') || '0.7'),
    isDeepReasoning: true,
    sessions: JSON.parse(localStorage.getItem('omni_sessions') || '[]'),
    activeSessionId: null,
    isGenerating: false,
    abortController: null,
    activeArtifact: null,
    lastUserPrompt: ''
  };

  // Configure marked
  if (window.marked) {
    marked.setOptions({
      highlight: function(code, lang) {
        if (window.hljs && lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (e) {
            console.warn(e);
          }
        }
        if (window.hljs) {
          return hljs.highlightAuto(code).value;
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
    loadSavedSettings();
    initSessionManager();
    await checkBackendHealth();
    setupEventListeners();
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

  // --- DYNAMIC GREETING ---
  function updateDynamicGreeting() {
    if (!dynamicTimeGreeting) return;
    const hour = new Date().getHours();
    let greeting = 'Good evening';
    if (hour >= 5 && hour < 12) greeting = 'Good morning';
    else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 22 || hour < 5) greeting = 'Good night';
    dynamicTimeGreeting.textContent = `${greeting}, Developer`;
  }

  // --- BACKEND HEALTH & MODELS ---
  async function checkBackendHealth() {
    const dot = connectionStatus?.querySelector('.status-indicator-dot');
    const text = connectionStatus?.querySelector('.status-indicator-text');

    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.status === 'ok') {
        dot?.classList.add('connected');
        if (text) text.textContent = data.hasApiKey ? 'Atlas Ready' : 'API Key Missing';
      }

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
      dot?.classList.remove('connected');
      if (text) text.textContent = 'Server Offline';
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
    if (hintModelName) hintModelName.textContent = model.id;
    if (hintContextSize) hintContextSize.textContent = model.context;

    if (bannerModelTitle) bannerModelTitle.textContent = model.id;
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

  // --- SESSION & HISTORY MANAGEMENT ---
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
      id: 'session_' + Date.now(),
      title: 'New Session',
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
    localStorage.setItem('omni_sessions', JSON.stringify(state.sessions));
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

  // --- PRODUCTION-GRADE ERROR DIAGNOSTIC CARD BUILDER ---
  function buildDiagnosticErrorCard(err, failedPrompt) {
    const errorMsg = err.message || 'Unknown network error';
    const isOffline = errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('ERR_CONNECTION');
    const isAuth = errorMsg.includes('401') || errorMsg.includes('API Key') || errorMsg.includes('Unauthorized') || errorMsg.includes('authentication');
    const isRateLimit = errorMsg.includes('429') || errorMsg.includes('rate') || errorMsg.includes('quota') || errorMsg.includes('credits');
    const isTimeout = errorMsg.includes('timeout') || errorMsg.includes('AbortError');

    let title = 'Studio Gateway Diagnostic Exception';
    let summary = errorMsg;
    let badge = 'NETWORK DISCONNECTED';
    let recoveryHint = 'Verify that the local Node.js backend server is running via `npm start` on port 3000.';

    if (isOffline) {
      title = 'Atlas Gateway Disconnected (Connection Refused)';
      badge = 'GATEWAY OFFLINE';
      summary = 'Could not establish connection to the Atlas backend.';
      recoveryHint = 'Ensure the Atlas backend is running (`npm start`) and accessible.';
    } else if (isAuth) {
      title = 'Authentication Required (401)';
      badge = 'AUTHENTICATION REQUIRED';
      summary = 'API key is missing or unauthorized.';
      recoveryHint = 'Configure your Atlas License Key in your environment variables. Free-tier usage still requires a valid license.';
    } else if (isRateLimit) {
      title = 'Free Provider Rate Limit Reached (429)';
      badge = 'CONCURRENCY THROTTLED';
      summary = 'Upstream free provider is temporarily overloaded or rate limited.';
      recoveryHint = 'Switch to `Free Models Router` to automatically balance your request across other available free hosts.';
    } else if (isTimeout) {
      title = 'Inference Stream Timed Out';
      badge = 'STREAM TIMEOUT';
      summary = 'The model host did not respond within the allocated latency window.';
      recoveryHint = 'Click Retry or switch to an alternate high-throughput free model.';
    }

    const card = document.createElement('div');
    card.className = 'error-diagnostic-card';
    card.style.cssText = `
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.35);
      border-radius: 8px;
      padding: 14px;
      margin: 8px 0;
      color: var(--text-main);
      font-size: 0.85rem;
    `;

    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #ef4444;">
          ${ICONS.alert}
          <span>${escapeHtml(title)}</span>
        </div>
        <span style="font-size: 0.65rem; font-family: 'JetBrains Mono', monospace; background: rgba(239, 68, 68, 0.2); color: #fca5a5; padding: 2px 6px; border-radius: 4px;">
          ${badge}
        </span>
      </div>

      <p style="color: var(--text-secondary); margin-bottom: 10px; font-size: 0.82rem; line-height: 1.5;">
        ${escapeHtml(summary)}
      </p>

      <div style="background: rgba(0, 0, 0, 0.3); border-left: 3px solid #ef4444; padding: 8px 10px; border-radius: 4px; margin-bottom: 12px; font-size: 0.78rem; color: var(--text-muted);">
        <strong>Actionable Resolution:</strong> ${escapeHtml(recoveryHint)}
      </div>

      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <button type="button" class="error-action-btn retry-btn" style="background: var(--accent-solid); color: #fff; border: none; padding: 5px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px;">
          ${ICONS.retry}
          <span>Retry Prompt</span>
        </button>

        <button type="button" class="error-action-btn switch-router-btn" style="background: rgba(255, 255, 255, 0.08); color: var(--text-main); border: 1px solid var(--border-subtle); padding: 5px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px;">
          ${ICONS.freeRouter}
          <span>Switch to Free Router</span>
        </button>

        <button type="button" class="error-action-btn copy-diag-btn" style="background: transparent; color: var(--text-muted); border: 1px solid var(--border-subtle); padding: 5px 8px; border-radius: 4px; font-size: 0.72rem; cursor: pointer; margin-left: auto; display: flex; align-items: center; gap: 4px;">
          ${ICONS.copy}
          <span>Copy Trace</span>
        </button>
      </div>
    `;

    // Hook 1-click retry
    card.querySelector('.retry-btn')?.addEventListener('click', () => {
      if (failedPrompt) {
        messageInput.value = failedPrompt;
        chatForm.dispatchEvent(new Event('submit'));
      }
    });

    // Hook 1-click model fallback to openrouter/free
    card.querySelector('.switch-router-btn')?.addEventListener('click', () => {
      selectModel('openrouter/free');
      if (failedPrompt) {
        messageInput.value = failedPrompt;
        chatForm.dispatchEvent(new Event('submit'));
      }
    });

    // Hook Copy diagnostic log
    card.querySelector('.copy-diag-btn')?.addEventListener('click', (e) => {
      const logData = `[Atlas Diagnostic Report — Vylex Technologies]\nTimestamp: ${new Date().toISOString()}\nModel: ${state.currentModel}\nTitle: ${title}\nBadge: ${badge}\nError Message: ${errorMsg}\nEndpoint: ${API_BASE}/api/chat`;
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
        <span class="active-thought-word">Extrapolating Latent Space...</span>
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
      <span>${role === 'user' ? 'You' : state.currentModel} • ${time}</span>
      <div class="message-actions-bar">
        <button class="msg-action-btn copy-msg-btn" title="Copy text">
          ${ICONS.copy}
          <span>Copy</span>
        </button>
        ${role === 'assistant' ? `
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

    meta.querySelector('.speak-msg-btn')?.addEventListener('click', () => {
      toggleSpeech(content);
    });

    wrapper.appendChild(meta);
    row.appendChild(avatar);
    row.appendChild(wrapper);
    messagesContainer.appendChild(row);

    if (shouldScroll) scrollToBottom();

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

  function parseMarkdownSafely(raw) {
    if (!raw) return '<span class="pulse-dot"></span>';
    const cleaned = cleanAndTransformToolCalls(raw);
    let html = window.marked ? marked.parse(cleaned) : cleaned;
    if (window.DOMPurify) html = DOMPurify.sanitize(html);
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

    // Start animated verb indicator in floating toolbar
    let stopFloatingAnim = null;
    if (streamingIndicator) {
      streamingIndicator.style.display = 'flex';
      const textElem = streamingIndicator.querySelector('.indicator-text');
      if (textElem) {
        stopFloatingAnim = startVerbAnimation(textElem, STREAMING_VERBS, '', '...');
      }
    }

    const ATLAS_IDENTITY = 'You are Atlas, a senior software engineering partner and systems architect built by Vylex Technologies (https://vylex.co.za). You specialize in production-grade code, distributed system design, refactoring, specs, and logical verification. When asked who you are or who built you, always state that you are Atlas, a developer assistant made by Vylex Technologies. Format all code responses using standard Markdown fenced code blocks (```html ... ```). Do NOT output pseudo tool calls like <|tool_call_start|>, <|tool_call_end|>, [write(...)], or [execute(...)]. Output direct, clean conversational text and standard code blocks.';
    const payloadMessages = [];
    const fullSystemPrompt = ATLAS_IDENTITY + (state.systemPrompt || '');
    payloadMessages.push({ role: 'system', content: fullSystemPrompt });
    session.messages.forEach(m => payloadMessages.push({ role: m.role, content: m.content }));

    let accumulatedContent = '';
    let accumulatedReasoning = '';
    let inThinkTag = false;
    let hasReceivedFirstContent = false;

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
          temperature: state.temperature
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
            const delta = parsed.choices?.[0]?.delta?.content || '';

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
            } else {
              accumulatedContent += delta;

              // Hide thought banner once real text starts streaming
              if (!hasReceivedFirstContent && accumulatedContent.trim().length > 0) {
                hasReceivedFirstContent = true;
                if (stopThoughtAnim) stopThoughtAnim();
                if (thoughtBanner) thoughtBanner.style.display = 'none';
              }

              bubble.innerHTML = parseMarkdownSafely(accumulatedContent);
              enhanceCodeBlocks(bubble);
              
              // Incrementally execute fully formed tools
              await executeAgentTools(accumulatedContent);
            }

            scrollToBottom();
          } catch (jsonErr) {
            // Chunk fragment
          }
        }
      }

      if (!accumulatedContent) {
        accumulatedContent = accumulatedReasoning || '(Empty response received)';
        bubble.innerHTML = parseMarkdownSafely(accumulatedContent);
      }

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
        bubble.innerHTML += `<div style="margin-top: 6px; font-size: 0.78rem; color: var(--text-subtle); font-style: italic;">[Generation halted by user]</div>`;
      } else {
        console.error('Generation Error:', err);
        // Inject production-grade diagnostic error card
        bubble.innerHTML = '';
        bubble.appendChild(buildDiagnosticErrorCard(err, userText));
      }
    } finally {
      if (stopFloatingAnim) stopFloatingAnim();
      state.isGenerating = false;
      sendBtn.disabled = false;
      if (stopGenerationBtn) stopGenerationBtn.style.display = 'none';
      if (sendBtn) sendBtn.style.display = 'flex';
      if (streamingIndicator) streamingIndicator.style.display = 'none';
      messageInput.focus();
      scrollToBottom();
    }
  });

  // Stop Generation
  stopGenerationBtn?.addEventListener('click', () => {
    if (state.abortController) {
      state.abortController.abort();
    }
  });

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    sidebarCollapseBtn?.addEventListener('click', () => {
      sidebar.classList.add('collapsed');
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

    deepThinkToggleBtn?.addEventListener('click', () => {
      state.isDeepReasoning = !state.isDeepReasoning;
      deepThinkToggleBtn.querySelector('.think-dot').style.backgroundColor = state.isDeepReasoning ? '#10b981' : '#64748b';
      deepThinkToggleBtn.querySelector('span:last-child').textContent = state.isDeepReasoning ? 'Reasoning: Active' : 'Reasoning: Off';
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
      customSystemPrompt.value = PERSONA_PRESETS.fullstack;
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
        const name = state.activePreset === 'fullstack' ? 'Full-Stack' : state.activePreset === 'architect' ? 'Architect' : state.activePreset === 'reasoner' ? 'Deep Thinker' : 'Concise';
        activePromptLabel.textContent = `System: ${name}`;
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

  function openSettingsModal() {
    customSystemPrompt.value = state.systemPrompt;
    temperatureSlider.value = state.temperature;
    if (tempValBadge) tempValBadge.textContent = state.temperature;
    presetPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-preset') === state.activePreset));
    systemPromptModal.classList.add('open');
  }

  function loadSavedSettings() {
    if (activePromptLabel) {
      const name = state.activePreset === 'fullstack' ? 'Full-Stack' : state.activePreset === 'architect' ? 'Architect' : state.activePreset === 'reasoner' ? 'Deep Thinker' : 'Concise';
      activePromptLabel.textContent = `System: ${name}`;
    }
  }

  function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 160) + 'px';
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
      fileContent = `# ${session.title}\n*Exported from Atlas by Vylex Technologies (vylex.co.za) on ${new Date().toLocaleString()}*\n*Model: ${session.model}*\n\n---\n\n`;
      session.messages.forEach(m => {
        fileContent += `### ${m.role === 'user' ? 'User' : 'Assistant (' + session.model + ')'}\n\n`;
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
