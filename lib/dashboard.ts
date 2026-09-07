import { current, rnd, titleFor, type Scope, type TreeNode } from "./tree";

export type DashFilter = "All" | "Not submitted" | "Pending approval" | "Chronic";

export function pctColorFor(pct: number) {
  return pct >= 93 ? "#157F52" : pct >= 80 ? "#B26A00" : "#B01E28";
}

export interface DashRow {
  key: string;
  name: string;
  sub: string;
  leader: string;
  ok: number;
  pending: number;
  missing: number;
  missColor: string;
  chronic: boolean;
  chronicText: string;
  isCell: boolean;
  isGroupRow: boolean;
  pct: string;
  pctFg: string;
  barBg: string;
  stLabel: string;
  stBg: string;
  stFg: string;
  onPickIndex: number | null;
}

export function deriveDashboard(scope: Scope, path: number[], filter: DashFilter) {
  const { node, chain } = current(scope, path);
  const pctNum = node.cells ? Math.round(((node.ok + node.pend) / node.cells) * 100) : 0;
  const pctColor = pctColorFor(pctNum);

  const tr = rnd(node.cells * 977 + node.name.length);
  const trend = Array.from({ length: 8 }, (_, i) => {
    const p = i === 7 ? pctNum : Math.max(48, Math.min(99, pctNum + Math.round((tr() - 0.45) * 22)));
    return { h: `${p}%`, bg: i === 7 ? pctColor : "#DDE2E8" };
  });

  const crumbs = chain.map((n, i) => ({ name: n.name, isLast: i === chain.length - 1, index: i }));

  const childLevel = node.children ? node.children[0].level : null;

  let kids: TreeNode[] = node.children || [];
  if (filter === "Not submitted") kids = kids.filter((k) => k.miss > 0);
  else if (filter === "Pending approval") kids = kids.filter((k) => k.pend > 0);
  else if (filter === "Chronic") kids = kids.filter((k) => k.chronic > 0);

  const rows: DashRow[] = kids.map((k) => {
    const realIdx = (node.children || []).indexOf(k);
    const isCell = k.level === "Cell";
    const kp = k.cells ? Math.round(((k.ok + k.pend) / k.cells) * 100) : 0;
    const kpc = pctColorFor(kp);
    const stt = isCell
      ? k.status === "approved"
        ? { l: "Approved · " + k.channel, bg: "#E8F5EE", fg: "#157F52" }
        : k.status === "pending"
        ? { l: "Pending · " + k.channel, bg: "#FDF2E0", fg: "#B26A00" }
        : { l: "Not submitted", bg: "#FBEEEF", fg: "#B01E28" }
      : null;
    return {
      key: k.code,
      name: k.name,
      sub: isCell ? `${k.code} · ${k.cellType}${k.status !== "missing" ? " · " + k.time : ""}` : `${k.code} · ${k.cells} cells`,
      leader: (isCell ? "Cell Leader " : titleFor(k.level) + " ") + k.leader,
      ok: k.ok,
      pending: k.pend,
      missing: k.miss,
      missColor: k.miss > 0 ? "#B01E28" : "#C3CAD3",
      chronic: k.chronic > 0,
      chronicText: isCell ? "3+ WEEKS MISSED" : `${k.chronic} CHRONIC CELL${k.chronic === 1 ? "" : "S"}`,
      isCell,
      isGroupRow: !isCell,
      pct: `${kp}%`,
      pctFg: kpc,
      barBg: kpc,
      stLabel: stt ? stt.l : "",
      stBg: stt ? stt.bg : "",
      stFg: stt ? stt.fg : "",
      onPickIndex: isCell ? null : realIdx,
    };
  });

  const headers = [
    { label: node.children ? childLevel : "Cell", align: "left" as const },
    { label: "Leader", align: "left" as const },
    { label: "Appr.", align: "center" as const },
    { label: "Pend.", align: "center" as const },
    { label: "Missing", align: "center" as const },
    { label: node.children && childLevel === "Cell" ? "Status" : "Compliance", align: "right" as const },
  ];

  const stats = [
    { label: "Not submitted", value: node.miss, unit: "cells", color: node.miss > 0 ? "#B01E28" : "#157F52", note: "Reminder sent Monday 9:00am; escalates to upline after a second miss." },
    { label: "Pending approval", value: node.pend, unit: "reports", color: "#B26A00", note: "Routes to the Area Coordinator if the Section Leader does not act in 36 hours." },
    { label: "Chronic non-reporters", value: node.chronic, unit: "cells", color: node.chronic > 0 ? "#B01E28" : "#157F52", note: "Missed 3 or more consecutive Sundays." },
  ];

  return {
    node,
    chain,
    pctNum,
    pctColor,
    delta: pctNum >= 88 ? "+3 pts" : "−4 pts",
    deltaColor: pctNum >= 88 ? "#157F52" : "#B01E28",
    trend,
    crumbs,
    childLevel,
    rows,
    headers,
    stats,
    noRows: rows.length === 0,
    tableTitle: node.children ? `${childLevel}s under ${node.name}` : node.name,
    tableSub: node.children ? `Click a row to drill down · ${node.cells} cells rolled up` : "Cell-level detail",
  };
}
