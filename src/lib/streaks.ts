import { prisma } from "@/lib/prisma";
import { getLevelProgress } from "@/lib/rank";
import { getTodaysQuests } from "@/lib/todays-quest";
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

  // Same list the Dashboard and Quests counters render (getTodaysQuests,
  // which honors scheduledFor). Querying quests by createdAt alone here let
  // an admin-scheduled-for-tomorrow quest block today's streak while being
  // invisible on every screen.
  const todaysQuests = await getTodaysQuests(profileId, getLevelProgress(profile.xp).level);

  if (todaysQuests.length === 0) return;
  if (todaysQuests.some((q) => q.completions.length === 0)) return;

  // Mandatory personal quests gate the day exactly like system quests do —
  // every DAILY one, plus a ONCE one on the day it was created (its only due
  // day). Same definition as getPersonalQuests' countsToday, so the streak,
  // the day-clear screen, and the counters can't disagree.
  const mandatoryToday = await prisma.personalQuest.findMany({
    where: {
      profileId,
      mandatory: true,
      OR: [{ frequency: "DAILY" }, { frequency: "ONCE", createdAt: { gte: today, lt: tomorrow } }],
    },
    select: { completions: { where: { completedAt: { gte: today, lt: tomorrow } }, select: { id: true } } },
  });
  if (mandatoryToday.some((q) => q.completions.length === 0)) return;

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
