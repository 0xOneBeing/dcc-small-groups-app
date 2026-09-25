"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconBuildingCommunity,
  IconCheck,
  IconChartBar,
  IconClipboardList,
  IconDashboard,
  IconDownload,
  IconLogout,
  IconPlus,
  IconUpload,
  IconUserCheck,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/toast";
import { AREA_ROOTS, type AppArea } from "@/lib/auth/roles";

interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}

const NAV: Record<AppArea, NavItem[]> = {
  cell: [
    { href: "/cell", label: "My cell", icon: IconDashboard },
    { href: "/cell/report", label: "Sunday report", icon: IconClipboardList },
    { href: "/cell/follow-ups", label: "Follow-ups", icon: IconUserCheck },
    { href: "/cell/members", label: "Cell members", icon: IconUsers },
    { href: "/cell/resources", label: "Resources", icon: IconDownload },
  ],
  coordinator: [
    { href: "/coordinator", label: "Compliance", icon: IconChartBar },
    { href: "/coordinator/approvals", label: "Approvals", icon: IconCheck },
    { href: "/coordinator/cells", label: "Cells", icon: IconBuildingCommunity },
    { href: "/coordinator/follow-ups", label: "Follow-ups", icon: IconUserCheck },
    { href: "/coordinator/exports", label: "Exports", icon: IconDownload },
  ],
  msu: [
    { href: "/msu", label: "Assignments", icon: IconClipboardList },
    { href: "/msu/new", label: "New entry", icon: IconPlus },
    { href: "/msu/follow-ups", label: "Follow-ups", icon: IconUserCheck },
    { href: "/msu/exports", label: "Exports", icon: IconDownload },
  ],
  admin: [
    { href: "/admin", label: "Hierarchy upload", icon: IconUpload },
    { href: "/admin/users", label: "Users & onboarding", icon: IconUsers },
  ],
};

const AREA_ROOT_PATHS = new Set(Object.values(AREA_ROOTS));

export function AppSidebar({
  area,
  userName,
  userRoleLabel,
  badges = {},
  ...props
}: {
  area: AppArea;
  userName: string;
  userRoleLabel: string;
  badges?: Record<string, number>;
} & Omit<React.ComponentProps<typeof Sidebar>, "collapsible">) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const items = NAV[area] ?? NAV.cell;

  async function signOut() {
    try {
      await logout();
      notify.success("Signed out");
    } catch (err) {
      notify.error(err, "Could not sign out cleanly");
    } finally {
      router.replace("/sign-in");
    }
  }

  const initials = userName
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link href={AREA_ROOTS[area]}>
                <div className="relative size-7 shrink-0 overflow-hidden rounded-md border border-border bg-white">
                  <Image src="/assets/daystar-logo.jpeg" alt="" fill className="object-cover" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">Small Groups</span>
                  <span className="truncate text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Daystar
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (!AREA_ROOT_PATHS.has(item.href) && !!pathname?.startsWith(item.href));
                const badge = badges[item.href];
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {!!badge && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                {initials}
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-xs font-semibold">{userName}</span>
                <span className="truncate text-[11px] text-muted-foreground">{userRoleLabel}</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sign out">
              <IconLogout />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
