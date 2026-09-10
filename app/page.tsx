import { redirect } from "next/navigation";
import { getServerSession, homeForSession } from "@/lib/api/session";

export default async function Home() {
  const session = await getServerSession();
  if (!session.authenticated) redirect("/sign-in");
  redirect(homeForSession(session));
}
