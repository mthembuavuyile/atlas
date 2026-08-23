# ◆ Atlas — AI Chat Studio by Vylex Technologies

A premium multi-model AI chat workspace with real-time SSE streaming, chain-of-thought reasoning, artifact rendering, and auto-conversation naming.

**Built by [Vylex Technologies](https://vylex.co.za)**

---

## ✨ Features

- **Multi-Model Support** — Switch between free frontier AI models in real time
- **SSE Streaming** — Instant token-by-token response rendering
- **Chain-of-Thought Inspector** — Structured `<think>` tag reasoning display
- **Artifacts Canvas** — Split-screen code viewer with syntax highlighting & live HTML preview
- **Auto-Naming** — AI-generated conversation titles (Claude/ChatGPT style)
- **Three Visual Themes** — Vylex, Obsidian, Carbon
- **System Persona Presets** — Full-Stack, Architect, Deep Thinker, Concise Coder
- **File Attachments** — Drag & drop code files into prompts
- **Export** — Download conversations as Markdown or JSON
- **Terminal CLI** — Interactive command-line chat interface

---

## 📁 Project Structure

```
atlas-by-vylex/
├── .env.example              # Environment template (copy to .env)
├── .gitignore                # Comprehensive git safety rules
├── vercel.json               # Vercel deployment configuration
├── package.json              # Dependencies & scripts
│
├── src/                      # Backend (Node.js + Express)
│   ├── server.js             # Express server entry point
│   ├── config/
│   │   ├── env.js            # Centralized environment config
│   │   └── models.config.js  # Curated free models catalogue
│   ├── services/
│   │   └── openrouter.service.js  # OpenRouter API adapter (SSE + REST)
│   ├── controllers/
│   │   ├── chat.controller.js     # Chat completion & title generation
│   │   ├── models.controller.js   # Available models listing
│   │   └── health.controller.js   # Service health check
│   ├── routes/
│   │   ├── api.routes.js     # API endpoint declarations
│   │   └── index.js          # Route aggregator
│   └── cli/
│       └── chat-cli.js       # Terminal chat interface
│
├── public/                   # Frontend (Static HTML/CSS/JS)
│   ├── index.html            # Main Atlas chat interface
│   ├── css/style.css         # Design system & themes
│   └── js/app.js             # Client-side chat logic & SSE parser
│
└── examples/
    ├── quickstart.js          # Standalone API example
    └── openrouter.types.ts    # TypeScript type definitions
```

---

## ⚡ Quick Start

### 1. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` and add your free OpenRouter API key:
```env
OPENROUTER_API_KEY=your_key_here
```
Get a free key at: [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)

### 2. Install & Start
```bash
npm install
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Terminal CLI
```bash
npm run cli
```

---

## 🚀 Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add environment variable in Vercel dashboard:
   - `OPENROUTER_API_KEY` → your OpenRouter key
   - `APP_URL` → your Vercel domain (e.g. `https://atlas.vercel.app`)
4. Deploy

> **Important:** Never commit your `.env` file. Set secrets in the Vercel dashboard only.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Atlas Chat UI |
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/models` | List available models |
| `POST` | `/api/chat` | Chat completion (SSE streaming) |
| `POST` | `/api/title` | AI conversation title generation |

---

## 🔐 Security

- ✅ API key stays **server-side only** — never exposed to browser
- ✅ No hardcoded secrets in source code
- ✅ `.env` excluded from git via `.gitignore`
- ✅ CORS configured with allowed origins
- ✅ Health endpoint reveals no sensitive data
- ✅ Frontend only calls your own backend, not OpenRouter directly

---

## 📜 License

MIT — Built with ❤️ by [Vylex Technologies](https://vylex.co.za)
