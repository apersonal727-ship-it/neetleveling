// The site-wide "hunters have already joined" number — real signups are
// still ~0 pre-launch, so this is a deliberate, deterministic FOMO figure
// shown everywhere a hunter count appears (homepage counter/feed, the
// dashboard's Online/Total Hunters line, etc). It's computed from
// wall-clock time with no server state, so every surface always agrees on
// the exact same number at the exact same moment.
//
// VANITY_EPOCH must never change once this is live — it's the fixed
// anchor everything is measured from. Moving it would make the number
// visibly jump (forward or back) for every visitor at once.
export const VANITY_BASE = 10_483;
export const VANITY_EPOCH = new Date("2026-09-22T14:22:25Z").getTime();

// A repeating cycle of gaps (ms) between ticks, not a single fixed
// interval — a perfectly even beat reads as an obvious loop to anyone
// watching for a bit. Averages ~2.9min/tick, i.e. ~500 new "hunters"/day —
// ~25K after a month, ~100K after 6 months.
export const TICK_CYCLE_MS = [95_000, 210_000, 135_000, 245_000, 118_000, 183_000, 158_000, 248_000];
export const TICK_CYCLE_TOTAL_MS = TICK_CYCLE_MS.reduce((a, b) => a + b, 0);

// How many ticks have fired since VANITY_EPOCH, as of `nowMs` — O(cycle
// length) regardless of how much time has elapsed, so this stays cheap
// forever, not just right after launch.
export function ticksElapsed(nowMs: number) {
  const elapsed = Math.max(0, nowMs - VANITY_EPOCH);
  const fullCycles = Math.floor(elapsed / TICK_CYCLE_TOTAL_MS);
  let remainder = elapsed % TICK_CYCLE_TOTAL_MS;
  let ticksInCycle = 0;
  for (const gap of TICK_CYCLE_MS) {
    if (remainder < gap) break;
    remainder -= gap;
    ticksInCycle += 1;
  }
  return fullCycles * TICK_CYCLE_MS.length + ticksInCycle;
}

export function getVanityHunterCount(nowMs: number = Date.now()) {
  return VANITY_BASE + ticksElapsed(nowMs);
}

// Deterministic PRNG (not Math.random()) — seeded purely from a value
// derived off wall-clock time, so every visitor computes the identical
// "random" number for the same moment instead of each browser drifting
// off on its own independent random walk.
export function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// "Hunters Online" needs to look like a real population of NEET coaching
// students, not a flat percentage of Total Hunters and not each browser's
// own random walk (which is exactly what would let two people compare
// screenshots and catch it as fake). This is deterministic over IST
// time-of-day instead: same wall-clock instant -> same number, for anyone,
// anywhere.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

function istFractionalHour(nowMs: number) {
  const msOfDay = (((nowMs + IST_OFFSET_MS) % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY;
  return msOfDay / MS_PER_HOUR;
}

// One weight per hour of the IST day (0 = quietest, 1 = busiest). Coaching
// batches don't share one schedule — some run live classes 9 AM-3 PM,
// others 10 AM-6 PM — so the true peak is their overlap (10 AM-2 PM), not a
// single evening spike. The afternoon/evening never really drops off
// either: students whose batch just ended switch straight into practice or
// revision quests (self-assigned, not tied to any batch), and the ones who
// couldn't attend live watch the recorded class that evening/at night
// instead — so there's a second, almost-as-tall block from ~6 PM to 9 PM.
// Only 1 AM-5 AM is genuinely quiet.
const HOURLY_WEIGHTS = [
  0.22, 0.14, 0.08, 0.06, 0.08, 0.16, 0.28, 0.45, 0.62, 0.9, 1.0, 1.0, 0.95, 0.92, 0.9, 0.85, 0.78, 0.78, 0.82, 0.88,
  0.92, 0.85, 0.62, 0.38,
];

function cosineInterp(a: number, b: number, t: number) {
  const t2 = (1 - Math.cos(t * Math.PI)) / 2;
  return a * (1 - t2) + b * t2;
}

const HOURLY_WEIGHTS_MEAN = HOURLY_WEIGHTS.reduce((a, b) => a + b, 0) / HOURLY_WEIGHTS.length;

// The batch-schedule shape above shouldn't repeat *identically* every
// single day — a live schedule genuinely drifts day to day (a batch starts
// a little early or late, turnout is heavier or lighter, the whole rhythm
// is looser on a Sunday) — and a curve that peaks at exactly 10:00 AM and
// bottoms at exactly 4:00 AM with the same numbers every day forever would
// be trivially predictable to anyone who happens to check across more than
// one day. So each IST calendar day gets its own small, deterministic
// nudge: the whole curve's phase shifts by up to ~1.5h (the "peak" lands
// at a different hour on different days) and its contrast (peak vs trough
// spread) scales up or down a bit. Continuously interpolated across the
// day (same cosine technique as the hourly/jitter curves), so there's
// never a hard jump right at midnight — the day's "personality" drifts in
// smoothly rather than snapping to a new value.
function dayParams(dayIndex: number) {
  const rand = mulberry32(dayIndex ^ 0x2545f491);
  return {
    phaseShiftHours: (rand() - 0.5) * 3, // -1.5h .. +1.5h
    amplitudeScale: 0.75 + rand() * 0.5, // 0.75x .. 1.25x contrast
  };
}

function dayModifiers(nowMs: number) {
  const dayPos = (nowMs + IST_OFFSET_MS) / MS_PER_DAY;
  const d0 = Math.floor(dayPos);
  const p0 = dayParams(d0);
  const p1 = dayParams(d0 + 1);
  const t = dayPos - d0;
  return {
    phaseShiftHours: cosineInterp(p0.phaseShiftHours, p1.phaseShiftHours, t),
    amplitudeScale: cosineInterp(p0.amplitudeScale, p1.amplitudeScale, t),
  };
}

// Smoothly interpolated diurnal weight (0..1) for `nowMs` — cosine
// interpolation between hours so it drifts continuously across the day
// instead of visibly stair-stepping on the hour, phase-shifted and
// rescaled per day (see dayModifiers) so the exact peak/trough hour and
// how pronounced they are isn't identical day after day.
function diurnalWeight(nowMs: number) {
  const { phaseShiftHours, amplitudeScale } = dayModifiers(nowMs);
  const h = (((istFractionalHour(nowMs) - phaseShiftHours) % 24) + 24) % 24;
  const i0 = Math.floor(h) % 24;
  const i1 = (i0 + 1) % 24;
  const base = cosineInterp(HOURLY_WEIGHTS[i0], HOURLY_WEIGHTS[i1], h - Math.floor(h));
  const scaled = HOURLY_WEIGHTS_MEAN + (base - HOURLY_WEIGHTS_MEAN) * amplitudeScale;
  return Math.min(1, Math.max(0, scaled));
}

// Deterministic "noise" on top of the diurnal curve, so the number keeps
// breathing moment to moment instead of only moving on the hour. Smoothly
// interpolated between 20s anchor points (same cosine technique as
// diurnalWeight) rather than hard-jumping to a new random value at each
// bucket boundary — a discrete jump is both a visible "tell" on its own,
// and, combined with two viewers' independent poll timers landing on
// opposite sides of that same boundary, a real (if brief) window where two
// people could genuinely see different numbers. Continuous interpolation
// means any two reads close together in time are always close together in
// value, no matter how their poll timers happen to line up.
const JITTER_BUCKET_MS = 20_000;
function jitterFor(nowMs: number, salt: number) {
  const bucketPos = nowMs / JITTER_BUCKET_MS;
  const i0 = Math.floor(bucketPos);
  const i1 = i0 + 1;
  const v0 = mulberry32(i0 ^ salt)() * 2 - 1;
  const v1 = mulberry32(i1 ^ salt)() * 2 - 1;
  return cosineInterp(v0, v1, bucketPos - i0); // -1..1
}

// Fractions of Total Hunters, not small slivers — this is a platform meant
// to feel packed, not sparse: a fifth online even at 3 AM, and nearly half
// online at once during the 10 AM-2 PM batch overlap.
export function getHuntersOnline(totalHunters: number, nowMs: number = Date.now()) {
  const weight = diurnalWeight(nowMs);
  const baseFrac = 0.18 + weight * (0.46 - 0.18);
  const frac = Math.max(0.14, baseFrac + jitterFor(nowMs, 0x9e3779b1) * 0.02);
  return Math.max(200, Math.round(totalHunters * frac));
}

