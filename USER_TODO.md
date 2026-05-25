# Senin Yapacakların — Chativo.ai

Bu dosya, Faz 2 infrastructure'ının tamamı kodda hazırken senin **manuel olarak** halletmen gereken 3rd party setup'larını içerir. Her madde için: aciliyet + tahmini süre + ne kazanırsın.

> Her şeyi aynı anda yapmana gerek yok. Önem sırasına göre tikle.

---

## 🔴 Acil — production'ı çalışır halde tutar

### 1) Supabase migration 0003'ü çalıştır (5 dk · zorunlu)

Yeni Faz 2 tabloları/kolonları için migration kuruldu. Supabase Dashboard → **SQL Editor** → `packages/db/migrations/0003_faz2_infra.sql` içeriğini yapıştır + Run.

Yeni eklenenler:
- `organizations`'a Telegram/WhatsApp token alanları, BYOK key alanları, iyzico ID'leri, custom domain
- `chatbots.model_provider`, `chatbots.ai_paused`
- `conversations.ai_paused`, `conversations.handed_over_at`
- `conversation_notes`, `channel_events`, `webhook_deliveries` tabloları
- `billing_events.provider` (stripe/iyzico ayrımı)

> ⚠️ Bu migration olmadan yeni özelliklerden hiçbiri çalışmaz.

### 2) Vercel'de eksik env vars'ı ekle (5 dk · zorunlu)

Vercel → Settings → Environment Variables → ekle:
- `IYZICO_API_KEY` (sandbox şimdilik boş bırakabilirsin, ama key olmadan iyzico endpoint'i 503 döner)
- `IYZICO_SECRET_KEY`
- `IYZICO_BASE_URL` = `https://sandbox-api.iyzipay.com`

Stripe price ID'leri için [STRIPE_SETUP.md](STRIPE_SETUP.md)'ye bak — orada full rehber var.

---

## 🟡 Önemli — gelir için kritik

### 3) Stripe live mode (90 dk · gelir kapısı)

Detaylı: [STRIPE_SETUP.md](STRIPE_SETUP.md).

Özet:
1. https://dashboard.stripe.com'da hesabı **Activate** et (business info + bank account)
2. **Live mode'a geç** → Test mode'daki ayarları aynısıyla live'da kur
3. Live API key'lerini (`sk_live_...`) Vercel'e koy
4. Live webhook endpoint'i ekle: `https://chativo.ai/api/billing/webhook`
5. Customer Portal'ı live mode için aktifleştir
6. Redeploy

Beklenen sonuç: `/billing`'de "Yükselt" canlı kart kabul ediyor.

### 4) iyzico merchant onayı + sandbox test (1-3 gün)

1. https://www.iyzico.com → **Üye Ol** → işletme türü seç (Şahıs/Şirket)
2. Vergi belgeleri yükle (vergi levhası, kimlik, vs)
3. Onay: 1-3 iş günü
4. Onaylanınca: **Merchant Panel → Ayarlar → API Anahtarları**
5. Sandbox keys ile başla:
   - `IYZICO_API_KEY=sandbox-xxx`
   - `IYZICO_SECRET_KEY=sandbox-xxx`
   - `IYZICO_BASE_URL=https://sandbox-api.iyzipay.com`
6. Vercel'e ekle + Redeploy
7. Test: `/billing` → TRY butonu (UI eklenince) → 3DS test kartı `5528790000000008` `12/30` `123`
8. Production keys'e geç + `IYZICO_BASE_URL=https://api.iyzipay.com`

> Not: iyzico'ya callback URL olarak `https://chativo.ai/api/billing/iyzico/callback` ver. Webhook gerekmiyor — callback yeterli.

### 5) WhatsApp Cloud API — Meta Business doğrulaması (7-14 gün)

1. https://business.facebook.com → işletme hesabı aç (şirket bilgileri, vergi numarası, web sitesi)
2. **Meta Business Verification** başlat (vergi belgesi yükle)
3. Onay: 1-2 hafta — Meta resmi doğrulama yapıyor
4. Onaylanınca: **WhatsApp Business Platform → Get Started**
5. Test phone number ekle (kendi telefonun OK, production'da müşterinin)
6. **Permanent access token** oluştur
7. Webhook URL: `https://chativo.ai/api/whatsapp/webhook`
8. Verify token: kendi belirlediğin random string (her org için ayrı)
9. Chativo'da: `/settings` → Channels → WhatsApp → token + phone_id + verify_token gir
10. Meta paneli "Subscribe to webhooks" tıklarken verify token doğrulanır

> Bonus: Test mode'da Meta sadece 5 telefona izin veriyor. Production'da daha fazlası için "Phone number" satın al (~$0.005/msg).

### 6) Telegram bot (5 dk · kolay başlangıç)

1. Telegram'da [@BotFather](https://t.me/BotFather) aç
2. `/newbot` → bot adı → username (sonu `_bot` olmalı)
3. Sana bir token verir (`123456:ABCdef...`)
4. Chativo'da: `/settings` → Channels → Telegram → token yapıştır → Bağla
5. Sistemin otomatik webhook'u kurar
6. Telegram'da botuna mesaj at — RAG cevabı gelir

> Telegram'a yazılan her mesaj, web widget'taki kayıt sayacına da eklenir (plan limiti aynı havuz).

---

## 🔵 Faydalı — kalite iyileştirir

### 7) Upstash Redis — production rate limit (5 dk)

Vercel multi-instance'ta in-memory rate limit yetersiz.

1. https://upstash.com → Sign up → **Create database**
2. Region: `eu-central-1`
3. **REST API** sekmesinden:
   - `UPSTASH_REDIS_REST_URL=https://YOUR-DB.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN=...`
4. Vercel env vars'a ekle
5. Redeploy

> Code zaten `@upstash/ratelimit` paketine sahip; env vars eklenince otomatik aktive olur (Faz 2 polish sprint'inde rate-limit.ts'i Upstash'e bağlayacağım).

### 8) Resend — email bildirimleri (10 dk)

Live agent handoff'ta yeni mesaj geldiğinde agent'a email atmak için.

1. https://resend.com → Sign up
2. **API Keys → Create API Key** → `re_xxx`
3. Vercel'e ekle: `RESEND_API_KEY=re_xxx`, `EMAIL_FROM=noreply@chativo.ai`
4. **Domain verification** (chativo.ai için SPF + DKIM TXT kayıtları ekle name.com'a)

### 9) BYOK (Bring Your Own Key) — opsiyonel (5 dk)

Müşterilerine Anthropic Claude veya OpenRouter modeli sunmak istersen:

1. Settings → BYOK sekmesi (UI ile eklenecek polish sprint'inde)
2. Anthropic veya OpenRouter API key gir
3. Bot detail → "Model" sekmesinden ilgili modeli seç

Bu modda **müşterin kendi key'ini kullanır**, senin OpenAI faturanı şişirmez.

### 10) Custom domain (per-müşteri / agency) — opsiyonel (15 dk her müşteri için)

White-label kullanım için: müşteri `chat.mucke.com.tr` gibi domain bağlayabilsin.

Sen yapacaksın:
1. Müşterinin domain'i için Vercel'de Domains paneline ekle (manuel veya Vercel API ile programmatic)
2. Müşteriye CNAME bilgisi ver: `chat.mucke.com.tr → cname.vercel-dns.com`
3. SSL otomatik gelir
4. Settings → Custom domain alanına kaydet (DB column var: `organizations.custom_domain`)

---

## ⚪ Polish — sonraya bırakılabilir

### 11) TypeScript build check'i geri aç

Şu an `next.config.ts` → `typescript.ignoreBuildErrors: true`. Production çalışıyor ama bilgisayar tarafı tip hatalarını gizleyebiliyor. Polish sprint'inde:
1. `pnpm build` lokalde çalıştır
2. Çıkan tip hatalarını teker teker düzelt
3. `ignoreBuildErrors: false` yap
4. Push, build'in hâlâ geçtiğini gör

### 12) Next.js 15.1.6 → 15.2.x'e bump

Yeni minor sürümler güvenlik patch'leri içeriyor. Sonra:
```powershell
pnpm --filter @chativo/web update next
```

### 13) iyzico'da subscription products oluşturmak (recurring billing için)

Şu anki çözüm: tek seferlik 1 aylık ödeme. Otomatik yenileme için iyzico'nun **subscription products**'ını kullanmak lazım — Merchant Panel'den ürün oluşturup productReferenceCode al, kodda `/v2/subscription/checkoutform/initialize` endpoint'ine geç.

---

## 🚫 Yapmaman Gerekenler

- `.env.local`'i git'e push **etme** — secret'lar uçar
- Stripe live'a geçmeden test kart'larla canlı işlem deneme
- WhatsApp'ı Meta onayı gelmeden production'da etkinleştirme — webhook çalışmaz
- BYOK key'lerini plaintext logla **bastırma** — encrypt et (kod zaten yapıyor)

---

## 🎯 Önerilen sıra

1. **Bugün:** #1 (migration), #2 (env vars), #6 (Telegram) — anında değer
2. **Bu hafta:** #3 (Stripe live), #7 (Upstash), #4 (iyzico hesap başvurusu)
3. **Bu ay:** #5 (WhatsApp Meta onay), #8 (Resend), #11 (TS polish)
4. **Müşteri talebine göre:** #9 (BYOK), #10 (custom domain)

Yapacaklarını tikledikçe bu dosyayı güncelle. Sorun olursa CLAUDE.md'de bağlam var, Claude Code ile devam edebilirsin.
