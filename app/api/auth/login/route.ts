/**
 * POST /api/auth/login  { email, password }
 *
 * Exchanges credentials for a JWT pair upstream and stores them in httpOnly
 * cookies. Responds with the decoded access-token claims so the client knows
 * who is signed in — never with the tokens themselves.
 */

import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { decodeJwt, obtainTokens, writeTokensOnResponse } from "@/lib/api/tokens";
import type { AccessTokenClaims } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ detail: "Expected a JSON body." }, { status: 400 });
  }

  const { email, password } = (payload ?? {}) as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json(
      { detail: "Email and password are required.", code: "invalid_input" },
      { status: 400 },
    );
  }

  try {
    const tokens = await obtainTokens(email, password);
    const claims = decodeJwt<AccessTokenClaims>(tokens.access);
    const res = NextResponse.json({
      authenticated: true,
      user: claims
        ? { id: claims.user_id ?? null, ...stripStandardClaims(claims) }
        : null,
    });
    writeTokensOnResponse(res, tokens);
    return res;
  } catch (err) {
    if (err instanceof ApiError) {
      // Forward the upstream DRF body verbatim so the client can map field errors.
      const body = err.raw ?? { detail: err.message, code: err.code };
      return NextResponse.json(body, { status: err.status || 400 });
    }
    return NextResponse.json(
      { detail: "Could not sign in right now. Please try again." },
      { status: 502 },
    );
  }
}

function stripStandardClaims(claims: AccessTokenClaims) {
  const { token_type, exp, iat, jti, user_id, ...rest } = claims;
  void token_type;
  void exp;
  void iat;
  void jti;
  void user_id;
  return rest;
}
