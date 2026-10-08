const START_COUNT = 10;
const CAP_DEFAULT = 50;
const CAP_BIOLOGY = 100;
const STEP_PATTERN = [2, 2, 4];
const CYCLE_SUM = STEP_PATTERN.reduce((a, b) => a + b, 0);

function capForSubject(subject: string): number {
  return subject === "BIOLOGY" ? CAP_BIOLOGY : CAP_DEFAULT;
}

// Daily practice quests ramp with the hunter's streak: 10, 12, 14, 18, 20,
// 22, 26, ... following STEP_PATTERN on repeat. Physics and Chemistry
// stabilize at 50/day (day 16 of an unbroken streak); Biology rides the same
// curve but keeps climbing to 100/day, since it alone carries half the exam
// paper.
export function progressiveQuestionCount(streak: number, subject: string): number {
  const steps = Math.max(0, streak);
  const fullCycles = Math.floor(steps / STEP_PATTERN.length);
  const remainder = steps % STEP_PATTERN.length;
  const partialSum = STEP_PATTERN.slice(0, remainder).reduce((a, b) => a + b, 0);
  return Math.min(capForSubject(subject), START_COUNT + fullCycles * CYCLE_SUM + partialSum);
}

export function isPracticeQuest(title: string): boolean {
  return title.includes("Practice");
}

const FORECAST_SUBJECTS = ["PHYSICS", "CHEMISTRY", "BIOLOGY"] as const;

// Previews tomorrow's practice-quest load assuming today's streak holds
// (i.e. streak + 1) — an honest "if you keep it going" preview, not a
// promise, since the real count only locks in once today's quests actually
// clear and the streak increments tonight. Reuses progressiveQuestionCount
// directly so this can never drift from the real ramp hunters actually see.
export function tomorrowForecast(streak: number): Record<(typeof FORECAST_SUBJECTS)[number], { count: number; cap: number }> {
  const nextStreak = Math.max(0, streak) + 1;
  return Object.fromEntries(
    FORECAST_SUBJECTS.map((subject) => [
      subject,
      { count: progressiveQuestionCount(nextStreak, subject), cap: capForSubject(subject) },
    ]),
  ) as Record<(typeof FORECAST_SUBJECTS)[number], { count: number; cap: number }>;
}

// 1 minute per question — duration rides the same ramp as the question count.
export function practiceQuestDurationMinutes(streak: number, subject: string): number {
  return progressiveQuestionCount(streak, subject);
}

// Rewrites a practice quest's stored (static) title/duration to reflect the
// hunter's live streak — the underlying Quest row is shared across every
// hunter, so this can't be baked in at deploy time.
export function applyPracticeOverrides<
  T extends { title: string; durationMinutes: number; subject: string },
>(quest: T, streak: number): T {
  if (!isPracticeQuest(quest.title)) return quest;
  const questionCount = progressiveQuestionCount(streak, quest.subject);
  const baseTitle = quest.title.replace(/\s*—\s*\d+\s*Questions?$/i, "");
  return {
    ...quest,
    title: `${baseTitle} — ${questionCount} Questions`,
    durationMinutes: practiceQuestDurationMinutes(streak, quest.subject),
  };
}
