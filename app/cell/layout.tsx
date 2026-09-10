import { requireLeader } from "@/lib/api/guard";
import { Shell } from "@/components/shell/Shell";

export default async function CellLayout({ children }: { children: React.ReactNode }) {
  const { userName, roleLabel } = await requireLeader();

  return (
    <Shell group="leader" userName={userName} userRoleLabel={roleLabel}>
      {children}
    </Shell>
  );
}
