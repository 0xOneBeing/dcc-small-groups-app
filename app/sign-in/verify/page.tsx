import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { VerifyTotpForm } from "@/components/auth/VerifyTotpForm";
import { getCurrentSession } from "@/lib/auth/session";

export default async function VerifyTotpPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");
  if (session.mfaVerifiedAt) redirect("/admin");

  return (
    <AuthShell
      subtitle="Alimosho Region"
      roleLabel="Super Admin"
      headline="Verify it's you before we open the hierarchy tools."
      blurb="Super Admin accounts control the entire organisation hierarchy, so every sign-in needs a second factor from your authenticator app."
      rightPane={<VerifyTotpForm />}
    />
  );
}
