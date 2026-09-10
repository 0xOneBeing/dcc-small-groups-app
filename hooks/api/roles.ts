"use client";

/**
 * Typed hook for `/api/v1/roles/`.
 *
 * The current API exposes roles as read-only (list only) — there is no
 * create / update / delete endpoint. Add them back here if the API grows them.
 */

import { API_ROUTES } from "@/lib/api/config";
import type { Paginated, UserRole } from "@/lib/api/types";
import { queryKeys, useApiQuery, type QueryParams } from "../useApi";

export function useRoles(params?: { page?: number } & QueryParams) {
  return useApiQuery<Paginated<UserRole>>(queryKeys.roles.list(params), API_ROUTES.roles, {
    params,
    placeholderData: (prev) => prev,
  });
}
