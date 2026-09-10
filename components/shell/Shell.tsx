import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import type { AppArea } from "@/lib/auth/roles";

/**
 * Shared app chrome for every authenticated route group. Below 820px the
 * sidebar collapses into a horizontally scrolling strip via CSS in
 * globals.css (see `.dcc-sidebar`), and the shell goes full-bleed.
 */
export function Shell({
  area,
  userName,
  userRoleLabel,
  badges,
  children,
}: {
  area: AppArea;
  userName: string;
  userRoleLabel: string;
  badges?: Record<string, number>;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F8FA" }} className="dcc-shell">
      <Sidebar area={area} userName={userName} userRoleLabel={userRoleLabel} badges={badges} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
