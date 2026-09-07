"use client";

/** Typed hooks for `/api/v1/roles/…` (role + permission management). */

import { API_ROUTES } from "@/lib/api/config";
import type { Paginated, UpsertRoleInput, UserRole } from "@/lib/api/types";
import { queryKeys, useApiMutation, useApiQuery, type QueryParams } from "../useApi";

export function useRoles(params?: { page?: number } & QueryParams) {
  return useApiQuery<Paginated<UserRole>>(queryKeys.roles.list(params), API_ROUTES.roles, {
    params,
    placeholderData: (prev) => prev,
  });
}

export function useRole(id: string | null) {
  return useApiQuery<UserRole>(
    id ? queryKeys.roles.detail(id) : ["roles", "detail", "nil"],
    id ? API_ROUTES.role(id) : null,
  );
}

export function useCreateRole() {
  return useApiMutation<UserRole, UpsertRoleInput>(API_ROUTES.roles, {
    method: "POST",
    invalidateKeys: [queryKeys.roles.all],
  });
}

export function useUpdateRole(id: string) {
  return useApiMutation<UserRole, UpsertRoleInput>(
    (body) => ({ path: API_ROUTES.role(id), method: "PUT", body }),
    { invalidateKeys: [queryKeys.roles.all] },
  );
}

export function usePatchRole(id: string) {
  return useApiMutation<UserRole, Partial<UpsertRoleInput>>(
    (body) => ({ path: API_ROUTES.role(id), method: "PATCH", body }),
    { invalidateKeys: [queryKeys.roles.all] },
  );
}

export function useDeleteRole() {
  return useApiMutation<void, { id: string }>(
    ({ id }) => ({ path: API_ROUTES.role(id), method: "DELETE" }),
    { invalidateKeys: [queryKeys.roles.all] },
  );
}
