import { getServerDictionary } from "@/lib/i18n/server";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Features } from "@/components/marketing/features";
import { UseCases } from "@/components/marketing/use-cases";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { CTA } from "@/components/marketing/cta";

export default async function HomePage() {
  const { locale, t } = await getServerDictionary();
  return (
    <>
      <Hero t={t} locale={locale} />
      <HowItWorks t={t} />
      <Features t={t} />
      <UseCases t={t} />
      <Pricing t={t} />
      <FAQ t={t} />
      <CTA t={t} />
    </>
  );
}
