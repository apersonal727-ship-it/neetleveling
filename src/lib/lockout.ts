import { prisma } from "@/lib/prisma";
import type { Profile } from "@/generated/prisma/client";
import { getLevelProgress, rankForLevel } from "@/lib/rank";
import { questDayStart } from "@/lib/quest-day";

// Lazily evaluated on every app page load (no cron): if any quest assigned
// to this hunter on a prior day was never completed, its 24h window has
// closed — lock the account, reset the streak, and assign every punishment
// quest in the pool (all must be cleared to unlock). No-ops if the profile
// is already locked.
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

  const pool = await prisma.punishmentQuest.findMany({ select: { id: true } });

  await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: profileId },
      data: { locked: true, streak: 0, penaltyStreak: { increment: 1 } },
    });
    const lockoutEvent = await tx.lockoutEvent.create({
      data: {
        profileId,
        reason: "Missed quest window",
        penaltyStreakAtLock: profile.penaltyStreak + 1,
      },
    });
    if (pool.length > 0) {
      await tx.lockoutPunishment.createMany({
        data: pool.map((p) => ({ lockoutEventId: lockoutEvent.id, punishmentQuestId: p.id })),
      });
    }
  });
}
