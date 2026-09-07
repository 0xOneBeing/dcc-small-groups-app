"use client";

/**
 * useApi — the single custom hook layer for talking to the DCC API.
 *
 * Everything goes through the same-origin BFF proxy (`lib/api/client.ts`),
 * which attaches the JWT from an httpOnly cookie. These hooks add TanStack
 * Query on top: caching, dedup, background refetch, retry policy (defined in
 * `components/providers/QueryProvider.tsx`), and typed errors (`ApiError`).
 *
 *   const reports = useApiQuery<Paginated<SundayReport>>(
 *     queryKeys.reports.list({ page }),
 *     API_ROUTES.reports,
 *     { params: { page } },
 *   );
 *
 *   const approve = useApiMutation<SundayReport, { id: string }>(
 *     ({ id }) => ({ path: API_ROUTES.reportApprove(id), method: "POST" }),
 *     { invalidateKeys: [queryKeys.reports.all, queryKeys.approvals.all] },
 *   );
 *
 * Resource-specific wrappers live in `hooks/api/*`.
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseInfiniteQueryOptions,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { api, type ApiCallOptions } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { QueryParams } from "@/lib/api/http";
import type { Paginated } from "@/lib/api/types";

export { ApiError };
export type { QueryParams };

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// ---------------------------------------------------------------------------
// Query-key factory — keeps cache keys consistent and greppable.
// ---------------------------------------------------------------------------

export const queryKeys = {
  session: ["session"] as const,

  reports: {
    all: ["reports"] as const,
    list: (params?: QueryParams) => ["reports", "list", params ?? {}] as const,
    mine: ["reports", "mine"] as const,
    detail: (id: string) => ["reports", "detail", id] as const,
  },
  approvals: {
    all: ["approvals"] as const,
    queue: ["approvals", "queue"] as const,
    settings: ["approvals", "settings"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    summary: (params?: QueryParams) => ["dashboard", "summary", params ?? {}] as const,
    unit: (unitType: string, id: string, params?: QueryParams) =>
      ["dashboard", "unit", unitType, id, params ?? {}] as const,
    approvals: ["dashboard", "approvals"] as const,
    nonSubmitters: (params?: QueryParams) => ["dashboard", "non-submitters", params ?? {}] as const,
    trends: (params?: QueryParams) => ["dashboard", "trends", params ?? {}] as const,
  },
  roles: {
    all: ["roles"] as const,
    list: (params?: QueryParams) => ["roles", "list", params ?? {}] as const,
    detail: (id: string) => ["roles", "detail", id] as const,
  },
} as const;

// ---------------------------------------------------------------------------
// useApiQuery
// ---------------------------------------------------------------------------

export interface UseApiQueryOptions<TData, TSelected>
  extends Omit<UseQueryOptions<TData, ApiError, TSelected, QueryKey>, "queryKey" | "queryFn"> {
  /** Query-string params for the request. */
  params?: QueryParams;
  /** Extra per-request options (timeout, signal is managed for you). */
  request?: ApiCallOptions;
}

/**
 * GET `path` and cache it under `key`. Pass `path = null` to keep the query
 * disabled (dependent queries) without violating the rules of hooks.
 */
export function useApiQuery<TData = unknown, TSelected = TData>(
  key: QueryKey,
  path: string | null,
  options: UseApiQueryOptions<TData, TSelected> = {},
): UseQueryResult<TSelected, ApiError> {
  const { params, request, ...queryOptions } = options;

  return useQuery<TData, ApiError, TSelected, QueryKey>({
    queryKey: key,
    queryFn: ({ signal }) =>
      api.get<TData>(path as string, { ...request, query: params, signal }),
    enabled: path !== null && (queryOptions.enabled ?? true),
    ...queryOptions,
  });
}

// ---------------------------------------------------------------------------
// useApiInfiniteQuery — DRF PageNumberPagination (`?page=`, `next`, `previous`)
// ---------------------------------------------------------------------------

function pageFromUrl(url: string | null): number | undefined {
  if (!url) return undefined;
  try {
    const value = new URL(url, "http://x").searchParams.get("page");
    return value ? Number(value) : undefined;
  } catch {
    return undefined;
  }
}

export function useApiInfiniteQuery<TItem>(
  key: QueryKey,
  path: string,
  options: {
    params?: QueryParams;
    pageParamName?: string;
    query?: Omit<
      UseInfiniteQueryOptions<
        Paginated<TItem>,
        ApiError,
        { pages: Paginated<TItem>[]; pageParams: number[] },
        QueryKey,
        number
      >,
      "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam"
    >;
  } = {},
) {
  const { params, pageParamName = "page", query } = options;

  return useInfiniteQuery({
    queryKey: key,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api.get<Paginated<TItem>>(path, {
        query: { ...params, [pageParamName]: pageParam },
        signal,
      }),
    getNextPageParam: (lastPage) => pageFromUrl(lastPage.next),
    getPreviousPageParam: (firstPage) => pageFromUrl(firstPage.previous),
    ...query,
  });
}

// ---------------------------------------------------------------------------
// useApiMutation
// ---------------------------------------------------------------------------

export interface MutationTarget {
  path: string;
  method?: HttpMethod;
  body?: unknown;
  request?: ApiCallOptions;
}

export interface UseApiMutationOptions<TData, TVariables>
  extends Omit<UseMutationOptions<TData, ApiError, TVariables>, "mutationFn"> {
  /** Default method when `resolver` is a bare path string. Defaults to POST. */
  method?: HttpMethod;
  /** Query keys to invalidate after a successful mutation. */
  invalidateKeys?: QueryKey[];
}

/**
 * `resolver` is either a fixed path (the variables become the request body) or
 * a function mapping variables → `{ path, method, body }` for dynamic routes
 * like `reports/{id}/approve/`.
 */
export function useApiMutation<TData = unknown, TVariables = void>(
  resolver: string | ((variables: TVariables) => MutationTarget),
  options: UseApiMutationOptions<TData, TVariables> = {},
): UseMutationResult<TData, ApiError, TVariables> {
  const queryClient = useQueryClient();
  const { method: defaultMethod = "POST", invalidateKeys, onSuccess, ...mutationOptions } = options;

  const mutationFn = useCallback(
    (variables: TVariables): Promise<TData> => {
      const target: MutationTarget =
        typeof resolver === "string"
          ? { path: resolver, method: defaultMethod, body: variables }
          : resolver(variables);
      const method = target.method ?? defaultMethod;
      const req = target.request;

      switch (method) {
        case "GET":
          return api.get<TData>(target.path, req);
        case "DELETE":
          return api.delete<TData>(target.path, req);
        case "PUT":
          return api.put<TData>(target.path, target.body, req);
        case "PATCH":
          return api.patch<TData>(target.path, target.body, req);
        default:
          return api.post<TData>(target.path, target.body, req);
      }
    },
    [resolver, defaultMethod],
  );

  return useMutation<TData, ApiError, TVariables>({
    mutationFn,
    onSuccess: async (...args: Parameters<NonNullable<typeof onSuccess>>) => {
      if (invalidateKeys?.length) {
        await Promise.all(
          invalidateKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        );
      }
      await onSuccess?.(...args);
    },
    ...mutationOptions,
  });
}

// ---------------------------------------------------------------------------
// Imperative escape hatch
// ---------------------------------------------------------------------------

/** The raw client plus the query client, for one-off calls outside the hook model. */
export function useApiClient() {
  const queryClient = useQueryClient();
  return { api, queryClient };
}
