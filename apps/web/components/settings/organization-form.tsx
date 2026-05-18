"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrganizationAction, type AccountFormState } from "@/app/actions/account";

export function OrganizationForm({
  initialName,
  slug,
  planId,
  canEdit,
}: {
  initialName: string;
  slug: string;
  planId: string;
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState<AccountFormState | null, FormData>(updateOrganizationAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Ad</Label>
        <Input id="org-name" name="name" defaultValue={initialName} required maxLength={120} disabled={!canEdit} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-slug">Slug</Label>
        <Input id="org-slug" value={slug} disabled />
        <p className="text-xs text-muted-foreground">Slug değişikliği şu an desteklenmiyor.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-plan">Plan</Label>
        <Input id="org-plan" value={planId.toUpperCase()} disabled />
      </div>

      {state && (state.ok ? (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.info ?? "Kaydedildi."}</span>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error ?? "Hata"}</span>
        </div>
      ))}

      {canEdit && <SubmitButton />}
      {!canEdit && (
        <p className="text-xs text-muted-foreground">Düzenleme yetkisi sadece owner ve admin'lerde.</p>
      )}
    </form>
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
