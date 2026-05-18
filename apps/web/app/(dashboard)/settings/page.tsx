import { requireSession } from "@/lib/auth/get-session";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { OrganizationForm } from "@/components/settings/organization-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireSession();
  const canEditOrg = session.role === "owner" || session.role === "admin";

  return (
    <>
      <PageHeader title="Settings" description="Hesap ve organizasyon ayarların." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Adın ve dil tercihin.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initialName={session.name ?? ""}
              initialEmail={session.email}
              initialLocale={session.locale}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organizasyon</CardTitle>
            <CardDescription>Çalışma alanı ayarların.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationForm
              initialName={session.organizationName}
              slug={session.organizationSlug}
              planId={session.planId}
              canEdit={canEditOrg}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
