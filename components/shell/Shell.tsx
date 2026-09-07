import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import type { RoleGroup } from "@/lib/auth/roleHome";

/**
 * Shared app chrome for every authenticated route group. Below 820px the
 * sidebar collapses into a horizontally scrolling strip via CSS in
 * globals.css (see `.dcc-sidebar`), and the shell goes full-bleed.
 */
export function Shell({
  group,
  userName,
  userRoleLabel,
  badges,
  children,
}: {
  group: RoleGroup;
  userName: string;
  userRoleLabel: string;
  badges?: Record<string, number>;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F8FA" }} className="dcc-shell">
      <Sidebar group={group} userName={userName} userRoleLabel={userRoleLabel} badges={badges} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
