const BASE_REPS = 10;
const STEP = 5;
const CAP = 50;

// Punishment reps escalate with penaltyStreak — how many times this hunter
// has EVER been locked, cumulative and never reset (unlike the daily
// practice-quest ramp in progressive-overload.ts, which resets to its
// baseline on every lockout). 10, 15, 20, 25 ... stabilizing at CAP.
export function penaltyReps(penaltyStreak: number): number {
  const streak = Math.max(1, penaltyStreak);
  return Math.min(CAP, BASE_REPS + (streak - 1) * STEP);
}
