import { getServerDictionary } from "@/lib/i18n/server";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, t } = await getServerDictionary();
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav t={t} locale={locale} />
      <main className="flex-1">{children}</main>
      <MarketingFooter t={t} />
    </div>
  );
}
