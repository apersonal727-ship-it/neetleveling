import { prisma } from "@/lib/prisma";
import { rankForLevel } from "@/lib/rank";
import { questDayStart, questDayEnd } from "@/lib/quest-day";

const SUBJECT_LABEL: Record<string, string> = {
  PHYSICS: "PHYSICS",
  CHEMISTRY: "CHEMISTRY",
  BIOLOGY: "BIOLOGY",
  DISCIPLINE: "DISCIPLINE",
  SECRET: "SECRET",
};

export function questSubjectLabel(subject: string) {
  return SUBJECT_LABEL[subject] ?? subject;
}

// Today's quest set for this hunter: quests created today (or explicitly
// scheduled for today) that target them via ALL / their current rank / them
// specifically. Returns the next not-yet-completed one to act on, plus how
// many total/remaining there are today — a hunter has several quests a day
// (class + practice per subject), not just one.
export async function getTodaysQuest(profileId: string, level: number) {
  const rank = rankForLevel(level).code;

  const startOfDay = questDayStart();
  const endOfDay = questDayEnd();

  const quests = await prisma.quest.findMany({
    where: {
      OR: [
        { assignScope: "ALL" },
        { assignScope: "RANK", assignRank: rank },
        { assignScope: "SPECIFIC_HUNTER", assignedToId: profileId },
      ],
      AND: [
        {
          OR: [
            { scheduledFor: null, createdAt: { gte: startOfDay, lt: endOfDay } },
            { scheduledFor: { gte: startOfDay, lt: endOfDay } },
          ],
        },
      ],
    },
    include: { completions: { where: { profileId } } },
    orderBy: { createdAt: "asc" },
  });

  const incomplete = quests.filter((q) => q.completions.length === 0);

  return {
    next: incomplete[0] ?? null,
    total: quests.length,
    remaining: incomplete.length,
  };
}
