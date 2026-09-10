/**
 * GET /api/auth/session
 *
 * Tells the client whether there is a live session and, if so, the user
 * profile cached at login (`dcc_user`), falling back to the decoded JWT
 * claims. Refreshes the access token transparently when it has expired but
 * the refresh token is still good.
 */

import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/errors";
import {
  clearTokensOnResponse,
  decodeJwt,
  isJwtExpired,
  readTokens,
  readUser,
  refreshTokens,
  writeTokensOnResponse,
} from "@/lib/api/tokens";
import type { AccessTokenClaims, ApiUser } from "@/lib/api/types";

export const dynamic = "force-dynamic";

function fallbackUser(access: string): ApiUser | null {
  const claims = decodeJwt<AccessTokenClaims>(access);
  return claims ? { id: claims.user_id, _fromClaims: true } : null;
}

export async function GET() {
  const { access, refresh } = await readTokens();
  const storedUser = await readUser();

  if (access && !isJwtExpired(access)) {
    return NextResponse.json({
      authenticated: true,
      user: storedUser ?? fallbackUser(access),
    });
  }

  if (refresh) {
    try {
      const next = await refreshTokens(refresh);
      const res = NextResponse.json({
        authenticated: true,
        user: storedUser ?? fallbackUser(next.access),
      });
      writeTokensOnResponse(res, { access: next.access, refresh: next.refresh });
      return res;
    } catch (err) {
      const status = err instanceof ApiError && err.status >= 500 ? 502 : 200;
      const res = NextResponse.json({ authenticated: false, user: null }, { status });
      clearTokensOnResponse(res);
      return res;
    }
  }

  return NextResponse.json({ authenticated: false, user: null });
}
