"use client";

/** Typed hooks for `/api/v1/organization/dashboard/…`. */

import { API_ROUTES } from "@/lib/api/config";
import type {
  DashboardSummary,
  NonSubmitterRow,
  OrgUnitType,
  TrendPoint,
} from "@/lib/api/types";
import { api } from "@/lib/api/client";
import { queryKeys, useApiQuery } from "../useApi";

/** Compliance totals for the caller's scope. `serviceDate` is a Sunday (YYYY-MM-DD); latest when omitted. */
export function useOrgDashboard(serviceDate?: string) {
  const params = serviceDate ? { service_date: serviceDate } : undefined;
  return useApiQuery<DashboardSummary>(
    queryKeys.dashboard.summary(params),
    API_ROUTES.orgDashboard,
    { params },
  );
}

/** Compliance for a specific unit (region…cell). Only the caller's own level or descendants. */
export function useUnitDashboard(
  unitType: OrgUnitType | null,
  id: string | null,
  serviceDate?: string,
) {
  const params = serviceDate ? { service_date: serviceDate } : undefined;
  const enabled = !!unitType && !!id;
  return useApiQuery<DashboardSummary>(
    queryKeys.dashboard.unit(unitType ?? "nil", id ?? "nil", params),
    enabled ? API_ROUTES.orgDashboardUnit(unitType!, id!) : null,
    { params },
  );
}

export function useDashboardApprovals() {
  return useApiQuery<unknown>(queryKeys.dashboard.approvals, API_ROUTES.orgDashboardApprovals);
}

export function useNonSubmitters(opts: { serviceDate?: string; chronic?: boolean } = {}) {
  const params = {
    ...(opts.serviceDate ? { service_date: opts.serviceDate } : {}),
    ...(opts.chronic ? { chronic: true } : {}),
  };
  return useApiQuery<NonSubmitterRow[]>(
    queryKeys.dashboard.nonSubmitters(params),
    API_ROUTES.orgDashboardNonSubmitters,
    { params },
  );
}

export function useComplianceTrends(weeks = 8) {
  const params = { weeks };
  return useApiQuery<TrendPoint[]>(
    queryKeys.dashboard.trends(params),
    API_ROUTES.orgDashboardTrends,
    { params },
  );
}

/** Trigger a scoped CSV/report export download for an inclusive date range. */
export function useDashboardExport() {
  return {
    async download(startDate: string, endDate: string) {
      const { blob, filename } = await api.download(API_ROUTES.orgDashboardExport, {
        query: { start_date: startDate, end_date: endDate },
      });
      return { blob, filename: filename ?? `dcc-export-${startDate}_${endDate}.csv` };
    },
  };
}
