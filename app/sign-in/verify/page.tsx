import { redirect } from "next/navigation";
import { getServerSession, homeForSession } from "@/lib/api/session";

/**
 * The DCC API does not expose a TOTP / second-factor step, so there is nothing
 * to verify here. Kept as a route so old links resolve — it just forwards on.
 */
export default async function VerifyTotpPage() {
  const session = await getServerSession();
  if (!session.authenticated) redirect("/sign-in");
  redirect(homeForSession(session));
}
