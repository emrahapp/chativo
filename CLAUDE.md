# Chativo.ai — Project Context for Claude

> Bu dosya Claude Code'un her oturum başında okuduğu proje bağlamıdır.
> Yeni bir makinede de aynı state'le devam edebilmeyi sağlar.

## Proje özeti

**Chativo.ai** — AI customer-support chatbot SaaS. Müşteri web sitesini/PDF'lerini/SSS'lerini yüklüyor, RAG-grounded bot tek satır JS ile sitelerine ekleniyor. Chatwith.tools alternatifi, TR + global pazar.

**Kullanıcı:** Emrah Usta (`emrahapp@gmail.com`). Türkçe konuşur, ürün konularını TR'de tartışır; kod identifier'lar EN.

## Mevcut durum (2026-05-19)

**Faz 1 MVP production'da canlı.** https://www.chativo.ai

Çalışan akış: register → email confirm → /overview → "Yeni Chatbot" → wizard (6 adım) → URL/PDF/manual/FAQ ingest → RAG playground → widget embed → conversations + leads + analytics + admin.

Son commit: `bc6fbab` — allowed_domains editor + Stripe setup guide.

## Tech stack

- **Framework:** Next.js 15.1.6 (App Router) + React 19 stable + TypeScript
- **Styling:** Tailwind v3.4 + shadcn-style primitives + Lucide icons + Recharts
- **DB / Auth / Storage:** Supabase Cloud (Postgres + pgvector + RLS + Auth + Storage)
- **LLM:** OpenAI direct (`gpt-4o-mini` chat, `text-embedding-3-small` 1536-dim)
- **Hosting:** Vercel (project: `chativo-app`, region: `fra1`)
- **Repo:** https://github.com/emrahapp/chativo (branch: `main`)
- **Workspace:** pnpm monorepo (apps/web, packages/shared, packages/db)

## Yapılandırma notları

- `.env.local` dosyası **`apps/web/.env.local`** yolunda (workspace root değil)
- Vercel Root Directory: `apps/web` (NOT repo root)
- Production domain: `www.chativo.ai` (Vercel'de www primary, apex 307 redirect)
- `next.config.ts`: `typescript.ignoreBuildErrors: true` (MVP deploy için geçici)
- Admin: profile.is_admin OR ADMIN_EMAILS env'de listede

## Pending — Faz 2 öncelik sırası

1. **Stripe live** — kod hazır (`lib/stripe/*`, `/api/billing/*`), env vars eksik. See [STRIPE_SETUP.md](STRIPE_SETUP.md).
2. **Polish:** TypeScript build check'i geri aç + gerçek type hatalarını fix
3. **Upstash Redis** rate limit (production multi-instance scaling için)
4. **iyzico TR ödeme** (TR pazar için)
5. **WhatsApp Cloud API** (channel adapter)
6. **Sitemap crawler + auto-sync** (knowledge quality boost)
7. **White-label + BYOK + multi-model** (agency mode)

## Önemli mimari kurallar

- **RLS:** Her tenant tablosu `organization_id`'ye göre kısıtlanır via `is_org_member(uuid)`. Service role sadece widget public endpoint'lerinde + workerda kullanılır.
- **LLM provider abstraction:** `lib/llm/provider.ts` — Faz 2'de OpenRouter/Claude/Gemini eklemek için seam mevcut. RAG pipeline `getDefaultProvider()` kullanır.
- **Channel adapter seam:** `conversations.channel` enum'u `web | whatsapp | telegram | slack` içerir. MVP'de sadece `web` yazılır.
- **Source types:** `website | pdf | docx | txt | manual | faq` (Faz 1) + `sitemap | youtube | notion | google_docs | csv | api` (Faz 2, app rejects).
- **Test playground (`/api/chatbots/[id]/test-message`) DB'ye yazmaz**, widget endpoint (`/api/widget/[id]/message`) yazar. Bu bilinçli — test mesajları sayacı kirletmesin.

## Bilinen quirks

- `pnpm install` Windows'ta `url.parse()` deprecation warning verir — zararsız.
- pdf-parse paketinin index.js'i test PDF require eder; ingest'te `pdf-parse/lib/pdf-parse.js`'i doğrudan import ederiz.
- PostgREST nested join'lerinde `conversations ↔ leads` çift FK ambiguity yaşar; iki adımlı fetch kullanırız (see `lib/conversations/repo.ts`).
- `interface X = Y | Z` syntax'ı yok TypeScript'te — `type X = Y | Z` kullan. Bu hata daha önce iki kez yapıldı.

## Devam etmek için

Yeni oturuma "Faz 2'den X sprint'ine devam edelim" diye başla yeter. Claude bu dosyadan state'i okur, son commit'lere bakar, yola devam eder.

Detaylı kurulum: [DEV_SETUP.md](DEV_SETUP.md).
