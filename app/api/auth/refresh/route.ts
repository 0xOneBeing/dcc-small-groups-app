/**
 * POST /api/auth/refresh
 *
 * Forces a token refresh using the `dcc_refresh` cookie. The proxy already
 * refreshes on demand, so the client rarely needs this — it's here for an
 * explicit "keep me signed in" ping or recovery after a tab has slept.
 */

import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/errors";
import {
  clearTokensOnResponse,
  decodeJwt,
  readTokens,
  refreshTokens,
  writeTokensOnResponse,
} from "@/lib/api/tokens";
import type { AccessTokenClaims } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export async function POST() {
  const { refresh } = await readTokens();
  if (!refresh) {
    return NextResponse.json({ authenticated: false, detail: "No refresh token." }, { status: 401 });
  }

  try {
    const next = await refreshTokens(refresh);
    const claims = decodeJwt<AccessTokenClaims>(next.access);
    const res = NextResponse.json({
      authenticated: true,
      user: claims ? { id: claims.user_id ?? null } : null,
    });
    writeTokensOnResponse(res, { access: next.access, refresh: next.refresh });
    return res;
  } catch (err) {
    if (err instanceof ApiError && err.status >= 500) {
      return NextResponse.json(
        { authenticated: true, detail: "Refresh service unavailable." },
        { status: 502 },
      );
    }
    const res = NextResponse.json({ authenticated: false, detail: "Session expired." }, { status: 401 });
    clearTokensOnResponse(res);
    return res;
  }
}
