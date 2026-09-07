"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { colors, mono } from "@/lib/tokens";
import { signOutAction } from "@/lib/auth/actions";
import type { RoleGroup } from "@/lib/auth/roleHome";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

const NAV: Record<RoleGroup, NavItem[]> = {
  leader: [
    { href: "/cell", label: "My cell", icon: "▦" },
    { href: "/cell/report", label: "Sunday report", icon: "▤" },
    { href: "/cell/follow-ups", label: "Follow-ups", icon: "◎" },
    { href: "/cell/members", label: "Cell members", icon: "◇" },
    { href: "/cell/resources", label: "Resources", icon: "↓" },
  ],
  coordinator: [
    { href: "/coordinator", label: "Compliance", icon: "▦" },
    { href: "/coordinator/approvals", label: "Approvals", icon: "✓" },
    { href: "/coordinator/cells", label: "Cells", icon: "◇" },
    { href: "/coordinator/follow-ups", label: "Follow-ups", icon: "◎" },
    { href: "/coordinator/exports", label: "Exports", icon: "↓" },
  ],
  super_admin: [{ href: "/admin", label: "Hierarchy upload", icon: "↑" }],
};

export function Sidebar({
  group,
  userName,
  userRoleLabel,
  badges = {},
}: {
  group: RoleGroup;
  userName: string;
  userRoleLabel: string;
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const items = NAV[group];
  const initials = userName
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");

  return (
    <nav
      aria-label="Primary"
      style={{
        width: 236,
        flexShrink: 0,
        background: "#fff",
        borderRight: `1px solid ${colors.border}`,
        padding: "20px 14px",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
      className="dcc-sidebar"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "0 6px 20px",
          borderBottom: `1px solid ${colors.hairline}`,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "#fff",
            border: `1px solid ${colors.border}`,
            overflow: "hidden",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <Image src="/assets/daystar-logo.jpeg" alt="" fill style={{ objectFit: "cover" }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.01em" }}>Small Groups</div>
          <div style={{ fontSize: 10, color: colors.faint2, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Daystar
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }} className="dcc-sidebar-items">
        {items.map((n) => {
          const on = pathname === n.href || (n.href !== "/cell" && n.href !== "/coordinator" && pathname?.startsWith(n.href));
          const badge = badges[n.href];
          return (
            <Link
              key={n.href}
              href={n.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 10px",
                minHeight: 44,
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                background: on ? colors.redSoft : "transparent",
                color: on ? colors.red : colors.muted,
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: 14, width: 16, textAlign: "center" }} aria-hidden>
                {n.icon}
              </span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {!!badge && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 6,
                    background: colors.redSoft,
                    color: colors.red,
                    fontFamily: mono,
                  }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div
        className="dcc-user-footer"
        style={{
          marginTop: "auto",
          paddingTop: 20,
          borderTop: `1px solid ${colors.hairline}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: colors.chipGrey,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
            color: colors.muted,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div className="dcc-user-meta" style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {userName}
          </div>
          <div style={{ fontSize: 10.5, color: colors.faint2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {userRoleLabel}
          </div>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Sign out"
            style={{ border: "none", background: "transparent", color: colors.faint, cursor: "pointer", fontSize: 12, minHeight: 44, minWidth: 44 }}
          >
            ⏻
          </button>
        </form>
      </div>
    </nav>
  );
}
