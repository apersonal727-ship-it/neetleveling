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

// All of today's quests assigned to this hunter (ALL / their current rank /
// them specifically) — quests created today, or explicitly scheduled for
// today — each with their own completion status for this hunter. A hunter
// has several quests a day (class + practice per subject), not just one;
// shared by both the dashboard and the quests page so they never disagree.
export async function getTodaysQuests(profileId: string, level: number) {
  const rank = rankForLevel(level).code;

  const startOfDay = questDayStart();
  const endOfDay = questDayEnd();

  return prisma.quest.findMany({
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
}
