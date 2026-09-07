import { AuthShell } from "@/components/auth/AuthShell";
import { ActivateWizard } from "@/components/auth/ActivateWizard";

export default function ActivatePage() {
  return (
    <AuthShell
      subtitle="Alimosho Region"
      roleLabel="Activation"
      headline="Your account already exists — this just turns it on."
      blurb="Accounts are created by your coordinator's hierarchy upload. Confirm your invitation, choose a password, and you're straight into your dashboard."
      rightPane={<ActivateWizard />}
    />
  );
}
