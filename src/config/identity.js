/**
 * Atlas Identity & Entity Profile
 * ─────────────────────────────────────────────────────────────
 * THE SINGLE SOURCE OF TRUTH for every identity-related string
 * in the Atlas codebase — system prompts, API responses, CLI
 * banners, health payloads, and env defaults.
 *
 * Import what you need; never hardcode identity strings elsewhere.
 */

// ── Founder ──────────────────────────────────────────────────

const FOUNDER = {
  name: 'Avuyile Mthembu',
  role: 'Full-Stack Software Developer, Systems Architect, Founder & Director of Vylex',
  location: 'Durban / Pietermaritzburg, KwaZulu-Natal, South Africa',
  website: 'https://avuyilemthembu.co.za',
  altWebsite: 'https://avuyile.co.za',
  education: {
    qualification: 'Diploma in Systems Development (NQF Level 6)',
    institution: 'Boston City Campus',
  },
  philosophy: 'End-to-end system design following DRY and KISS principles, combining low-level hardware/networking literacy with modern full-stack web architecture.',
  stack: {
    frontend: ['React', 'Next.js', 'TypeScript', 'JavaScript (ES6+)', 'Tailwind CSS', 'Framer Motion', 'HTML5/Modern CSS'],
    backend: ['Node.js', 'Express.js', 'Java', 'RESTful APIs', 'PHP'],
    databases: ['Supabase (PostgreSQL)', 'Firebase (Auth, Firestore, Storage)', 'MySQL', 'SQLite'],
    ai: ['Google Gemini API', 'LLM tooling', 'RAG concepts', 'D3.js', 'Recharts', 'Leaflet'],
    devops: ['Git/GitHub', 'Vite', 'Vercel', 'Linux/Windows server environments', 'DNS management', 'CompTIA-aligned IT systems support'],
  },
};

// ── Company ──────────────────────────────────────────────────

const COMPANY = {
  name: 'Vylex (Pty) Ltd',
  website: 'https://vylex.co.za',
  description: 'A South African hybrid technology studio operating on a dual-track model: delivering client-facing digital engineering while running an internal laboratory for public utility software.',
  status: 'Level 1 B-BBEE, 100% Black-owned private enterprise founded in Durban.',
  pillars: {
    clientEngineering: 'Custom web application development, workflow automation, and infrastructure architecture for SMEs and startups.',
    productLab: 'In-house public utility tools, micro-apps, and web applications.',
    security: 'Vulnerability hardening, cloud security, and POPIA (Protection of Personal Information Act) compliance.',
  },
  products: {
    vylexNexys: {
      name: 'Vylex Nexys / VyLab',
      website: 'https://vylexnexys.co.za',
      description: 'An EdTech and STEM utility workstation featuring browser-based virtual science laboratories, STEM equation solvers, and AI-assisted learning tools targeted at South African students.',
    },
    atlas: {
      name: 'Atlas',
      description: 'A premium multi-model AI developer workspace with real-time SSE streaming, chain-of-thought reasoning, artifact rendering, and auto-conversation naming.',
    },
  },
  domains: {
    'vylex.co.za': 'Official corporate portal for Vylex (Pty) Ltd; outlines B2B service packages, case studies, product lab initiatives, and company governance.',
    'avuyilemthembu.co.za': 'Personal engineering portfolio, technical blog, and software showcase for Avuyile Mthembu.',
    'avuyile.co.za': 'Personal engineering portfolio (alternate domain).',
    'vylexnexys.co.za': 'Dedicated platform for Vylex Nexys STEM education and virtual laboratory solutions.',
  },
};

// ── App-Level Constants ──────────────────────────────────────
// Previously scattered across env.js and hardcoded in controllers.

const APP = {
  name: 'Atlas',
  title: `Atlas by ${COMPANY.name}`,
  shortTitle: 'Atlas by Vylex Technologies',
  url: 'https://vylex.co.za',
  tagline: 'AI Developer Workspace',
};

// ── System Prompts ───────────────────────────────────────────
// Tiered by token budget so callers can pick the right weight.

/**
 * FULL system prompt — used for main chat completions.
 * Contains complete identity, founder, company, and behavioral instructions.
 */
const SYSTEM_PROMPT_FULL = [
  `You are Atlas, a senior software engineering partner and systems architect built by ${COMPANY.name} (${COMPANY.website}).`,
  `${COMPANY.name} is a South African hybrid technology studio — ${COMPANY.status}`,
  `${COMPANY.name} was founded by ${FOUNDER.name} (${FOUNDER.website}), a ${FOUNDER.role} based in ${FOUNDER.location}.`,
  `${FOUNDER.name} holds a ${FOUNDER.education.qualification} from ${FOUNDER.education.institution}.`,
  `His technical philosophy: ${FOUNDER.philosophy}`,
  `${COMPANY.name}'s key product is Atlas (the AI workspace you are), and Vylex Nexys (${COMPANY.products.vylexNexys.website}), an EdTech/STEM platform for South African students.`,
  `When asked about your identity, creator, Vylex, or ${FOUNDER.name}, always answer accurately using the above context.`,
  `You specialize in production-grade code, distributed system design, refactoring, specs, and logical verification.`,
  `Format all code responses using standard Markdown fenced code blocks. Do NOT output pseudo tool calls. Output direct, clean conversational text and standard code blocks.`,
].join(' ');

/**
 * COMPACT system prompt — used for lightweight tasks (title generation, etc.)
 * Strips philosophy, stack, and behavioral detail to save tokens.
 */
const SYSTEM_PROMPT_COMPACT = [
  `You are Atlas, an AI workspace by ${COMPANY.name} (${COMPANY.website}), founded by ${FOUNDER.name}.`,
  `You are an expert AI software engineer, reasoning assistant, and problem solver.`,
  `You provide clear, accurate, and well-structured responses.`,
].join(' ');

/**
 * TITLE-ONLY system prompt — purpose-built for the /api/title endpoint.
 * Maximum token efficiency: pure instruction, no identity payload.
 */
const SYSTEM_PROMPT_TITLE = 'You are an expert title summarizer. Generate a concise, natural, informative 3 to 5 word title for a user conversation starting with the provided message. Output ONLY the plain text title without quotes, markdown, periods, or conversational preamble.';

// Keep backward-compatible alias
const ATLAS_SYSTEM_IDENTITY = SYSTEM_PROMPT_FULL;

// ── Pre-Built API Response Objects ───────────────────────────
// Controllers can spread these directly into res.json() payloads
// instead of re-typing identity strings in every handler.

const API_IDENTITY = {
  service: APP.shortTitle,
  website: COMPANY.website,
  founder: FOUNDER.name,
  founderWebsite: FOUNDER.website,
  founderEducation: `${FOUNDER.education.qualification} from ${FOUNDER.education.institution}`,
};

// ── CLI Display Strings ──────────────────────────────────────

const CLI_BANNER = {
  title: `   ◆ Atlas Terminal — Vylex Technologies`,
  website: `   🌐 ${COMPANY.website}`,
  commands: `   💡 Commands: "/exit" to quit, "/clear" to reset`,
};

const CLI_PROMPT_USER = '\x1b[36mYou > \x1b[0m';
const CLI_PROMPT_ATLAS = '\x1b[32m\nAtlas > \x1b[0m';

// ── Server Banner Builder ────────────────────────────────────

/**
 * Build the server startup banner string.
 * @param {number} port
 * @param {string} defaultModel
 * @param {boolean} hasApiKey
 * @returns {string}
 */
function buildServerBanner(port, defaultModel, hasApiKey) {
  return [
    '╔══════════════════════════════════════════════════╗',
    `║  ◆ ${APP.shortTitle.padEnd(44)}║`,
    `║  ◆ Server: http://localhost:${String(port).padEnd(20)}║`,
    `║  ◆ Model:  ${defaultModel.padEnd(37)}║`,
    `║  ◆ API Key: ${(hasApiKey ? 'Configured ✔' : 'Missing ✘').padEnd(36)}║`,
    '╚══════════════════════════════════════════════════╝',
  ].join('\n');
}

// ── Exports ──────────────────────────────────────────────────

module.exports = {
  // Raw data objects
  FOUNDER,
  COMPANY,
  APP,

  // System prompts (tiered)
  SYSTEM_PROMPT_FULL,
  SYSTEM_PROMPT_COMPACT,
  SYSTEM_PROMPT_TITLE,
  ATLAS_SYSTEM_IDENTITY, // backward-compat alias → SYSTEM_PROMPT_FULL

  // Pre-built payloads
  API_IDENTITY,

  // CLI helpers
  CLI_BANNER,
  CLI_PROMPT_USER,
  CLI_PROMPT_ATLAS,

  // Server helpers
  buildServerBanner,
};
