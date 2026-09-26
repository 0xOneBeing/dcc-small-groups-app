import { colors } from "@/lib/tokens";
import type { ApprovalStatus } from "@/lib/api/types";

const STATUS_STYLE: Record<ApprovalStatus, { label: string; bg: string; fg: string }> = {
  APPROVED: { label: "Approved", bg: colors.greenSoft, fg: colors.green },
  PENDING: { label: "Pending", bg: colors.amberSoft, fg: colors.amber },
  REJECTED: { label: "Sent back", bg: colors.redSoft, fg: colors.red },
  DELETED: { label: "Deleted", bg: colors.chipGrey, fg: colors.muted },
};

export function StatusPill({ status }: { status: ApprovalStatus }) {
  const t = STATUS_STYLE[status];
  return (
    <span
      style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: t.bg, color: t.fg }}
    >
      {t.label}
    </span>
  );
}
