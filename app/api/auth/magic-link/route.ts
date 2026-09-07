import { NextRequest, NextResponse } from "next/server";
import { consumeMagicLinkAction } from "@/lib/auth/actions";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const base = request.nextUrl.origin;
  if (!token) return NextResponse.redirect(`${base}/sign-in?error=missing-token`);

  const result = await consumeMagicLinkAction(token);
  if (!result.ok) {
    return NextResponse.redirect(`${base}/sign-in?error=${encodeURIComponent(result.error)}`);
  }
  return NextResponse.redirect(`${base}${result.data.redirectTo}`);
}
