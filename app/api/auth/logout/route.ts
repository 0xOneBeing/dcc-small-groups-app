/**
 * POST /api/auth/logout
 *
 * Best-effort blacklists the refresh token upstream, then clears both cookies.
 * Always returns 200 — a logout should never fail from the user's side.
 */

import { NextResponse } from "next/server";
import { API_ROUTES } from "@/lib/api/config";
import { httpRequest } from "@/lib/api/http";
import { clearTokensOnResponse, readTokens, upstreamUrl } from "@/lib/api/tokens";

export const dynamic = "force-dynamic";

export async function POST() {
  const { access, refresh } = await readTokens();

  if (refresh) {
    try {
      await httpRequest(upstreamUrl(API_ROUTES.logout), {
        method: "POST",
        body: { refresh },
        headers: access ? { Authorization: `Bearer ${access}` } : {},
        timeoutMs: 5_000,
      });
    } catch {
      // Ignore — we still clear local cookies below.
    }
  }

  const res = NextResponse.json({ authenticated: false });
  clearTokensOnResponse(res);
  return res;
}
