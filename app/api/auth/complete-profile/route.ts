/**
 * POST /api/auth/complete-profile  { token, password, password_confirmation }
 *
 * Unauthenticated — the magic-link `token` from the invitation email is the
 * credential. Forwards to the upstream `v1/user/complete-profile/`; does not
 * touch cookies (the user still signs in afterwards).
 */

import { NextResponse } from "next/server";
import { API_ROUTES } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { httpRequest } from "@/lib/api/http";
import { upstreamUrl } from "@/lib/api/tokens";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Expected a JSON body." }, { status: 400 });
  }

  const { token, password, password_confirmation } = (body ?? {}) as Record<string, unknown>;
  if (
    typeof token !== "string" ||
    typeof password !== "string" ||
    typeof password_confirmation !== "string"
  ) {
    return NextResponse.json(
      { detail: "token, password and password_confirmation are required." },
      { status: 400 },
    );
  }

  try {
    const result = await httpRequest<{ detail: string }>(
      upstreamUrl(API_ROUTES.completeProfile),
      { method: "POST", body: { token, password, password_confirmation } },
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(err.raw ?? { detail: err.message }, { status: err.status || 400 });
    }
    return NextResponse.json({ detail: "Could not complete activation. Please try again." }, { status: 502 });
  }
}
