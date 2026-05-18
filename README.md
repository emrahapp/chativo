# Chativo.ai

**Codename:** Agently
**Tagline (TR):** "Web sitenize kendi işinizi bilen yapay zekâ temsilcisi ekleyin."
**Tagline (EN):** "Add an AI support agent trained on your business to your website."

AI customer-support chatbot SaaS — a Chatwith.tools alternative built for the global market with first-class Turkish + English support.

---

## Monorepo layout

```
chativo/
├── apps/
│   ├── web/        # Next.js 15 full-stack (UI + API routes)
│   ├── worker/     # BullMQ worker (scrape, extract, embed)
│   └── widget/     # Vanilla JS widget bundle (served at /widget.js)
├── packages/
│   ├── shared/     # Shared TypeScript types + Zod schemas
│   └── db/         # Supabase migrations + generated types
└── pnpm-workspace.yaml
```

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui pattern |
| DB / Auth / Storage | Supabase Cloud (Postgres + pgvector + Auth + Storage) |
| LLM | OpenAI (`gpt-4o-mini` chat, `text-embedding-3-small` 1536d) |
| Queue | BullMQ + Redis (Upstash) |
| Rate limit | Upstash Ratelimit |
| Hosting (planned) | Vercel (web) + Railway (worker) + Upstash (Redis) + Supabase (DB) |

Provider seams (Faz 2): `lib/llm/provider.ts`, `lib/channels/`, `lib/plans/`.

## Quick start

### 1) Prerequisites

- Node.js ≥ 20.10
- pnpm ≥ 9
- A Supabase project (Free tier is enough to start)
- An OpenAI API key
- (Optional for MVP) Upstash Redis URL

### 2) Install

```bash
pnpm install
```

### 3) Configure environment

```bash
cp .env.example .env.local
# Then fill in SUPABASE_*, OPENAI_API_KEY, REDIS_URL, etc.
```

### 4) Apply the database schema

In Supabase Studio → SQL Editor, paste the contents of:

```
packages/db/migrations/0001_init.sql
```

…and run it. This creates all tables, enums, RLS policies, `pgvector` index, the `match_knowledge_chunks` RPC, and the `on_auth_user_created` trigger that auto-provisions a profile + personal organization for each new signup.

> Storage bucket: create one called **`chativo-uploads`** (private). RLS for the bucket should restrict access to objects prefixed with the user's organization id (configured in the Storage policies UI).

### 5) Run the web app

```bash
pnpm dev
# → http://localhost:3000
```

### 6) (Later) Run the worker

```bash
pnpm dev:worker
```

### 7) (Later) Build the widget bundle

```bash
pnpm build:widget
# outputs apps/web/public/widget.js
```

---

## What's in Faz 1 MVP

- [x] Workspace + design tokens + i18n (TR/EN)
- [x] Landing page (hero, how it works, features, use cases, pricing, FAQ, CTA)
- [x] DB schema (full)
- [ ] Auth pages (login / register / forgot-password) — next turn
- [ ] Dashboard layout (dark sidebar + content)
- [ ] Chatbot CRUD + 6-step wizard
- [ ] Knowledge source ingestion (URL, PDF, DOCX, TXT, manual, FAQ)
- [ ] RAG retrieval + chat API (SSE)
- [ ] Widget bundle + embed page
- [ ] Conversations / Leads / Analytics
- [ ] Plan limit enforcement
- [ ] Admin panel
- [ ] Demo bots seed script

## What's NOT in MVP (Faz 2)

Designed for as architectural seams only:

- Sitemap crawler / auto-sync
- WhatsApp / Telegram / Slack channels (table column exists, app rejects)
- Action Builder (function calling)
- Multi-model / BYOK (interface exists, only OpenAI impl)
- Shopify / WooCommerce / ikas / Trendyol integrations
- Live agent handoff (`conversations.assigned_user_id` exists)
- White-label agency dashboard (`organizations.branding` exists)
- Webhooks / Zapier / public Developer API
- Stripe / iyzico / PayTR (MVP uses mock checkout)

## Security & cost notes (built in)

- **RLS** on every tenant table (`is_org_member()` helper); service role used for widget writes.
- **Domain allowlist** on widget config (`chatbots.allowed_domains`); warn-only for MVP, hard-block opt-in.
- **Rate limit** middleware via Upstash on all widget endpoints.
- **Usage tracking** in `usage_logs` (per chatbot, per day); plan limit checked on every widget message.
- **Embedding idempotency**: re-ingesting a source deletes its old chunks first (no duplicates).
- **Prompt injection guard**: ignore-previous-instructions pattern filter before chat completion.
- **Storage scoping**: uploaded files keyed by `<organization_id>/<chatbot_id>/<file>`.
- **No client-side OpenAI keys** — all LLM calls server-side only.

## License

Proprietary © 2026 Chativo. All rights reserved.
