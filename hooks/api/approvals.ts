"use client";

/** Typed hooks for `/api/v1/approvals/…` and `/api/v1/approval-settings/`. */

import { API_ROUTES } from "@/lib/api/config";
import type { ApprovalSettings, SundayReport } from "@/lib/api/types";
import { asArray } from "@/lib/api/normalize";
import { queryKeys, useApiMutation, useApiQuery } from "../useApi";

/** Pending reports the signed-in Section / Area / Zone leader can act on. Bare array upstream. */
export function useApprovalsQueue() {
  return useApiQuery<unknown, SundayReport[]>(queryKeys.approvals.queue, API_ROUTES.approvalsQueue, {
    select: (d) => asArray<SundayReport>(d),
    refetchInterval: 60_000,
  });
}

export function useApprovalSettings() {
  return useApiQuery<ApprovalSettings>(queryKeys.approvals.settings, API_ROUTES.approvalSettings);
}

/** PATCH the seconds-before-fallback-approval interval. */
export function useUpdateApprovalSettings() {
  return useApiMutation<ApprovalSettings, Partial<ApprovalSettings>>(
    (body) => ({ path: API_ROUTES.approvalSettings, method: "PATCH", body }),
    { invalidateKeys: [queryKeys.approvals.settings] },
  );
}
