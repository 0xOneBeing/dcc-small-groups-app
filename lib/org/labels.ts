import type { CellRole, OrgLevel } from "@prisma/client";

export const LEVEL_LABEL: Record<OrgLevel, string> = {
  region: "Region",
  district: "District",
  zone: "Zone",
  area: "Area",
  section: "Section",
  cell: "Cell",
};

export const ROLE_LABEL: Record<CellRole, string> = {
  cell_leader: "Cell Leader",
  section_leader: "Section Leader",
  area_coordinator: "Area Coordinator",
  zonal_coordinator: "Zonal Coordinator",
  district_coordinator: "District Coordinator",
  regional_coordinator: "Regional Coordinator",
  super_admin: "Super Admin",
};

export function titleForRole(role: CellRole): string {
  return ROLE_LABEL[role];
}

export function titleForLevel(level: OrgLevel): string {
  return LEVEL_LABEL[level];
}

export const LEVEL_CHAIN: OrgLevel[] = ["region", "district", "zone", "area", "section", "cell"];

export const ROLE_FOR_LEVEL: Record<OrgLevel, CellRole | null> = {
  region: "regional_coordinator",
  district: "district_coordinator",
  zone: "zonal_coordinator",
  area: "area_coordinator",
  section: "section_leader",
  cell: "cell_leader",
};
