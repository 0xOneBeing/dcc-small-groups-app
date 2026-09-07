"use client";

/**
 * useAuth — session state + sign-in / sign-out, all cookie-backed.
 *
 * The tokens live in httpOnly cookies set by `/api/auth/*`; this hook only
 * ever sees the decoded claims returned by `GET /api/auth/session`.
 */

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, setAuthExpiredHandler, ApiError } from "@/lib/api/client";
import { queryKeys } from "./useApi";

export interface SessionUser {
  id: string | number | null;
  exp?: number;
  [claim: string]: unknown;
}

export interface UseAuthResult {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ApiError | null;
  login: (email: string, password: string) => Promise<SessionUser | null>;
  logout: () => Promise<void>;
  refetch: () => void;
}

export function useAuth(): UseAuthResult {
  const queryClient = useQueryClient();

  const session = useQuery<{ authenticated: boolean; user: Record<string, unknown> | null }, ApiError>({
    queryKey: queryKeys.session,
    queryFn: () => authApi.session(),
    staleTime: 60_000,
    retry: false,
  });

  const user = (session.data?.user ?? null) as SessionUser | null;

  // When any proxied call 401s unrecoverably, drop the cached session so the
  // app can route to sign-in.
  useEffect(() => {
    setAuthExpiredHandler(() => {
      queryClient.setQueryData(queryKeys.session, { authenticated: false, user: null });
    });
    return () => setAuthExpiredHandler(null);
  }, [queryClient]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email, password);
      queryClient.setQueryData(queryKeys.session, {
        authenticated: true,
        user: res.user as SessionUser | null,
      });
      // Anything cached under the previous identity is now suspect.
      await queryClient.invalidateQueries();
      return (res.user as SessionUser | null) ?? null;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      queryClient.setQueryData(queryKeys.session, { authenticated: false, user: null });
      queryClient.clear();
    }
  }, [queryClient]);

  return {
    user,
    isAuthenticated: !!session.data?.authenticated,
    isLoading: session.isLoading,
    error: session.error ?? null,
    login,
    logout,
    refetch: session.refetch,
  };
}
