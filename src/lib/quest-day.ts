// The hunter's "day" isn't the calendar day — it runs 5:00 AM to 5:00 AM
// IST, so a late-night grind session still counts toward the day you
// started it, and the reset (new quests, lockout check, streak credit)
// lands at a predictable early-morning hour instead of a server-timezone
// midnight nobody in India actually experiences as midnight.
//
// Deliberately timezone-independent: shifts the instant into IST by a
// fixed offset and reads/writes UTC fields, so this is correct regardless
// of what timezone the server process itself runs in.
const IST_OFFSET_MS = (5 * 60 + 30) * 60_000;
const RESET_HOUR_IST = 5;

export function questDayStart(reference: Date = new Date()): Date {
  const shifted = new Date(reference.getTime() + IST_OFFSET_MS);
  if (shifted.getUTCHours() < RESET_HOUR_IST) {
    shifted.setUTCDate(shifted.getUTCDate() - 1);
  }
  shifted.setUTCHours(RESET_HOUR_IST, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
}

export function questDayEnd(reference: Date = new Date()): Date {
  const start = questDayStart(reference);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export function questDayKey(reference: Date): string {
  return questDayStart(reference).toISOString();
}

// N quest-days after `from`'s quest-day (N=0 returns from's own boundary).
export function questDayPlus(from: Date, days: number): Date {
  const start = questDayStart(from);
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}
