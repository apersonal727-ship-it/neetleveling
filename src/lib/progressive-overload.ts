const START_COUNT = 10;
const CAP = 50;
const STEP_PATTERN = [2, 2, 4];
const CYCLE_SUM = STEP_PATTERN.reduce((a, b) => a + b, 0);

// Daily practice quests ramp with the hunter's streak: 10, 12, 14, 18, 20,
// 22, 26, ... following STEP_PATTERN on repeat, stabilizing at CAP once
// reached (day 16 of an unbroken streak) and holding there indefinitely.
export function progressiveQuestionCount(streak: number): number {
  const steps = Math.max(0, streak);
  const fullCycles = Math.floor(steps / STEP_PATTERN.length);
  const remainder = steps % STEP_PATTERN.length;
  const partialSum = STEP_PATTERN.slice(0, remainder).reduce((a, b) => a + b, 0);
  return Math.min(CAP, START_COUNT + fullCycles * CYCLE_SUM + partialSum);
}
