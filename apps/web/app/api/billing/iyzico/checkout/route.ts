import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/get-session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { initCheckoutForm, isIyzicoConfigured } from "@/lib/iyzico/client";
import { getIyzicoPlan } from "@/lib/iyzico/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const BodySchema = z.object({
  planId: z.enum(["starter", "pro", "agency"]),
  cadence: z.enum(["monthly", "yearly"]).default("monthly"),
});

export async function POST(req: NextRequest) {
  const session = await requireSession();

  if (!isIyzicoConfigured()) {
    return Response.json({ error: "iyzico henüz aktif değil." }, { status: 503 });
  }
  if (session.role !== "owner" && session.role !== "admin") {
    return Response.json({ error: "Yetki yok" }, { status: 403 });
  }

  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); }
  catch { return Response.json({ error: "Geçersiz plan" }, { status: 400 }); }

  const plan = getIyzicoPlan(body.planId, body.cadence);
  if (!plan) return Response.json({ error: "Plan bulunamadı" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  // conversationId = our identifier for the callback handler.
  // Format: org-id:plan-id:cadence:timestamp — easy to parse later.
  const conversationId = [session.organizationId, body.planId, body.cadence, Date.now()].join(":");
  const basketId = `org-${session.organizationId}`;

  // Look up org for buyer details
  const admin = getSupabaseAdmin();
  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", session.organizationId)
    .single();

  try {
    const result = await initCheckoutForm({
      locale: session.locale === "en" ? "en" : "tr",
      conversationId,
      price: plan.priceTry,
      currency: "TRY",
      basketId,
      callbackUrl: `${appUrl}/api/billing/iyzico/callback`,
      buyer: {
        id: session.userId,
        name: session.name?.split(" ")[0] ?? "Chativo",
        surname: session.name?.split(" ").slice(1).join(" ") || "Müşteri",
        email: session.email,
        identityNumber: "11111111111",     // TC required; sandbox accepts placeholder; user'a sorulabilir
        registrationAddress: org?.name ?? "Türkiye",
        city: "Istanbul",
        country: "Turkey",
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1",
      },
      basketItems: [
        { id: `${body.planId}-${body.cadence}`, name: plan.label, category1: "SaaS", price: plan.priceTry },
      ],
    });
    return Response.json({ url: result.paymentPageUrl, token: result.token });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "iyzico hatası" },
      { status: 500 }
    );
  }
}
