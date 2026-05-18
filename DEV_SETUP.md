# Chativo.ai — Yeni PC'de Geliştirmeye Devam Etme

Bu repo zaten GitHub'da + production Vercel'de. Yeni bir makinede 10-15 dakikada local dev'i ayağa kaldırabilirsin.

## Önkoşullar (her makinede tek seferlik)

| Araç | Versiyon | Kurulum |
|---|---|---|
| Git | 2.40+ | https://git-scm.com/download/win |
| Node.js | 20.10+ (önerilen 22 LTS) | https://nodejs.org/en/download |
| pnpm | 9+ | `npm install -g pnpm` |
| (opsiyonel) Vercel CLI | latest | `npm install -g vercel` |

VS Code veya Cursor önerilir. **GitHub hesabınla makineyi authorize et** (ilk push'ta browser açar).

## Adım 1 — Repo'yu klonla (1 dk)

```powershell
# İstediğin yere git, örn.:
cd C:\Users\KullaniciAdin\

# Repo'yu klonla
git clone https://github.com/emrahapp/chativo.git
cd chativo

# Git identity (eğer global ayarlamadıysan)
git config user.email "emrahapp@gmail.com"
git config user.name "Emrah Usta"
```

## Adım 2 — Bağımlılıkları kur (2-3 dk)

```powershell
pnpm install
```

Bu komut tüm workspace paketlerini (`apps/web`, `packages/shared`, `packages/db`) bir kerede kurar.

## Adım 3 — Environment variables (en kritik adım)

`.env.local` dosyası **`apps/web/.env.local`** yolunda olmalı (workspace root değil, web app içinde).

### En kolay yol: Vercel CLI ile pull

```powershell
cd C:\path\to\chativo
vercel login                    # browser ile authorize
vercel link                     # mevcut projeyi seç: "chativo-app"
vercel env pull apps/web/.env.local --environment=development
```

Bu komut Vercel'deki tüm production env vars'ı **otomatik** olarak `apps/web/.env.local`'e indirir. Tek seferlik kopyalama derdi olmaz, her zaman senkron kalır.

### Alternatif: manuel kopyala

Eski PC'deki `.env.local`'i USB / Google Drive / OneDrive ile yeni PC'ye taşı, yeni PC'deki `apps/web/.env.local`'e koy.

> ⚠️ `.env.local` ASLA git'e gitmez — sadece bu yöntemlerden biriyle taşırsın.

## Adım 4 — Dev server'ı başlat

```powershell
pnpm dev
```

Tarayıcıda → http://localhost:3000

Auth + RAG + widget — hepsi production Supabase'ine bağlı (aynı veri, aynı kullanıcılar). Yani **eski PC'de oluşturduğun chatbot'lar burada da görünür**.

## Adım 5 — Commit + push akışı

```powershell
# Bir özellik geliştir...
git add .
git commit -m "feat: ..."
git push                        # Vercel otomatik production'a deploy eder
```

Push olur olmaz Vercel webhook'u tetiklenir, ~2 dk içinde www.chativo.ai canlıda.

---

## Aktif servisler

| Servis | URL / Bilgi | Erişim |
|---|---|---|
| **Production** | https://www.chativo.ai | Public |
| **Vercel Dashboard** | https://vercel.com/moleajans/chativo-app | GitHub login |
| **Supabase Project** | https://supabase.com/dashboard | mole@gmail.com |
| **GitHub Repo** | https://github.com/emrahapp/chativo | emrahapp |
| **OpenAI Billing** | https://platform.openai.com | Kayıt mail'in |

## Production durumu (son commit: `bc6fbab`)

✅ **Live:** Landing + Auth + Dashboard + Wizard + RAG + Widget + Conversations + Leads + Analytics + Admin + Allowed domains editor
🟡 **Stripe:** Kod hazır, env vars eksik — see [STRIPE_SETUP.md](STRIPE_SETUP.md)
🟡 **TypeScript build check:** Geçici kapalı (`next.config.ts` → `ignoreBuildErrors: true`); polish pass'ta gerçek hataları fix etmek gerek
🟡 **Upstash Redis rate limit:** Henüz bağlı değil (şu an in-memory)
🔴 **iyzico:** Başlamadı
🔴 **WhatsApp / Telegram channels:** Başlamadı

## Sırada ne yapılabilir? (Faz 2 seçenekleri)

1. **Polish:** TypeScript clean + Upstash + file upload prod test
2. **iyzico TR ödeme** entegrasyonu
3. **WhatsApp Cloud API** kanal genişlemesi
4. **Sitemap crawler + auto-sync** — bot kalitesini büyük arttırır
5. **White-label + BYOK + multi-model** — agency satışı için

## Sık karşılaşılan sorunlar

| Problem | Çözüm |
|---|---|
| `pnpm: command not found` | `npm install -g pnpm` |
| Build "OPENAI_API_KEY missing" | `apps/web/.env.local` eksik veya `vercel env pull` yapılmadı |
| Dev'de "Supabase URL required" | `apps/web/.env.local` `apps/web/` klasöründe değil — root'tan oraya taşı |
| Git push GitHub auth ister | Browser auth'u tamamla veya Personal Access Token kullan |
| Port 3000 dolu | `pnpm dev` farklı port'la: `pnpm --filter @chativo/web dev -- -p 3001` |

## Claude Code ile devam

Eğer Claude Code'u yeni makinede de kullanıyorsan, repo'da [CLAUDE.md](CLAUDE.md) var — proje bağlamını otomatik okur. İlk sohbette "Faz 2'den şu sprint'e devam edelim" der yeter, Claude state'i bilir.
