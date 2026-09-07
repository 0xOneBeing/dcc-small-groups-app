/**
 * GET /api/auth/session
 *
 * Tells the client whether there is a live session and, if so, the decoded
 * access-token claims. Refreshes transparently when the access token has
 * expired but the refresh token is still good.
 */

import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/errors";
import {
  decodeJwt,
  isJwtExpired,
  readTokens,
  refreshTokens,
  writeTokensOnResponse,
} from "@/lib/api/tokens";
import type { AccessTokenClaims } from "@/lib/api/types";

export const dynamic = "force-dynamic";

function claimsToUser(access: string) {
  const claims = decodeJwt<AccessTokenClaims>(access);
  if (!claims) return null;
  const { token_type, exp, iat, jti, user_id, ...rest } = claims;
  void token_type;
  void iat;
  void jti;
  return { id: user_id ?? null, exp, ...rest };
}

export async function GET() {
  const { access, refresh } = await readTokens();

  if (access && !isJwtExpired(access)) {
    return NextResponse.json({ authenticated: true, user: claimsToUser(access) });
  }

  if (refresh) {
    try {
      const next = await refreshTokens(refresh);
      const res = NextResponse.json({
        authenticated: true,
        user: claimsToUser(next.access),
      });
      writeTokensOnResponse(res, { access: next.access, refresh: next.refresh });
      return res;
    } catch (err) {
      const status = err instanceof ApiError && err.status >= 500 ? 502 : 200;
      const res = NextResponse.json({ authenticated: false, user: null }, { status });
      res.cookies.set("dcc_access", "", { path: "/", maxAge: 0 });
      res.cookies.set("dcc_refresh", "", { path: "/", maxAge: 0 });
      return res;
    }
  }

  return NextResponse.json({ authenticated: false, user: null });
}
