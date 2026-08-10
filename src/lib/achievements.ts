import { prisma } from "@/lib/prisma";
import { getLevelProgress } from "@/lib/rank";

export type Badge = {
  key: string;
  name: string;
  unlocked: boolean;
  progress?: string;
  icon: "flame" | "shield" | "scroll" | "network" | "sun" | "warning";
};

export async function getBadges(profileId: string) {
  const profile = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
  const level = getLevelProgress(profile.xp).level;

  const questsCompleted = await prisma.questCompletion.count({ where: { profileId } });
  const disciplineCompletions = await prisma.questCompletion.count({
    where: { profileId, quest: { subject: "DISCIPLINE" } },
  });
  const referralCount = await prisma.profile.count({
    where: { referredByCode: profile.referralCode },
  });
  const resolvedLockouts = await prisma.lockoutEvent.count({
    where: { profileId, resolved: true },
  });

  const badges: Badge[] = [
    {
      key: "streak-7",
      name: "7-Day Streak",
      icon: "flame",
      unlocked: profile.bestStreak >= 7,
    },
    {
      key: "streak-21",
      name: "21-Day Streak",
      icon: "flame",
      unlocked: profile.bestStreak >= 21,
    },
    {
      key: "streak-100",
      name: "100-Day Streak",
      icon: "flame",
      unlocked: profile.bestStreak >= 100,
      progress: `${Math.min(profile.bestStreak, 100)}/100`,
    },
    { key: "rank-d", name: "Reached D", icon: "shield", unlocked: level >= 20 },
    { key: "rank-c", name: "Reached C", icon: "shield", unlocked: level >= 40 },
    {
      key: "rank-b",
      name: "Reached B",
      icon: "shield",
      unlocked: level >= 60,
      progress: `LVL ${level}/60`,
    },
    {
      key: "rank-a",
      name: "Reached A",
      icon: "shield",
      unlocked: level >= 80,
      progress: `LVL ${level}/80`,
    },
    {
      key: "rank-s",
      name: "Shadow Monarch",
      icon: "shield",
      unlocked: level >= 100,
      progress: `LVL ${level}/100`,
    },
    { key: "quests-100", name: "100 Quests", icon: "scroll", unlocked: questsCompleted >= 100 },
    { key: "quests-300", name: "300 Quests", icon: "scroll", unlocked: questsCompleted >= 300 },
    {
      key: "quests-750",
      name: "750 Quests",
      icon: "scroll",
      unlocked: questsCompleted >= 750,
      progress: `${questsCompleted}/750`,
    },
    { key: "recruit-1", name: "First Recruit", icon: "network", unlocked: referralCount >= 1 },
    {
      key: "recruit-10",
      name: "Recruiter x10",
      icon: "network",
      unlocked: referralCount >= 10,
      progress: `${referralCount}/10`,
    },
    {
      key: "discipline-5",
      name: "5 AM Club",
      icon: "sun",
      unlocked: disciplineCompletions >= 5,
      progress: disciplineCompletions < 5 ? `${disciplineCompletions}/5` : undefined,
    },
    {
      key: "comeback",
      name: "Comeback",
      icon: "warning",
      unlocked: resolvedLockouts >= 1,
      progress: resolvedLockouts < 1 ? "After a lockout" : undefined,
    },
  ];

  return badges;
}
