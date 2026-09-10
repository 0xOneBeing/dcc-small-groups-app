import { requireShellContext } from "@/lib/api/guard";
import { Shell } from "@/components/shell/Shell";

export default async function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  // Enforced: the `/coordinator` group now exists, so a non-coordinator is sent
  // to their own home rather than shown data the API would 403 anyway.
  const { userName, roleLabel } = await requireShellContext("coordinator", { enforce: true });

  return (
    <Shell area="coordinator" userName={userName} userRoleLabel={roleLabel}>
      {children}
    </Shell>
  );
}
