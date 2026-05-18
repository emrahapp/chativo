# Chativo.ai — Production Deploy Rehberi

Bu rehber MVP'yi Vercel'e deploy etmek için gereken tüm adımları içerir. Tahmini süre: **30-45 dakika**.

## 🎯 Genel Mimari (Production)

```
chativo.ai (Vercel)  ──→  Supabase Cloud (DB + Auth + Storage)
       │                          │
       ├─→ OpenAI API             │
       └─→ Upstash Redis (rate limit, opsiyonel)
```

| Servis | Görevi | Ücretsiz tier |
|---|---|---|
| **Vercel** | Web + API hosting | 100 GB bandwidth, hobby plan free |
| **Supabase** | Postgres + Auth + Storage | 500 MB DB, 1 GB storage free |
| **Upstash Redis** | Rate limit (opsiyonel) | 10k komut/gün free |
| **OpenAI** | LLM + embeddings | Bakiyeli — ~$10/ay başlangıç |

---

## Aşama 1 — Git & GitHub (5 dk)

### 1.1 Git init
```powershell
cd C:\Users\mole\chativo
git init
git add .
git commit -m "feat: Chativo.ai Faz 1 MVP"
```

### 1.2 GitHub repo
1. https://github.com/new → repo adı: `chativo` (private veya public — fark etmez)
2. **Don't initialize** (README/license/gitignore eklemeden)
3. Sayfanın gösterdiği komutları çalıştır:
```powershell
git remote add origin https://github.com/SENIN-KULLANICI-ADIN/chativo.git
git branch -M main
git push -u origin main
```

> ⚠️ `.env.local` `.gitignore`'da, asla push olmayacak. Sadece `.env.example` gidiyor — bu doğru.

---

## Aşama 2 — Vercel Deploy (10 dk)

### 2.1 Hesap aç
1. https://vercel.com/signup → GitHub ile giriş yap (Hobby/Free plan yeterli)
2. **Authorize Vercel** → repo erişimi ver

### 2.2 Projeyi import et
1. Dashboard → **Add New → Project**
2. `chativo` repo'sunu seç → **Import**
3. **Framework Preset:** Next.js (otomatik algılar)
4. **Root Directory:** `apps/web` **DEĞİL** — workspace root bırak. `vercel.json` zaten doğru yere bakıyor.
5. **Build Command:** `pnpm --filter @chativo/web build` (vercel.json'dan otomatik)
6. **Output Directory:** `apps/web/.next` (vercel.json'dan)

### 2.3 Environment Variables
"Environment Variables" sekmesini aç, `.env.local`'deki **server-only** değerleri kopyala. Şu değişkenler **mutlaka** olmalı:

| Key | Value | Notlar |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://chativo.vercel.app` (ilk deploy) veya `https://chativo.ai` | Sonra güncelleyeceksin |
| `NEXT_PUBLIC_WIDGET_URL` | `${NEXT_PUBLIC_APP_URL}/widget.js` | Aynı domain |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `tr` | |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL'in | `.env.local`'dan al |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key | `.env.local`'dan al |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | **Production'da Vercel'in "Encrypted" işaretli olsun** |
| `OPENAI_API_KEY` | OpenAI key | |
| `OPENAI_CHAT_MODEL` | `gpt-4o-mini` | |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | |
| `ENCRYPTION_KEY` | 64 karakter hex | `.env.local`'dakini kopyala |
| `ADMIN_EMAILS` | `senin@email.com` | Admin paneli için |

İsteğe bağlı (sonra eklersin):
- `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — production rate limit için
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` — ödeme için
- `RESEND_API_KEY` — özel mailer için (Supabase kendi mail sunucusunu kullanabilir)

### 2.4 Deploy
**Deploy** butonuna bas. İlk build 3-5 dk sürer.

Bittiğinde Vercel sana bir URL verir, örn: `chativo-xxxx.vercel.app`. Aç → landing page görünmeli.

---

## Aşama 3 — Supabase Auth'u Production URL'siyle Eşle (3 dk)

Şu an Supabase, kayıt sonrası email doğrulamayı `localhost:3000/api/auth/callback`'e yönlendiriyor. Production için güncelle:

1. Supabase Dashboard → **Authentication → URL Configuration**
2. **Site URL:** `https://chativo-xxxx.vercel.app` (Vercel'in verdiği URL — sonra custom domain ile değiştirirsin)
3. **Redirect URLs:** şunları **ekle** (eski localhost satırlarını silme — dev de çalışsın):
   ```
   https://chativo-xxxx.vercel.app/api/auth/callback
   https://chativo-xxxx.vercel.app/**
   https://*.vercel.app/**            ← preview deploy'lar için
   ```
4. **Save**

### Email template'lerini güncelle (opsiyonel)
**Authentication → Email Templates** → "Confirm signup" template'inde `{{ .ConfirmationURL }}` zaten doğru parametreyi alır, dokunmana gerek yok.

---

## Aşama 4 — Custom Domain (10 dk, isterseniz)

Henüz `chativo.ai` DNS'in kayıtlıysa:

### 4.1 Vercel'de domain ekle
1. Project → **Settings → Domains**
2. **Add** → `chativo.ai` ve `www.chativo.ai`
3. Vercel sana DNS kaydı verir (A record veya CNAME)

### 4.2 DNS sağlayıcında ayarla
Cloudflare / GoDaddy / Namecheap / vs.:
- **A record:** `@` → Vercel'in verdiği IP
- **CNAME:** `www` → `cname.vercel-dns.com`

10-30 dakika sonra propagasyon biter, Vercel otomatik SSL alır.

### 4.3 Env vars'ı yeni domain'e çevir
Vercel **Settings → Environment Variables**:
- `NEXT_PUBLIC_APP_URL` → `https://chativo.ai`
- `NEXT_PUBLIC_WIDGET_URL` → `https://chativo.ai/widget.js`

Sonra **Redeploy** (Deployments → latest → ⋯ → Redeploy).

Ayrıca **Supabase Auth → URL Configuration**'a `https://chativo.ai/api/auth/callback` ve `https://chativo.ai/**`'i ekle.

---

## Aşama 5 — Smoke Test (5 dk)

Production URL'den:
- [ ] `/` landing açılıyor
- [ ] `/api/health` → `{"ok": true, ...}` döner
- [ ] `/register` ile yeni hesap aç → email doğrulama maili gelir → tıkla → `/overview` açılır
- [ ] Yeni chatbot oluştur, URL ekle, ingest çalışıyor (Carlover veya benzeri test sitesi)
- [ ] `/chatbots/[id]/preview` → widget belirir, mesaj sor, cevap gelir
- [ ] `/conversations` ve `/leads` veri gösterir

Hata olursa:
- Vercel **Deployments → latest → Function Logs** sekmesinden runtime hatalarını gör
- Supabase **Logs → Auth/Database/Edge** runtime hatalarını gör

---

## Aşama 6 — Upstash Redis (opsiyonel, 5 dk)

Production rate limit için. Şu an in-memory rate limit kullanılıyor (Vercel her function instance'ı için ayrı bucket — yatay ölçekte zayıf).

1. https://upstash.com → sign up → **Create database**
2. Region: `eu-central-1` (Frankfurt)
3. Database oluştuktan sonra **REST API** sekmesinden:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Vercel env vars'a ekle → **Redeploy**

(Şu anki kodda Upstash kullanılmıyor — bir sonraki sprint'te `lib/widget/rate-limit.ts`'i Upstash'e bağlayacağım. Şimdilik in-memory yeter.)

---

## Aşama 7 — Sürekli deploy (otomatik)

Artık `main` branch'e push edersen Vercel otomatik deploy eder. Branch'lere push edersen preview deploy oluşturur (her PR için ayrı URL).

```powershell
# Bir özellik ekledikten sonra:
git add .
git commit -m "feat: ..."
git push
# Vercel build başlatır, ~2 dk sonra canlıda.
```

---

## Sık karşılaşılan hatalar

| Sorun | Çözüm |
|---|---|
| Build "OPENAI_API_KEY missing" | Env var eksik, Vercel Settings'ten ekle + Redeploy |
| Kayıt sonrası "callback_failed" | Supabase Auth → Redirect URLs'e production URL eklenmemiş |
| Widget config 404 | `NEXT_PUBLIC_APP_URL` yanlış, widget yanlış domain'e GET atıyor |
| OpenAI 429 | Bakiye yok / rate limit, `platform.openai.com` → Billing |
| Widget yüklenmiyor (host site) | Bot `is_active = false` veya `allowed_domains` listede o domain yok |

---

## Sırada ne var?

Deploy başarılı olduktan sonra:
1. **Stripe price ID'lerini doldur** → ödeme aktif olsun
2. **iyzico entegrasyonu** (TR için)
3. **WhatsApp Cloud API** (kanal genişlemesi)
4. **Sitemap crawler + auto-sync**
5. **White-label** (custom domain müşterileri için)
