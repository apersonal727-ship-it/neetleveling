import { prisma } from "@/lib/prisma";
import { questDayStart } from "@/lib/quest-day";

// A hunter's self-added quests. ONCE quests are due only on the quest-day
// they were created and stay done forever after a single completion; DAILY
// quests persist and reset every quest-day, so "done today" is derived from
// whether any completion falls within the current quest-day window.
export async function getPersonalQuests(profileId: string) {
  const quests = await prisma.personalQuest.findMany({
    where: { profileId },
    include: { completions: true },
    orderBy: { createdAt: "asc" },
  });

  const todayStart = questDayStart();
  return quests.map((q) => ({
    ...q,
    done:
      q.frequency === "ONCE"
        ? q.completions.length > 0
        : q.completions.some((c) => c.completedAt >= todayStart),
  }));
}
