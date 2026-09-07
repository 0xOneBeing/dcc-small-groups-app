import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { resolveUserScope } from "@/lib/auth/scope";
import { roleGroupFor, homePathFor } from "@/lib/auth/roleHome";

export default async function Home() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const scope = await resolveUserScope(session.userId);
  const group = roleGroupFor(scope.roles.map((r) => r.role));

  if (group === "super_admin" && !session.mfaVerifiedAt) redirect("/sign-in/verify");
  redirect(homePathFor(group));
}
