"use client";

/** Typed hooks for `/api/v1/reports/…`. */

import { API_ROUTES } from "@/lib/api/config";
import type {
  CreateReportInput,
  Paginated,
  RejectReportInput,
  SundayReport,
  UpdateReportInput,
} from "@/lib/api/types";
import {
  queryKeys,
  useApiInfiniteQuery,
  useApiMutation,
  useApiQuery,
  type QueryParams,
} from "../useApi";

/** Paginated list of reports in the caller's scope. */
export function useReports(params?: { page?: number } & QueryParams) {
  return useApiQuery<Paginated<SundayReport>>(
    queryKeys.reports.list(params),
    API_ROUTES.reports,
    { params, placeholderData: (prev) => prev },
  );
}

/** Same list, as an infinite query for "load more" UIs. */
export function useInfiniteReports(params?: QueryParams) {
  return useApiInfiniteQuery<SundayReport>(
    queryKeys.reports.list({ ...params, infinite: true }),
    API_ROUTES.reports,
    { params },
  );
}

/** Reports submitted by the current Cell Leader. */
export function useMyReports() {
  return useApiQuery<SundayReport[] | Paginated<SundayReport>>(
    queryKeys.reports.mine,
    API_ROUTES.myReports,
  );
}

export function useReport(id: string | null) {
  return useApiQuery<SundayReport>(
    id ? queryKeys.reports.detail(id) : ["reports", "detail", "nil"],
    id ? API_ROUTES.report(id) : null,
  );
}

export function useCreateReport() {
  return useApiMutation<SundayReport, CreateReportInput>(API_ROUTES.reports, {
    method: "POST",
    invalidateKeys: [queryKeys.reports.all, queryKeys.dashboard.all],
  });
}

export function useUpdateReport(id: string) {
  return useApiMutation<SundayReport, UpdateReportInput>(
    (body) => ({ path: API_ROUTES.report(id), method: "PATCH", body }),
    { invalidateKeys: [queryKeys.reports.all, queryKeys.dashboard.all] },
  );
}

export function useApproveReport() {
  return useApiMutation<SundayReport, { id: string }>(
    ({ id }) => ({ path: API_ROUTES.reportApprove(id), method: "POST" }),
    { invalidateKeys: [queryKeys.reports.all, queryKeys.approvals.all, queryKeys.dashboard.all] },
  );
}

export function useRejectReport() {
  return useApiMutation<SundayReport, { id: string } & RejectReportInput>(
    ({ id, ...body }) => ({ path: API_ROUTES.reportReject(id), method: "POST", body }),
    { invalidateKeys: [queryKeys.reports.all, queryKeys.approvals.all, queryKeys.dashboard.all] },
  );
}
