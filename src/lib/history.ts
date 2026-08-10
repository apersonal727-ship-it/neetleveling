import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function dayKey(d: Date) {
  return startOfDay(d).toISOString();
}

export async function getHistorySummary(profileId: string) {
  const profile = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
  const totalCompleted = await prisma.questCompletion.count({ where: { profileId } });

  const totalAssigned = await prisma.quest.count({
    where: {
      OR: [
        { assignScope: "ALL" },
        { assignScope: "SPECIFIC_HUNTER", assignedToId: profileId },
      ],
    },
  });

  const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

  return {
    questsCompleted: totalCompleted,
    completionRate,
    currentStreak: profile.streak,
    longestStreak: profile.bestStreak,
  };
}

const HOUR_REFERENCE = 10;

export async function getSubjectHours(profileId: string) {
  const completions = await prisma.questCompletion.findMany({
    where: { profileId },
    include: { quest: { select: { subject: true, durationMinutes: true } } },
  });

  const minutesBySubject: Record<string, number> = {};
  for (const c of completions) {
    minutesBySubject[c.quest.subject] =
      (minutesBySubject[c.quest.subject] ?? 0) + c.quest.durationMinutes;
  }

  const subjects = [
    { key: "PHYSICS", label: "Physics" },
    { key: "CHEMISTRY", label: "Chemistry" },
    { key: "BIOLOGY", label: "Biology" },
    { key: "DISCIPLINE", label: "Discipline" },
  ];

  return subjects.map((s) => {
    const hours = (minutesBySubject[s.key] ?? 0) / 60;
    return {
      label: s.label,
      hours,
      pct: Math.min(100, Math.round((hours / HOUR_REFERENCE) * 100)),
    };
  });
}

export async function getHeatmap(profileId: string, days = 70) {
  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  const completions = await prisma.questCompletion.findMany({
    where: { profileId, completedAt: { gte: start } },
    select: { completedAt: true },
  });
  const lockouts = await prisma.lockoutEvent.findMany({
    where: { profileId, lockedAt: { gte: start } },
    select: { lockedAt: true },
  });

  const countByDay = new Map<string, number>();
  for (const c of completions) {
    const key = dayKey(c.completedAt);
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  }
  const missDays = new Set(lockouts.map((l) => dayKey(l.lockedAt)));

  const cells: { date: string; state: "" | "l1" | "l2" | "l3" | "miss" }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = dayKey(d);
    if (missDays.has(key)) {
      cells.push({ date: key, state: "miss" });
      continue;
    }
    const count = countByDay.get(key) ?? 0;
    const state = count >= 3 ? "l3" : count === 2 ? "l2" : count === 1 ? "l1" : "";
    cells.push({ date: key, state });
  }

  return cells;
}

export type ActivityEntry =
  | { kind: "quest"; title: string; subject: string; durationMinutes: number; xp: number; at: Date }
  | { kind: "penalty"; title: string; durationMinutes: number; at: Date; resolved: boolean };

export async function getRecentActivity(profileId: string, limit = 12): Promise<ActivityEntry[]> {
  const completions = await prisma.questCompletion.findMany({
    where: { profileId },
    include: { quest: true },
    orderBy: { completedAt: "desc" },
    take: limit,
  });
  const lockouts = await prisma.lockoutEvent.findMany({
    where: { profileId },
    include: { punishmentQuest: true },
    orderBy: { lockedAt: "desc" },
    take: limit,
  });

  const entries: ActivityEntry[] = [
    ...completions.map(
      (c): ActivityEntry => ({
        kind: "quest",
        title: c.quest.title,
        subject: c.quest.subject,
        durationMinutes: c.quest.durationMinutes,
        xp: c.xpAwarded,
        at: c.completedAt,
      }),
    ),
    ...lockouts.map(
      (l): ActivityEntry => ({
        kind: "penalty",
        title: l.punishmentQuest?.title ?? "Punishment quest",
        durationMinutes: l.punishmentQuest?.durationMinutes ?? 0,
        at: l.lockedAt,
        resolved: l.resolved,
      }),
    ),
  ];

  entries.sort((a, b) => b.at.getTime() - a.at.getTime());
  return entries.slice(0, limit);
}
