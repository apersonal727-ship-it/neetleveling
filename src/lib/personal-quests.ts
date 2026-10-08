import { prisma } from "@/lib/prisma";
import { questDayStart, questDayKey } from "@/lib/quest-day";

// A hunter's self-added quests. ONCE quests are due only on the quest-day
// they were created and stay done forever after a single completion; DAILY
// quests persist and reset every quest-day, so "done today" is derived from
// whether any completion falls within the current quest-day window.
//
// completionRate is only meaningful for a DAILY quest with at least one full
// quest-day of history behind it — a ONCE quest has no repeat to rate, and a
// quest created today hasn't had a chance to be missed or kept yet, so both
// report null ("fresh", no history) rather than a misleading 0% or 100%.
export async function getPersonalQuests(profileId: string) {
  const quests = await prisma.personalQuest.findMany({
    where: { profileId },
    include: { completions: true },
    orderBy: { createdAt: "asc" },
  });

  const todayStart = questDayStart();
  const todayKey = questDayKey(todayStart);

  return quests.map((q) => {
    const done =
      q.frequency === "ONCE"
        ? q.completions.length > 0
        : q.completions.some((c) => c.completedAt >= todayStart);

    let completionRate: number | null = null;
    if (q.frequency === "DAILY") {
      const createdKey = questDayKey(q.createdAt);
      const totalDueDays =
        Math.round((Date.parse(todayKey) - Date.parse(createdKey)) / (24 * 60 * 60 * 1000)) + 1;
      if (totalDueDays > 1) {
        const completedDayKeys = new Set(q.completions.map((c) => questDayKey(c.completedAt)));
        completionRate = Math.round((completedDayKeys.size / totalDueDays) * 100);
      }
    }

    // Mandatory quests that gate today: every DAILY one, plus a ONCE one only
    // on the quest-day it was created (that's the only day it's "due" — an
    // older uncompleted ONCE quest already had its lockout chance and must
    // not block streaks/day-clear forever after).
    const countsToday =
      q.mandatory && (q.frequency === "DAILY" || q.createdAt >= todayStart);

    return { ...q, done, completionRate, countsToday };
  });
}
