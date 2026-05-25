# Chativo.ai — Project Context for Claude

> Bu dosya Claude Code'un her oturum başında okuduğu proje bağlamıdır.
> Yeni bir makinede de aynı state'le devam edebilmeyi sağlar.

## Proje özeti

**Chativo.ai** — AI customer-support chatbot SaaS. Müşteri web sitesini/PDF'lerini/SSS'lerini yüklüyor, RAG-grounded bot tek satır JS ile sitelerine ekleniyor. Chatwith.tools alternatifi, TR + global pazar.

**Kullanıcı:** Emrah Usta (`emrahapp@gmail.com`). Türkçe konuşur, ürün konularını TR'de tartışır; kod identifier'lar EN.

## Mevcut durum (2026-05-19)

**Faz 1 MVP + Faz 2 infrastructure production'da canlı.** https://www.chativo.ai

Faz 1 çalışan akış: register → email confirm → /overview → "Yeni Chatbot" → wizard (6 adım) → URL/PDF/sitemap/manual/FAQ ingest → RAG playground → widget embed → conversations + leads + analytics + admin.

Faz 2 INFRASTRUCTURE hazır (kod var, 3rd party setup `USER_TODO.md`'de):
- ✅ Sitemap crawler + multi-page ingest (aktif)
- ✅ Telegram channel adapter (token girince aktif)
- ✅ WhatsApp Cloud API adapter (Meta token girince aktif)
- ✅ Outgoing webhooks + HMAC signature (Zapier/Make uyumlu)
- ✅ iyzico TR ödeme (API keys girince aktif)
- ✅ BYOK Anthropic + OpenRouter (encrypted storage)
- ✅ Multi-model select per-bot
- ✅ Live agent handoff (ai_paused, notes, agent reply)
- ✅ Action Builder execute (UI sonraki sprint)
- ✅ Channel-agnostic message ingest (`lib/channels/ingest.ts`)
- ✅ Performance: React `cache()` ile session helper (3-5x hızlı dashboard)
- ⚠️ White-label custom domain: DB column hazır, UI eksik
- ⚠️ Action Builder UI: type'lar + execute hazır, dashboard UI eksik

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

## Pending — Faz 2 sırada bekleyen

Kod hazır + sadece 3rd party setup bekleyen → [USER_TODO.md](USER_TODO.md):
1. Supabase migration 0003 — kullanıcı SQL Editor'de çalıştıracak
2. Telegram bot connect (5 dk)
3. Stripe live mode activation
4. iyzico merchant onayı (1-3 gün)
5. WhatsApp Meta Business doğrulaması (1-2 hafta)
6. Upstash Redis
7. Resend (email)

Kod tarafında pending:
- White-label settings UI (DB column var, UI eksik)
- Action Builder dashboard UI (lib hazır, ekrana eklenmedi)
- Live agent UI on /conversations/[id] (action hazır, UI eksik)
- Channels settings UI (action hazır, settings sekmesi eksik)
- Webhooks settings UI (action hazır, settings sekmesi eksik)
- Sitemap auto-sync (cron + UI)
- TypeScript build check'i geri aç + type cleanup
- Upstash Redis rate-limit'i Upstash'e bağla (paket zaten var)

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
