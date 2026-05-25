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
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Chativo'ya hoş geldin</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {plan ? `${plan.toUpperCase()} planı için hesap aç.` : "Hesap oluştur, 5 dakikada ilk botunu yayınla."}
        </p>
      </div>
      <RegisterForm plan={plan} />
    </div>
  );
}
