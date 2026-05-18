"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction, type AuthState } from "@/app/actions/auth";

export function RegisterForm({ plan }: { plan?: string }) {
  const [state, formAction] = useActionState<AuthState | null, FormData>(signUpAction, null);
  const [showPassword, setShowPassword] = useState(false);

  if (state?.ok && state.info) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        <h2 className="text-lg font-semibold text-emerald-900">Doğrulama gerekli</h2>
        <p className="text-sm text-emerald-800">{state.info}</p>
        <Link href="/login" className="text-sm font-medium text-emerald-700 hover:underline">
          Giriş sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {plan && <input type="hidden" name="plan" value={plan} />}

      <div className="space-y-2">
        <Label htmlFor="name">Ad Soyad</Label>
        <Input id="name" name="name" type="text" autoComplete="name" placeholder="Adınız" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@chativo.ai"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Şifre</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="En az 8 karakter"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label="Şifreyi göster/gizle"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          En az 8 karakter. Bir büyük harf ve rakam önerilir.
        </p>
      </div>

      <input type="hidden" name="locale" value="tr" />

      {state?.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton />

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        Kaydolarak{" "}
        <Link href="/terms" className="underline hover:text-foreground">
          Kullanım Şartları
        </Link>{" "}
        ve{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          Gizlilik Politikası
        </Link>
        'nı kabul etmiş olursunuz.
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" variant="gradient" className="w-full">
      {pending ? "Hesap oluşturuluyor..." : "Ücretsiz Hesap Oluştur"}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </Button>
  );
}
