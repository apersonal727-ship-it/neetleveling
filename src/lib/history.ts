import { prisma } from "@/lib/prisma";
import { penaltyReps, penaltyDurationMinutes } from "@/lib/penalty";
import { questDayKey, questDayPlus, questDayStart } from "@/lib/quest-day";

// Every "day" on this page is the hunter's 5 AM–5 AM IST quest day (see
// quest-day.ts), not the server's calendar day — otherwise a completion
// at 3 AM IST lands on the wrong heatmap cell whenever the server runs in
// UTC, and the page disagrees with the Dashboard about what "today" is.

export async function getHistorySummary(profileId: string) {
  const profile = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
  const [totalCompleted, personalCompleted, lockoutsTotal] = await Promise.all([
    prisma.questCompletion.count({ where: { profileId } }),
    prisma.personalQuestCompletion.count({ where: { personalQuest: { profileId } } }),
    prisma.lockoutEvent.count({ where: { profileId } }),
  ]);

  return {
    questsCompleted: totalCompleted + personalCompleted,
    lockoutsTotal,
    currentStreak: profile.streak,
    longestStreak: profile.bestStreak,
  };
}

const HOUR_REFERENCE = 10;

export async function getSubjectHours(profileId: string) {
  const [completions, personalCompletions] = await Promise.all([
    prisma.questCompletion.findMany({
      where: { profileId },
      include: { quest: { select: { subject: true, durationMinutes: true } } },
    }),
    prisma.personalQuestCompletion.findMany({
      where: { personalQuest: { profileId } },
      select: { personalQuest: { select: { subject: true, durationMinutes: true } } },
    }),
  ]);

  const minutesBySubject: Record<string, number> = {};
  for (const c of completions) {
    minutesBySubject[c.quest.subject] =
      (minutesBySubject[c.quest.subject] ?? 0) + (c.durationMinutes ?? c.quest.durationMinutes);
  }
  // Personal quests store a free-text subject ("Physics"…) or none; only
  // the ones tagged with one of the three subjects add to its bar.
  for (const c of personalCompletions) {
    const key = c.personalQuest.subject?.toUpperCase();
    if (!key) continue;
    minutesBySubject[key] = (minutesBySubject[key] ?? 0) + c.personalQuest.durationMinutes;
  }

  const subjects = [
    { key: "PHYSICS", label: "Physics" },
    { key: "CHEMISTRY", label: "Chemistry" },
    { key: "BIOLOGY", label: "Biology" },
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
  const today = questDayStart();
  const start = questDayPlus(today, -(days - 1));

  const [completions, personalCompletions, lockouts] = await Promise.all([
    prisma.questCompletion.findMany({
      where: { profileId, completedAt: { gte: start } },
      select: { completedAt: true },
    }),
    prisma.personalQuestCompletion.findMany({
      where: { personalQuest: { profileId }, completedAt: { gte: start } },
      select: { completedAt: true },
    }),
    prisma.lockoutEvent.findMany({
      where: { profileId, lockedAt: { gte: start } },
      select: { lockedAt: true },
    }),
  ]);

  const countByDay = new Map<string, number>();
  for (const c of [...completions, ...personalCompletions]) {
    const key = questDayKey(c.completedAt);
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  }
  const missDays = new Set(lockouts.map((l) => questDayKey(l.lockedAt)));

  const cells: { date: string; state: "" | "l1" | "l2" | "l3" | "miss" }[] = [];
  for (let i = 0; i < days; i++) {
    const key = questDayPlus(start, i).toISOString();
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
  | { kind: "personal"; title: string; subject: string | null; durationMinutes: number; at: Date }
  | { kind: "penalty"; title: string; durationMinutes: number; at: Date; resolved: boolean };

export async function getRecentActivity(profileId: string, limit = 12): Promise<ActivityEntry[]> {
  const completions = await prisma.questCompletion.findMany({
    where: { profileId },
    include: { quest: true },
    orderBy: { completedAt: "desc" },
    take: limit,
  });
  const personalCompletions = await prisma.personalQuestCompletion.findMany({
    where: { personalQuest: { profileId } },
    include: { personalQuest: true },
    orderBy: { completedAt: "desc" },
    take: limit,
  });
  const lockouts = await prisma.lockoutEvent.findMany({
    where: { profileId },
    include: { punishments: { include: { punishmentQuest: true } } },
    orderBy: { lockedAt: "desc" },
    take: limit,
  });

  const entries: ActivityEntry[] = [
    ...completions.map(
      (c): ActivityEntry => ({
        kind: "quest",
        title: c.quest.title,
        subject: c.quest.subject,
        durationMinutes: c.durationMinutes ?? c.quest.durationMinutes,
        xp: c.xpAwarded,
        at: c.completedAt,
      }),
    ),
    ...personalCompletions.map(
      (c): ActivityEntry => ({
        kind: "personal",
        title: c.personalQuest.title,
        subject: c.personalQuest.subject,
        durationMinutes: c.personalQuest.durationMinutes,
        at: c.completedAt,
      }),
    ),
    ...lockouts.map((l): ActivityEntry => {
      const reps = penaltyReps(l.penaltyStreakAtLock);
      return {
        kind: "penalty",
        title:
          l.punishments.length > 0
            ? l.punishments.map((p) => `${reps} ${p.punishmentQuest.title}`).join(", ")
            : "Punishment quest",
        durationMinutes: penaltyDurationMinutes(l.penaltyStreakAtLock),
        at: l.lockedAt,
        resolved: l.resolved,
      };
    }),
  ];

  entries.sort((a, b) => b.at.getTime() - a.at.getTime());
  return entries.slice(0, limit);
}
