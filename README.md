<div align="center">

  <img src="./public/favicon.svg" alt="Loopr Logo" width="80" height="80" />
  
  # Loopr
  
  **A focused CRM that thinks with you built for solo founders running high-touch outbound.**
  
  [![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://loopr-io.vercel.app/)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
  [![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

</div>

---

## 🚀 Overview

Loopr is a lightweight, AI-assisted CRM designed specifically for solo founders running high-touch outbound campaigns. Unlike bloated CRMs designed for enterprise sales teams, Loopr focuses on what matters: tracking leads, analyzing responses, and getting daily AI-powered briefings on what to do next.

Built with the philosophy of "calm productivity" — no notifications, no streaks, no spam features. Just you and your pipeline.

---

## ✨ Features

- 📊 **Sheet & Kanban Views** — Two views of one pipeline. Edit in place or drag to advance deals.
- 🧠 **AI Daily Briefing** — Each morning, AI surfaces who to follow up with and why.
- 🎯 **Signal Score** — Every lead gets a 0–100 score based on engagement signals.
- 💬 **Reply Analyzer** — Paste any reply to get sentiment analysis and suggested next steps.
- 📈 **Analytics** — KPI cards, pipeline-by-stage chart, conversion funnel, at-risk alerts, and monthly revenue breakdown.
- 🔒 **Your Data, Yours Alone** — Single-tenant architecture. Export to CSV anytime.
- 📱 **Fully Responsive** — Optimized landing page and every dashboard page for mobile, tablet, and desktop.
- 🎨 **Calm by Design** — No notifications, no streaks, no dark patterns.

---

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + custom neobrutal design system |
| Routing | TanStack Router |
| State | TanStack React Query |
| Backend | Supabase (Auth + Database + Edge Functions + RLS) |
| AI | OpenAI / Compatible API (configurable) |
| UI Components | Radix UI primitives + custom components |
| Charts | Custom SVG (no chart library) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Supabase account
- OpenAI API key (for AI features)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/MuhammadTanveerAbbas/loopr.git
cd loopr

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your values (see Environment Variables section below)

# 4. Run the development server
pnpm dev

# 5. Open in browser
http://localhost:5173
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# AI Provider (for AI features)
AI_API_KEY=your_openai_api_key
AI_ENDPOINT=https://api.openai.com/v1/chat/completions
```

Get your keys:
- **Supabase**: https://supabase.com
- **Groq**: https://console.groq.com

---

## 🛡 Reliability & Self-Healing

The `ai-task` edge function self-heals around Groq outages without any app changes:

- **Model discovery** — available Groq models are fetched from the `/models` endpoint and cached server-side (15 min TTL), so the list is never fetched on every request.
- **Automatic model fallback** — if the configured `AI_MODEL` is removed or unsupported, the function refreshes the model list and retries once with a compatible model.
- **Rate limits** — HTTP 429 responses respect `Retry-After` and otherwise use bounded exponential backoff with jitter (max 3 attempts).
- **Transient failures** — network errors, timeouts, and 5xx responses are retried with backoff, then fail gracefully with a friendly in-app message.
- **No secret leakage** — API keys stay server-side and are never logged.

`/health` reports Supabase connectivity with a read-only check and fails clearly (with a 10s timeout) instead of hanging when Supabase is unavailable.

---

## 📁 Project Structure

```
loopr/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/          # Layout components (Sidebar, Navbar, CommandPalette)
│   │   ├── leads/          # Lead-specific components (LeadDrawer)
│   │   └── ui/             # Neobrutal UI primitives (NeuCard, NeuButton, page helpers)
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Supabase client & config
│   ├── lib/                # Utility functions & API clients
│   │   ├── auth.tsx        # Auth context & hooks
│   │   ├── leads-api.ts    # Lead management hooks & stats
│   │   ├── schemas.ts      # Zod validation + input sanitization
│   │   ├── signal-score.ts # Lead scoring helpers
│   │   └── error-service.ts# Error mapping & sanitization
│   ├── routes/             # TanStack Router routes
│   │   ├── index.tsx       # Landing page
│   │   ├── auth.tsx       # Authentication page
│   │   ├── _app.tsx       # Protected app layout
│   │   └── _app.*.tsx     # Dashboard, Leads, Pipeline, Nurture, Closed, AI, etc.
│   ├── router.tsx         # Router configuration
│   ├── routeTree.gen.ts   # Auto-generated route tree
│   └── styles.css         # Tailwind + neobrutal design system
├── supabase/              # Supabase config
│   ├── schema.sql         # Tables, RLS policies & database functions
│   └── functions/         # Edge functions (AI-Tasks, delete-account)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run Vitest test suite |
| `pnpm format` | Format code with Prettier |

---

## 🧪 Testing

The project ships with a Vitest test suite covering schema validation, sanitization, error mapping, and edge functions.

```bash
# Run tests once
pnpm test

# Watch mode
pnpm test:watch
```

---

## 🌐 Deployment

This project is deployed on **Vercel** using TanStack Start + Nitro.

### Deploy Your Own

1. Push your code to GitHub
2. Import your repository at [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects TanStack Start — no extra config needed
4. Add environment variables in the Vercel dashboard
5. Deploy

---

## 🗺 Roadmap

- [x] Sheet & Kanban pipeline views
- [x] AI-powered daily briefings
- [x] Signal Score for leads
- [x] Reply analyzer
- [x] CSV import & export
- [x] Analytics: KPIs, funnel, at-risk alerts, monthly revenue
- [x] Fully responsive landing + dashboard
- [ ] Team/collaboration features
- [ ] Email integration

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Built by The MVP Guy

<div align="center">

**Muhammad Tanveer Abbas**  
SaaS Developer | Building production-ready MVPs in 14–21 days

[![Portfolio](https://img.shields.io/badge/Portfolio-themvpguy.vercel.app-black?style=for-the-badge)](https://themvpguy.vercel.app)
[![Twitter](https://img.shields.io/badge/Twitter-@themvpguy-1DA1F2?style=for-the-badge&logo=twitter)](https://x.com/themvpguy)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/muhammadtanveerabbas)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github)](https://github.com/MuhammadTanveerAbbas)

*If this project helped you, please consider giving it a ⭐*

</div>
