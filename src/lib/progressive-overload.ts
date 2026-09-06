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
