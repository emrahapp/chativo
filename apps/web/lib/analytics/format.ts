// Pure formatting helpers — safe to import from client components.

export function formatDateShort(iso: string, locale = "tr-TR"): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}
