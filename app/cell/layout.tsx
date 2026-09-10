import { requireShellContext } from "@/lib/api/guard";
import { Shell } from "@/components/shell/Shell";

export default async function CellLayout({ children }: { children: React.ReactNode }) {
  const { userName, roleLabel } = await requireShellContext("cell");

  return (
    <Shell area="cell" userName={userName} userRoleLabel={roleLabel}>
      {children}
    </Shell>
  );
}
