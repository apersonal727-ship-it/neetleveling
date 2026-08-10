import { prisma } from "@/lib/prisma";
import { rankForLevel } from "@/lib/rank";

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

// Today's assigned-but-not-yet-completed quest for this hunter: quests
// created today (or explicitly scheduled for today) that target them via
// ALL / their current rank / them specifically, and that they haven't
// already finished or don't have an active Focus Lock session for.
export async function getTodaysQuest(profileId: string, level: number) {
  const rank = rankForLevel(level).code;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

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
      completions: { none: { profileId } },
    },
    orderBy: { createdAt: "asc" },
    take: 1,
  });

  return quests[0] ?? null;
}
