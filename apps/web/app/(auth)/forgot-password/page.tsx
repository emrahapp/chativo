import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = { title: "Şifremi Unuttum" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Şifreni mi unuttun?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          E-posta adresini yaz, sana sıfırlama bağlantısı gönderelim.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
