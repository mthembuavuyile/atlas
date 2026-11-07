# Atlas | Technical Reasoning Workspace by Vylex Technologies

A focused, locally hostable technical reasoning workspace for research, mathematics, code, and systems engineering. Atlas connects to OpenRouter across 7 curated model options (with automatic rate-limit failover and optional Bring Your Own Key support) and pairs language models with 26 built-in deterministic tools, KaTeX/mhchem scientific rendering, client-side CSV/PDF document intelligence, and a 5-tab Artifacts Canvas.

Built by [Vylex Technologies](https://vylex.co.za) / [Vylex Labs](https://vylex.co.za/labs), founded by [Avuyile Mthembu](https://avuyilemthembu.co.za).

**[Platform Overview](/public/about.html)** · **[Technical Documentation](/public/docs.html)**

---

## Features

- **Curated Model Selector & Failover**: Switch between 7 curated OpenRouter model options (including `openrouter/free` auto-routing with sequential fallback on 429/503 responses) or supply a personal OpenRouter API key (`sk-or-v1-...`) in Settings.
- **8 Investigation Modes**: Choose between `Auto`, `Research`, `Solve`, `Build`, `Engineer`, `Experiment`, `Reason`, and `Discover` modes, plus 6 Persona Presets and custom instructions.
- **Real-Time Streaming & Reasoning Traces**: Token-by-token SSE response rendering with collapsible `Reasoning Process` (`<think>`) deliberation blocks.
- **KaTeX & mhchem Scientific Rendering**: Native rendering for inline and block LaTeX equations, multi-line aligned derivations, and chemical formulas (`\ce{...}`).
- **5-Tab Artifacts Canvas**: Side-by-side workspace with `Code` (editable source, line numbers, copy, download), `Live Preview` (sandboxed HTML/CSS/JS `iframe`), `Diff` (unified diff against local files), `Document` (Markdown viewer), and `Log`.
- **Document Intelligence & Local Project Sync**: Client-side parsing of `.csv` datasets (row/column counts and min/max/mean summary statistics), `.pdf` documents (PDF.js text extraction), text/code files, and local directories via the Web File System Access API (`showDirectoryPicker`) with explicit user-approved `Apply to Local File` sync.
- **26 Built-In Tools & Interactive Widgets**: Deterministic tools for live web search (`DuckDuckGo`), weather (`Open-Meteo`), stock/index/commodity charts (`Yahoo Finance`), crypto terminals & spot prices (`CoinGecko`), Crypto Fear & Greed (`Alternative.me`), Bitcoin mempool telemetry (`Mempool.space`), forex rates (`Frankfurter ECB`), symbolic & numerical math (`Math.js`), unit conversion, timezones, OpenStreetMap + Leaflet maps, NASA APOD & ISS telemetry, Hacker News, Reddit discussions, TMDB movies, Wikimedia Commons image search, Pollinations.ai image synthesis, QR generation/scanning (`jsQR`), OCR (`Tesseract.js`), dictionary definitions, Bible verses, jokes, and advice.
- **Slash Commands & Natural-Language Triggers**: Trigger tools directly via `/web`, `/weather`, `/stock`, `/crypto`, `/mempool`, `/fear`, `/convert`, `/unit`, `/math`, `/time`, `/places`, `/space`, `/news`, `/reddit`, `/movie`, `/movies`, `/image`, `/qr`, `/scanqr`, `/ocr`, `/define`, `/bible`, `/joke`, `/advice`, or natural-language queries.
- **Voice Input, Speech Readout & Themes**: Web Speech API microphone dictation and speech readout (`Read Aloud`), plus three dark themes (`Vylex`, `Obsidian`, `Carbon`).
- **Local-First Privacy & Export**: Conversations, bookmarks, and settings persist in browser `localStorage` (`atlas_investigations`) with one-click Markdown (`.md`) and JSON (`.json`) export/import.
- **Terminal CLI**: Interactive command-line interface (`npm run cli`) for terminal workflows.

## Atlas Capabilities

| Capability Area | Atlas Coverage |
| :--- | :--- |
| Live-data & market tools | DuckDuckGo web search, Open-Meteo weather, Yahoo Finance stock charts, CoinGecko crypto terminals & spot quotes, Crypto Fear & Greed, Bitcoin mempool telemetry, and Frankfurter ECB forex conversion |
| Science, math & vision | Math.js symbolic differentiation/simplification & numerical evaluation, dimensional unit conversion, KaTeX & mhchem rendering, Tesseract.js OCR, jsQR scanner/generator, Pollinations.ai image synthesis, and Wikimedia Commons visual search |
| Knowledge & media feeds | NASA APOD & Open Notify ISS telemetry, Hacker News top stories, Reddit discussions, TMDB movie details & release discovery, Wikipedia/URL extraction, Free Dictionary API, Bible API, jokes, and advice |
| Workspace & context | 5-tab Artifacts Canvas, sandboxed HTML/CSS/JS preview, CSV & PDF client-side Document Intelligence, local folder ingestion with user-approved file sync, Markdown/JSON export, and Terminal CLI |

---

## Project Structure

```
atlas/
├── .env.example              # Environment template
├── vercel.json               # Vercel deployment configuration
├── package.json              # Node dependencies & scripts
│
├── src/                      # Backend (Node.js + Express)
│   ├── server.js             # Main server entry point
│   ├── capabilities/         # Modular capability plug-ins (web, finance, movies, registry)
│   ├── config/
│   │   ├── env.js            # Centralized environment configuration
│   │   ├── identity.js       # Canonical Atlas, Vylex & Founder identity + system prompts
│   │   ├── models.config.js  # 7 curated OpenRouter model configurations
│   │   └── tools.config.js   # OpenAI-compatible function tool schemas
│   ├── middleware/
│   │   ├── modelGuard.js     # Curated model whitelist & BYOK validation
│   │   └── rateLimiter.js    # Per-endpoint rate limiters
│   ├── services/
│   │   ├── openrouter.service.js  # OpenRouter API adapter with automatic failover
│   │   ├── search.service.js      # DuckDuckGo, Wikipedia & OpenAlex search grounding
│   │   └── widget.service.js      # Deterministic tool & widget execution handlers
│   ├── controllers/
│   │   ├── chat.controller.js     # Mode-aware chat, SSE streaming & tool loop
│   │   ├── models.controller.js   # Model listing
│   │   └── health.controller.js   # Health check payload
│   ├── routes/
│   │   ├── api.routes.js     # API endpoints (/api/chat, /api/widget/execute, etc.)
│   │   └── index.js          # Static & public page route mapping
│   └── cli/
│       └── chat-cli.js       # Terminal CLI interface
│
├── public/                   # Frontend (Modular ES6 Browser App)
│   ├── index.html            # Main workspace application interface
│   ├── about.html            # Platform overview & capability matrix
│   ├── docs.html             # Technical reference & tool specifications
│   ├── atlas.html            # Interactive architecture & prompting guide
│   ├── privacy.html          # POPIA-aligned privacy policy
│   ├── terms.html            # Terms of service & MIT license
│   ├── css/                  # Modular stylesheet architecture
│   └── js/
│       ├── app.js            # Main ES module bootstrap & slash command router
│       ├── audio/            # Voice dictation & speech readout pill
│       ├── config/           # Client constants, modes, icons & presets
│       ├── markdown/         # Marked + KaTeX + Highlight.js pipeline
│       ├── services/         # SSE chat stream, intent router & widget execute client
│       ├── state/            # Reactive client session & settings store
│       ├── ui/               # Canvas, modals, message renderer, theme & session manager
│       └── widgets/          # Interactive widget card & chart renderers
│
└── tests/                    # Automated Jest test suites
```

---

## Quick Start

### 1. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` and add your OpenRouter API key:
```env
OPENROUTER_API_KEY=your_key_here
```
You can generate an API key at [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys).

### 2. Install and Start
```bash
npm install
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to launch the workspace.
Visit **[http://localhost:3000/about](http://localhost:3000/about)** for the platform overview or **[http://localhost:3000/docs](http://localhost:3000/docs)** for full technical specifications.

### 3. Run Tests & Terminal CLI
```bash
npm test
npm run cli
```

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repository into your [Vercel](https://vercel.com) account.
3. In the Vercel dashboard, add the following environment variables:
   - `OPENROUTER_API_KEY` (Your default server OpenRouter API key)
   - `APP_URL` (Your deployment domain, e.g., `https://atlas.vylex.co.za`)
4. Deploy the project.

Note: Ensure your `.env` file is never committed to version control.

---

## Routes & API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Main Atlas Workspace UI |
| `GET` | `/about` | About Atlas & Capability Matrix |
| `GET` | `/docs` | Technical Documentation & Tool Specifications |
| `GET` | `/atlas` | Interactive Architecture & Prompting Guide |
| `GET` | `/privacy` | Privacy Policy (POPIA & local storage architecture) |
| `GET` | `/terms` | Terms of Service & MIT License |
| `GET` | `/api/health` | Service health check & identity metadata |
| `GET` | `/api/models` | List of 7 curated OpenRouter models |
| `POST` | `/api/chat` | Mode-aware chat completion & tool loop (SSE streaming) |
| `POST` | `/api/chat/title` | Concise conversation title generation |
| `POST` | `/api/widget/execute` | Direct deterministic tool/widget execution |

---

## Security & Privacy Context

- **Server-Side Default Key & Optional BYOK**: The server's default `OPENROUTER_API_KEY` remains strictly on the backend. Users may optionally configure a personal OpenRouter key in browser `localStorage`, which is sent via request headers (`x-openrouter-key`) directly to authenticate with OpenRouter and is never stored or logged on the server.
- **Model Guard**: Requests using the shared server key are restricted to the 7 curated models in `src/config/models.config.js`; custom OpenRouter models require a valid personal BYOK key.
- **Local-First Session Storage**: Conversations, bookmarks, and preferences are persisted in browser `localStorage` (`atlas_investigations`), with no server-side chat database.
- **No Unapproved File Writes**: Local directory context uses the browser File System Access API and requires explicit user confirmation before writing any file diff to disk.

---

## License

MIT - Built by [Vylex Technologies](https://vylex.co.za)
