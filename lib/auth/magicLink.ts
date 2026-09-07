import "server-only";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "./tokens";
import { sendMail } from "@/lib/mail";

const MAGIC_LINK_TTL_MINUTES = 15;

export async function issueMagicLink(userId: string, email: string): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60_000);
  await prisma.magicLink.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });

  const url = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/api/auth/magic-link?token=${token}`;
  await sendMail({
    to: email,
    subject: "Your DCC Small Groups sign-in link",
    text: `Tap this link to sign in — it expires in ${MAGIC_LINK_TTL_MINUTES} minutes:\n\n${url}`,
  });
}

/** Consumes a magic-link token exactly once. Returns the user id, or null if invalid/expired/used. */
export async function consumeMagicLink(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);
  const link = await prisma.magicLink.findUnique({ where: { tokenHash } });
  if (!link || link.usedAt || link.expiresAt.getTime() < Date.now()) return null;
  await prisma.magicLink.update({ where: { id: link.id }, data: { usedAt: new Date() } });
  return link.userId;
}
