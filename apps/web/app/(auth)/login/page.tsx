import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Giriş Yap" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <div className="space-y-7">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tekrar hoş geldin</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Chativo hesabına giriş yap.
        </p>
      </div>

      {error === "callback_failed" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Bağlantı doğrulanamadı. Lütfen tekrar dene.
        </div>
      )}

      <LoginForm next={next} />
    </div>
  );
}
