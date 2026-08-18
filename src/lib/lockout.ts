import { prisma } from "@/lib/prisma";
import type { Profile } from "@/generated/prisma/client";
import { getLevelProgress, rankForLevel } from "@/lib/rank";
import { questDayStart } from "@/lib/quest-day";

async function pickPunishmentQuest() {
  const config = await prisma.punishmentConfig.findUnique({ where: { id: 1 } });
  const pool = await prisma.punishmentQuest.findMany();
  if (pool.length === 0) return null;

  if (config?.mode === "FIXED" && config.fixedPunishmentId) {
    const fixed = pool.find((p) => p.id === config.fixedPunishmentId);
    if (fixed) return fixed;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// Lazily evaluated on every app page load (no cron): if any quest assigned
// to this hunter on a prior day was never completed, its 24h window has
// closed — lock the account, reset the streak, and assign a punishment
// quest from the pool. No-ops if the profile is already locked.
//
// Only quests created *after* the hunter's most recent lockout event (or
// account creation, if they've never been locked) are considered. Without
// this cursor, a miss that already triggered — and was cleared by — a
// lockout would immediately re-trigger a new one on the very next page
// load, since completing the punishment quest doesn't retroactively
// complete the quest that was actually missed.
export async function checkAndApplyLockout(profile: Profile) {
  if (profile.locked) return;
  const profileId = profile.id;

  const today = questDayStart();
  const rank = rankForLevel(getLevelProgress(profile.xp).level).code;

  const lastLockout = await prisma.lockoutEvent.findFirst({
    where: { profileId },
    orderBy: { lockedAt: "desc" },
    select: { lockedAt: true },
  });
  const since = lastLockout?.lockedAt ?? profile.createdAt;

  const pastQuests = await prisma.quest.findMany({
    where: {
      OR: [
        { assignScope: "ALL" },
        { assignScope: "RANK", assignRank: rank },
        { assignScope: "SPECIFIC_HUNTER", assignedToId: profileId },
      ],
      createdAt: { lt: today, gte: since },
      scheduledFor: null,
      completions: { none: { profileId } },
    },
    select: { id: true },
    take: 1,
  });

  if (pastQuests.length === 0) return;

  const punishment = await pickPunishmentQuest();

  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profileId },
      data: { locked: true, streak: 0 },
    }),
    prisma.lockoutEvent.create({
      data: {
        profileId,
        reason: "Missed quest window",
        punishmentQuestId: punishment?.id,
      },
    }),
    ...(punishment
      ? [
          prisma.punishmentQuest.update({
            where: { id: punishment.id },
            data: { timesTriggered: { increment: 1 } },
          }),
        ]
      : []),
  ]);
}
