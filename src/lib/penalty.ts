const REPS_BASE = 10;
const REPS_STEP = 5;
const REPS_CAP = 50;

const DURATION_BASE = 5;
const DURATION_STEP_PATTERN = [3, 2];
const DURATION_CAP = 25;

// Penalty escalation is keyed off penaltyStreak — how many times this
// hunter has EVER been locked, cumulative and never reset (unlike the
// daily practice-quest ramp in progressive-overload.ts, which resets to
// its baseline on every lockout). Reps and duration climb in lockstep and
// both stabilize once reps hit REPS_CAP.
function tierSteps(penaltyStreak: number): number {
  return Math.max(1, penaltyStreak) - 1;
}

// 10, 15, 20, 25 ... stabilizing at 50.
export function penaltyReps(penaltyStreak: number): number {
  return Math.min(REPS_CAP, REPS_BASE + tierSteps(penaltyStreak) * REPS_STEP);
}

// 5, 8, 10, 13, 15 ... stabilizing at 25 (alternating +3/+2 per tier).
export function penaltyDurationMinutes(penaltyStreak: number): number {
  const steps = tierSteps(penaltyStreak);
  const cycleLen = DURATION_STEP_PATTERN.length;
  const cycleSum = DURATION_STEP_PATTERN.reduce((a, b) => a + b, 0);
  const fullCycles = Math.floor(steps / cycleLen);
  const remainder = steps % cycleLen;
  const partialSum = DURATION_STEP_PATTERN.slice(0, remainder).reduce((a, b) => a + b, 0);
  return Math.min(DURATION_CAP, DURATION_BASE + fullCycles * cycleSum + partialSum);
}
