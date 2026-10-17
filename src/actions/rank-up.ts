"use server";

import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { getLevelProgress } from "@/lib/rank";
import { getOpenMandatoryQuests } from "@/lib/open-quests";
import {
  createPass,
  isRankUnlocked,
  isRankUpCode,
  isStep,
  packData,
  type Dest,
} from "@/lib/rank-up-pass";

export type OpenResult = { href: string } | { error: string };

// A celebration after a quest finish is only ever opened within this long of the finish.
const RECENT_MS = 5 * 60_000;
const NOT_AVAILABLE: OpenResult = { error: "Not available." };

// Opens the first of `steps` (an ordered list like ["day", "level", "rank:C"]) by
// issuing the signed pass its screen requires. The rest of the list and the final
// destination ride inside that pass, so each screen's Continue knows what's next.
// Every step is re-checked here, so a tampered list can't open anything the hunter
// hasn't genuinely earned.
export async function openStep(steps: string[], dest: Dest): Promise<OpenResult> {
  const [step, ...rest] = steps;
  if (!step || !isStep(step) || (dest !== "profile" && dest !== "dashboard") || !rest.every(isStep)) return NOT_AVAILABLE;

  const profile = await getCurrentProfile();

  if (step.startsWith("rank:")) {
    const code = step.slice(5);
    if (!isRankUpCode(code) || !isRankUnlocked(profile.xp, code)) return NOT_AVAILABLE;
    const pass = createPass(profile.id, step, packData({ r: rest, d: dest }));
    return pass ? { href: `/rank-up/${code}?t=${encodeURIComponent(pass)}` } : NOT_AVAILABLE;
  }

  // Day Clear and Level Up exist only right after a quest was finished.
  const last = await prisma.questCompletion.findFirst({
    where: { profileId: profile.id },
    orderBy: { completedAt: "desc" },
    select: { xpAwarded: true, completedAt: true },
  });
  const recentFinish = !!last && Date.now() - last.completedAt.getTime() <= RECENT_MS;

  if (step === "level") {
    if (!last || !recentFinish) return NOT_AVAILABLE;
    const pass = createPass(profile.id, "level", packData({ x: last.xpAwarded, r: rest, d: dest }));
    return pass ? { href: `/level-up?t=${encodeURIComponent(pass)}` } : NOT_AVAILABLE;
  }

  // "day": the day must really be cleared. (A personal quest can clear it without
  // any XP, so a recent finish is judged by the hunter's session history below.)
  const open = await getOpenMandatoryQuests(profile.id, getLevelProgress(profile.xp).level, profile.streak);
  if (open.length > 0) return NOT_AVAILABLE;
  const recentSession = await prisma.questSession.findFirst({
    where: { profileId: profile.id, status: "COMPLETED", completedAt: { gte: new Date(Date.now() - RECENT_MS) } },
    select: { id: true },
  });
  if (!recentFinish && !recentSession) return NOT_AVAILABLE;
  const pass = createPass(profile.id, "day", packData({ r: rest, d: dest }));
  return pass ? { href: `/day-clear?t=${encodeURIComponent(pass)}` } : NOT_AVAILABLE;
}

// Rank Up from an unlocked rank card on the Profile: no chain, and Continue steps back.
export async function openRankUp(rank: string): Promise<OpenResult> {
  const code = String(rank).toUpperCase();
  if (!isRankUpCode(code)) return NOT_AVAILABLE;
  const profile = await getCurrentProfile();
  if (!isRankUnlocked(profile.xp, code)) return NOT_AVAILABLE;
  const pass = createPass(profile.id, `rank:${code}`, packData({ r: [], d: "back" }));
  return pass ? { href: `/rank-up/${code}?t=${encodeURIComponent(pass)}` } : NOT_AVAILABLE;
}
