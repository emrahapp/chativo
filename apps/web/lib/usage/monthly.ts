import "server-only";
import { getSupabaseServer } from "@/lib/supabase/server";

/** Returns total messages sent this calendar month for an organization. */
export async function getMonthlyMessageCount(organizationId: string): Promise<number> {
  const supabase = await getSupabaseServer();
  const first = startOfMonthIso();
  const { data, error } = await supabase
    .from("usage_logs")
    .select("message_count")
    .eq("organization_id", organizationId)
    .gte("date", first);
  if (error || !data) return 0;
  return data.reduce((acc, row) => acc + (row.message_count ?? 0), 0);
}

function startOfMonthIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}
