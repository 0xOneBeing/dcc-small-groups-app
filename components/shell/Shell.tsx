import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { AppArea } from "@/lib/auth/roles";

/**
 * Shared app chrome for every authenticated route group, built on shadcn's
 * sidebar primitive (`components/ui/sidebar.tsx`). Below the 768px breakpoint
 * (`hooks/use-mobile.ts`) the sidebar automatically becomes an off-canvas
 * sheet instead of squeezing the page; on desktop it collapses to an icon
 * rail rather than disappearing.
 *
 * There is a single header: each page's own `PageHeader` (in `components/ui.tsx`)
 * now also hosts the `SidebarTrigger` as its first element and is the thing
 * that stays pinned while the page scrolls — there's no separate site-wide
 * header bar above it.
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
    <SidebarProvider>
      <AppSidebar area={area} userName={userName} userRoleLabel={userRoleLabel} badges={badges} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
