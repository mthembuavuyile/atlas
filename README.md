# Atlas | Developer Workspace by Vylex Technologies

A focused, locally hostable interface for working with language models. Atlas connects to OpenRouter to provide a clean development environment with streaming responses, code artifact rendering, and built-in chat management.

Built by [Vylex Technologies](https://vylex.co.za)

**[Read more on our Marketing Page](/about.html)**

---

## Features

- **Model Switching**: Switch between different models provided by OpenRouter without changing interfaces.
- **Real-Time Streaming**: Token-by-token response rendering for immediate feedback.
- **Reasoning Display**: Dedicated collapsible sections for models that output structured `<think>` tags.
- **Artifacts Canvas**: Split-screen view for reading code, with syntax highlighting and live HTML preview capabilities.
- **Automatic Titling**: Automatically generates concise names for your conversations based on context.
- **Visual Themes**: Choose from three functional, low-distraction dark themes (Vylex, Obsidian, Carbon).
- **System Presets**: Pre-configured system prompts tailored for coding, architecture, and deep technical analysis.
- **File Attachments**: Drag and drop text or code files directly into your prompts.
- **Project Context**: Import a website folder into the composer so Atlas can inspect relevant files and propose an approval-ready unified diff. Files are never overwritten automatically.
- **Export Options**: Download conversation history in Markdown or JSON formats for documentation or sharing.
- **Terminal CLI**: Included command-line interface for when you prefer working straight from the terminal.

---

## Project Structure

```
atlas-by-vylex/
├── .env.example              # Environment template
├── .gitignore                # Git safety rules
├── vercel.json               # Vercel deployment configuration
├── package.json              # Node dependencies & scripts
│
├── src/                      # Backend (Node.js + Express)
│   ├── server.js             # Main server entry point
│   ├── config/
│   │   ├── env.js            # Centralized environment configuration
│   │   └── models.config.js  # Curated models list
│   ├── services/
│   │   └── openrouter.service.js  # OpenRouter API adapter
│   ├── controllers/
│   │   ├── chat.controller.js     # Chat and streaming logic
│   │   ├── models.controller.js   # Model listing
│   │   └── health.controller.js   # Health check
│   ├── routes/
│   │   ├── api.routes.js     # API endpoints
│   │   └── index.js          # Route mapping
│   └── cli/
│       └── chat-cli.js       # Terminal interface
│
├── public/                   # Frontend (Static HTML/CSS/JS)
│   ├── index.html            # Main chat application interface
│   ├── about.html            # Marketing and project info page
│   ├── css/
│   │   ├── style.css         # Application design system
│   │   └── about.css         # Landing page specific styles
│   └── js/app.js             # Client logic and SSE parsing
│
└── examples/
    ├── quickstart.js         # API integration example
    └── openrouter.types.ts   # TypeScript definitions
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
You can generate an API key at [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)

### 2. Install and Start
```bash
npm install
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to access the interface.
Visit **[http://localhost:3000/about.html](http://localhost:3000/about.html)** for the marketing overview.

### 3. Use the Terminal CLI
```bash
npm run cli
```

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repository into your [Vercel](https://vercel.com) account.
3. In the Vercel dashboard, add the following environment variables:
   - `OPENROUTER_API_KEY` (Your OpenRouter API key)
   - `APP_URL` (Your Vercel domain, e.g., `https://atlas.vercel.app`)
4. Deploy the project.

Note: Ensure your `.env` file is never committed to version control.

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Main Chat UI |
| `GET` | `/about.html` | Marketing Overview |
| `GET` | `/api/health` | Status check for the service |
| `GET` | `/api/models` | List of configured models |
| `POST` | `/api/chat` | Chat completion endpoint (SSE streaming) |
| `POST` | `/api/title` | Conversation title generation |

---

## Security Context

- API keys are securely managed server-side and are never exposed to the client browser.
- Hardcoded secrets are explicitly avoided in the source code.
- Cross-Origin Resource Sharing (CORS) is restricted to configured allowed origins.
- The frontend client only communicates directly with your hosted backend, preventing unauthorized use of your API key.

---

## License

MIT - Built by [Vylex Technologies](https://vylex.co.za)
