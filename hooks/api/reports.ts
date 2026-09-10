"use client";

/** Typed hooks for `/api/v1/reports/…`. */

import { API_ROUTES } from "@/lib/api/config";
import type {
  CreateReportInput,
  Paginated,
  ReportDecisionInput,
  SundayReport,
  UpdateReportInput,
  WhatsAppReportInput,
} from "@/lib/api/types";
import { asArray } from "@/lib/api/normalize";
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

/** Reports submitted by the current Cell Leader. The API returns a bare array here. */
export function useMyReports() {
  return useApiQuery<unknown, SundayReport[]>(queryKeys.reports.mine, API_ROUTES.myReports, {
    select: (d) => asArray<SundayReport>(d),
  });
}

export function useReport(id: string | null) {
  return useApiQuery<SundayReport>(
    id ? queryKeys.reports.detail(id) : ["reports", "detail", "nil"],
    id ? API_ROUTES.report(id) : null,
  );
}

/** Create this Sunday's report for the authenticated Cell Leader's cell. */
export function useCreateReport() {
  return useApiMutation<SundayReport, CreateReportInput>(API_ROUTES.reports, {
    method: "POST",
    invalidateKeys: [queryKeys.reports.all, queryKeys.dashboard.all],
  });
}

/** Submit on behalf of a cell identified by `cell_code` (the WhatsApp channel). */
export function useCreateWhatsAppReport() {
  return useApiMutation<SundayReport, WhatsAppReportInput>(API_ROUTES.reportWhatsapp, {
    method: "POST",
    invalidateKeys: [queryKeys.reports.all, queryKeys.dashboard.all],
  });
}

/** Edit a REJECTED report before resubmitting (only the submitting Cell Leader may). */
export function useUpdateReport(id: string) {
  return useApiMutation<SundayReport, UpdateReportInput>(
    (body) => ({ path: API_ROUTES.report(id), method: "PATCH", body }),
    { invalidateKeys: [queryKeys.reports.all, queryKeys.dashboard.all] },
  );
}

export function useApproveReport() {
  return useApiMutation<SundayReport, { id: string } & ReportDecisionInput>(
    ({ id, ...body }) => ({ path: API_ROUTES.reportApprove(id), method: "POST", body }),
    { invalidateKeys: [queryKeys.reports.all, queryKeys.approvals.all, queryKeys.dashboard.all] },
  );
}

/** Send a report back for correction, with an optional explanatory comment. */
export function useRejectReport() {
  return useApiMutation<SundayReport, { id: string } & ReportDecisionInput>(
    ({ id, ...body }) => ({ path: API_ROUTES.reportReject(id), method: "POST", body }),
    { invalidateKeys: [queryKeys.reports.all, queryKeys.approvals.all, queryKeys.dashboard.all] },
  );
}
