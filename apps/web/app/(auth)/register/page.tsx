import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Ücretsiz Başla" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ücretsiz başla</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {plan ? `${plan.toUpperCase()} planı için hesap oluştur.` : "Kredi kartı gerekmez. 5 dakikada ilk botunu yayınla."}
        </p>
      </div>

      <RegisterForm plan={plan} />
    </div>
  );
}
