"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordRequestAction, type AuthState } from "@/app/actions/auth";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<AuthState | null, FormData>(resetPasswordRequestAction, null);

  if (state?.ok && state.info) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        <h2 className="text-lg font-semibold text-emerald-900">E-postanı kontrol et</h2>
        <p className="text-sm text-emerald-800">{state.info}</p>
        <Link href="/login" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Giriş sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@chativo.ai" />
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton />

      <Link href="/login" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Giriş sayfasına dön
      </Link>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
    </Button>
  );
}
