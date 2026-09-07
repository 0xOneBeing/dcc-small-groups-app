import type { CellRole } from "@prisma/client";

export type RoleGroup = "leader" | "coordinator" | "super_admin";

const COORDINATOR_ROLES: CellRole[] = [
  "section_leader",
  "area_coordinator",
  "zonal_coordinator",
  "district_coordinator",
  "regional_coordinator",
];

/** Coordinator screens are one shared set scoped by role, per the design brief. */
export function roleGroupFor(roles: CellRole[]): RoleGroup {
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.some((r) => COORDINATOR_ROLES.includes(r))) return "coordinator";
  return "leader";
}

export function homePathFor(group: RoleGroup): string {
  if (group === "super_admin") return "/admin";
  if (group === "coordinator") return "/coordinator";
  return "/cell";
}
