import { prisma } from "./prisma";
import { DEFAULT_FOLLOWUP_OVERDUE_DAYS } from "./rules/followUpOverdue";

export const SETTING_KEYS = {
  followUpOverdueDays: "followUpOverdueDays",
} as const;

/** Rule 5's threshold is configurable, not hardcoded — this is the one place it's read. */
export async function getFollowUpOverdueDays(): Promise<number> {
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEYS.followUpOverdueDays } });
  if (!row) return DEFAULT_FOLLOWUP_OVERDUE_DAYS;
  const parsed = Number(row.value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_FOLLOWUP_OVERDUE_DAYS;
}

export async function setFollowUpOverdueDays(days: number): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: SETTING_KEYS.followUpOverdueDays },
    create: { key: SETTING_KEYS.followUpOverdueDays, value: String(days) },
    update: { value: String(days) },
  });
}
