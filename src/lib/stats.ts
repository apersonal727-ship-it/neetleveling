import { prisma } from "@/lib/prisma";
import { isPracticeQuest } from "@/lib/progressive-overload";

const HOUR_REFERENCE = 10; // matches the History page's 10-hour reference bar
const CLASS_SUBJECTS = new Set(["PHYSICS", "CHEMISTRY", "BIOLOGY"]);

function hoursToPct(hours: number) {
  return Math.min(100, Math.round((hours / HOUR_REFERENCE) * 100));
}

// Five stats, derived from real quest activity. VIT (sleep/exercise/diet) has
// no dedicated quest subject in the schema yet, so it stays at 0 until that's
// added — it's an honest gap, not a placeholder value.
export async function getStatBars(profileId: string) {
  const completions = await prisma.questCompletion.findMany({
    where: { profileId },
    include: { quest: { select: { subject: true, durationMinutes: true } } },
  });

  const minutesBySubject: Record<string, number> = {};
  for (const c of completions) {
    const subj = c.quest.subject;
    minutesBySubject[subj] = (minutesBySubject[subj] ?? 0) + c.quest.durationMinutes;
  }

  const intHours =
    ((minutesBySubject.PHYSICS ?? 0) +
      (minutesBySubject.CHEMISTRY ?? 0) +
      (minutesBySubject.BIOLOGY ?? 0)) /
    60;
  const disHours = (minutesBySubject.DISCIPLINE ?? 0) / 60;

  const focusSessions = await prisma.questSession.aggregate({
    where: { profileId, kind: "QUEST", status: "COMPLETED" },
    _count: { id: true },
  });
  // Rough proxy for "deep-work blocks" until Focus Lock sessions track
  // actual elapsed duration separately from the quest's assigned duration.
  const focHours = Math.min(HOUR_REFERENCE, focusSessions._count.id * 0.5);

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { streak: true },
  });
  const perPct = Math.min(100, (profile?.streak ?? 0) * 3);

  return [
    { key: "INT", name: "Physics · Chem · Bio hours", pct: hoursToPct(intHours) },
    { key: "DIS", name: "Wake time · no-phone hours", pct: hoursToPct(disHours) },
    { key: "VIT", name: "Sleep · exercise · diet", pct: 0 },
    { key: "FOC", name: "Deep-work blocks", pct: hoursToPct(focHours) },
    { key: "PER", name: "Streak · consistency", pct: perPct },
  ];
}

// Lifetime Hunter Stats — Class Hours, Question Hours, and Questions Solved.
// Practice quests run exactly 1 minute per question (see
// progressive-overload.ts), so a completed practice quest's recorded
// duration doubles as its question count: questionsSolved is that same
// total expressed as a count instead of hours, not a separately tracked
// number.
export async function getHunterProgressStats(profileId: string) {
  const completions = await prisma.questCompletion.findMany({
    where: { profileId },
    include: { quest: { select: { subject: true, durationMinutes: true, title: true } } },
  });

  let classMinutes = 0;
  let practiceMinutes = 0;
  for (const c of completions) {
    if (!CLASS_SUBJECTS.has(c.quest.subject)) continue;
    if (isPracticeQuest(c.quest.title)) {
      practiceMinutes += c.quest.durationMinutes;
    } else {
      classMinutes += c.quest.durationMinutes;
    }
  }

  return {
    classHours: Math.round(classMinutes / 60),
    questionHours: Math.round(practiceMinutes / 60),
    questionsSolved: practiceMinutes,
  };
}
