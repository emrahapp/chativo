"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction, type AccountFormState } from "@/app/actions/account";

export function ProfileForm({
  initialName,
  initialEmail,
  initialLocale,
}: {
  initialName: string;
  initialEmail: string;
  initialLocale: "tr" | "en";
}) {
  const [state, formAction] = useActionState<AccountFormState | null, FormData>(updateProfileAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">İsim</Label>
        <Input id="name" name="name" defaultValue={initialName} placeholder="Adınız" maxLength={120} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" defaultValue={initialEmail} disabled />
        <p className="text-xs text-muted-foreground">E-posta değişikliği için destek ile iletişime geç.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="locale">Arayüz dili</Label>
        <select
          id="locale"
          name="locale"
          defaultValue={initialLocale}
          className="h-11 w-full rounded-xl border border-input bg-white px-4 text-sm text-foreground"
        >
          <option value="tr">Türkçe</option>
          <option value="en">English</option>
        </select>
      </div>

      <Feedback state={state} />
      <SubmitButton />
    </form>
  );
}

function Feedback({ state }: { state: AccountFormState | null }) {
  if (!state) return null;
  if (state.ok) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{state.info ?? "Kaydedildi."}</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{state.error ?? "Hata"}</span>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Kaydediliyor..." : "Kaydet"}
    </Button>
  );
}
