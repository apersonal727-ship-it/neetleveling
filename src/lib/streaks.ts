import { prisma } from "@/lib/prisma";
import { getLevelProgress, rankForLevel } from "@/lib/rank";
import { questDayStart } from "@/lib/quest-day";

function isSameDay(a: Date | null, b: Date) {
  if (!a) return false;
  return questDayStart(a).getTime() === questDayStart(b).getTime();
}

// A day only counts as cleared if every quest assigned to this profile that
// day has been completed. Call after each quest completion — it's a no-op
// unless this was the last remaining quest for today, and it only ever
// credits the streak once per calendar day (guarded by lastStreakDate).
export async function maybeIncrementStreak(profileId: string) {
  const today = questDayStart();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const profile = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
  if (isSameDay(profile.lastStreakDate, today)) return;

  const rank = rankForLevel(getLevelProgress(profile.xp).level).code;

  const todaysQuests = await prisma.quest.findMany({
    where: {
      OR: [
        { assignScope: "ALL" },
        { assignScope: "RANK", assignRank: rank },
        { assignScope: "SPECIFIC_HUNTER", assignedToId: profileId },
      ],
      createdAt: { gte: today, lt: tomorrow },
    },
    select: { id: true },
  });

  if (todaysQuests.length === 0) return;

  const completedCount = await prisma.questCompletion.count({
    where: {
      profileId,
      questId: { in: todaysQuests.map((q) => q.id) },
      completedAt: { gte: today, lt: tomorrow },
    },
  });

  if (completedCount < todaysQuests.length) return;

  const newStreak = profile.streak + 1;
  await prisma.profile.update({
    where: { id: profileId },
    data: {
      streak: newStreak,
      bestStreak: Math.max(profile.bestStreak, newStreak),
      lastStreakDate: today,
    },
  });
}
