# Stripe Setup Checklist — Chativo.ai

Faz 2 monetizasyon adımı. Stripe kodu tamamen hazır (`/api/billing/checkout`, `/api/billing/webhook`, `/api/billing/portal`), bu rehber sadece **Stripe Dashboard + env vars** kısmı için.

Tahmini süre: **30 dakika**.

---

## 1) Stripe hesabı (5 dk)

1. https://dashboard.stripe.com/register → kayıt
2. Üst sağda **"Test mode"** AÇIK olsun (sandbox)
3. **Activate your account** — gerçek ödeme almadan önce: business info + bank account
   - TR vergi numarası destekleniyor
   - Şimdilik atla, test mode'da kalmak yeter

## 2) Webhook secret (5 dk)

Local dev için:
```powershell
# Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/billing/webhook
```
Komut sana `whsec_xxxxxxx` verir, `.env.local`'e `STRIPE_WEBHOOK_SECRET` olarak yaz.

Production için:
1. **Developers → Webhooks** → **Add endpoint**
2. **Endpoint URL:** `https://www.chativo.ai/api/billing/webhook`
3. **Events to send** → "Select events" → şunları seç:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Add endpoint**
5. Endpoint detay sayfasında **"Signing secret"** → **Reveal** → kopyala (`whsec_...`)
6. Vercel env vars'a ekle: `STRIPE_WEBHOOK_SECRET=whsec_...`

## 3) Products + Prices (10 dk)

Stripe Dashboard → **Products → Add product**:

### Product 1: Starter
- **Name:** `Chativo Starter`
- **Description:** `1 chatbot · 1.000 mesaj/ay · Web + dosya eğitimi`
- **Pricing model:** Recurring
- Add price:
  - **$19 USD / month** → Save → kopyala `price_xxx` → `STRIPE_PRICE_STARTER_MONTHLY`
- Aynı product'a yıllık ekle:
  - **+ Add another price** → `$190 USD / year` → `STRIPE_PRICE_STARTER_YEARLY`

### Product 2: Pro
- **Name:** `Chativo Pro`
- **Description:** `5 chatbot · 10.000 mesaj/ay · Branding kaldır · Ekip erişimi`
- `$49 / month` → `STRIPE_PRICE_PRO_MONTHLY`
- `$490 / year` → `STRIPE_PRICE_PRO_YEARLY`

### Product 3: Agency
- **Name:** `Chativo Agency`
- **Description:** `25 chatbot · 50.000 mesaj/ay · White-label hazırlığı · Yüksek limitler`
- `$149 / month` → `STRIPE_PRICE_AGENCY_MONTHLY`
- `$1490 / year` → `STRIPE_PRICE_AGENCY_YEARLY`

## 4) API key (1 dk)

**Developers → API keys** → **Secret key** → **Reveal** → kopyala (`sk_test_...` test mode'da).

## 5) Customer Portal aktifleştir (3 dk)

Stripe-hosted Customer Portal sayesinde kullanıcı kendi plan/kart/iptal işlemlerini yapacak.

1. **Settings → Billing → Customer portal**
2. **Activate test link**
3. **Functionality** kısmında:
   - ✅ Customers can update payment methods
   - ✅ Customers can switch plans (Starter ↔ Pro ↔ Agency — products'ı seç)
   - ✅ Customers can cancel subscriptions
4. **Save**

## 6) Vercel env vars (3 dk)

Vercel → `chativo-app` → **Settings → Environment Variables** → şunları ekle:

```
STRIPE_SECRET_KEY=sk_test_...                          (Sensitive)
STRIPE_WEBHOOK_SECRET=whsec_...                        (Sensitive)
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_AGENCY_MONTHLY=price_...
STRIPE_PRICE_AGENCY_YEARLY=price_...
```

Tümünü "Production + Preview + Development" çevrelerine ekle.

## 7) Redeploy (1 dk)

Vercel **Deployments** → en üst satırın **⋯ → Redeploy** (env vars değişikliği yeni build gerek).

## 8) Test (5 dk)

1. https://www.chativo.ai/billing → kart kartlarını gör, "Yükselt" butonu artık aktif
2. **Yükselt** → Stripe Checkout'a yönlendirilirsin
3. Test kartı: **`4242 4242 4242 4242`** · `12/30` · `123` · ZIP `00000`
4. Ödeme tamamlanır → `/billing/success`'e döner
5. Webhook tetiklenir → DB'de `organizations.plan_id` güncellenir (gerçek zamanlı)
6. `/billing` → "Aboneliği yönet" butonu aktif → Stripe Portal'a gider

## 9) Live mode'a geçiş (gerçek müşteri için, sonra)

Test mode'da yeterince güven verdiyse:

1. Stripe Dashboard → sağ üst **Test mode** kapat → **Live mode**
2. Live mode'da yeni keys + webhook + products oluştur (test'tekiler çalışmaz)
3. Vercel env vars'ı **live** keys ile değiştir (`sk_live_...`)
4. Stripe Dashboard'da hesabını **Activate** et (business info, bank account)

---

## Yardımcı linkler

- **Stripe API keys:** https://dashboard.stripe.com/test/apikeys
- **Stripe Webhooks:** https://dashboard.stripe.com/test/webhooks
- **Stripe Products:** https://dashboard.stripe.com/test/products
- **Stripe Customer Portal:** https://dashboard.stripe.com/test/settings/billing/portal
- **Test kartları:** https://stripe.com/docs/testing#cards
