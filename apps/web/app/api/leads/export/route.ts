import { requireSession } from "@/lib/auth/get-session";
import { listLeadsForOrg } from "@/lib/leads/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireSession();
  const leads = await listLeadsForOrg(session.organizationId, 5000);

  const header = ["created_at", "name", "email", "phone", "company", "message", "bot", "conversation_id"];
  const rows = leads.map((l) => [
    l.created_at,
    l.name ?? "",
    l.email ?? "",
    l.phone ?? "",
    l.company ?? "",
    l.message ?? "",
    l.bot?.name ?? "",
    l.conversation_id ?? "",
  ]);

  const csv = [header, ...rows].map(escapeRow).join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + csv, {     // BOM so Excel reads UTF-8 correctly
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function escapeRow(row: string[]): string {
  return row
    .map((cell) => {
      const s = String(cell ?? "");
      if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    })
    .join(",");
}
