import { createHmac, timingSafeEqual } from "crypto";
import { getLevelProgress, RANKS } from "@/lib/rank";

// The Rank Up and Level Up screens exist only for a hunter the server has just
// handed a pass to — at the real moment of ranking / levelling up, or (Rank Up
// only) when they click an unlocked rank card on their Profile. Anything else
// (typed address, shared link, refresh, a rank they haven't reached) gets a
// plain 404, as if the page didn't exist. A pass is an HMAC bound to the
// hunter, the screen, a small piece of data and an expiry, so it can't be
// forged, reused by someone else, or kept for later.

const TTL_MS = 60_000;
export const RANK_UP_CODES = ["D", "C", "B", "A", "S"] as const;
export type RankUpCode = (typeof RANK_UP_CODES)[number];

export function isRankUpCode(code: string): code is RankUpCode {
  return (RANK_UP_CODES as readonly string[]).includes(code);
}

// Has this hunter reached `rank`? (Locked ranks have no screen to visit.)
export function isRankUnlocked(xp: number, rank: RankUpCode): boolean {
  const info = RANKS.find((r) => r.code === rank);
  return !!info && getLevelProgress(xp).level >= info.minLevel;
}

function secret(): string | null {
  return process.env.RANKUP_SECRET || process.env.CASHFREE_SECRET_KEY || process.env.ADMIN_PASSWORD || null;
}

function sign(profileId: string, scope: string, data: string, exp: number): string | null {
  const key = secret();
  if (!key) return null; // no secret configured -> no pass can ever verify (fails closed)
  return createHmac("sha256", key).update(`${profileId}|${scope}|${data}|${exp}`).digest("base64url");
}

// scope: "rank:D" | "level".  data: how the screen continues ("quest" | "profile"
// for Rank Up) or the XP just earned (Level Up) — signed, so it can't be edited.
export function createPass(profileId: string, scope: string, data: string, now = Date.now()): string | null {
  const exp = now + TTL_MS;
  const sig = sign(profileId, scope, data, exp);
  return sig ? `${exp}.${encodeURIComponent(data)}.${sig}` : null;
}

// Returns the signed data when the pass is valid for this hunter + scope, else null.
export function verifyPass(token: string | undefined, profileId: string, scope: string, now = Date.now()): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [expStr, dataEnc, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < now) return null;
  let data: string;
  try {
    data = decodeURIComponent(dataEnc);
  } catch {
    return null;
  }
  const expected = sign(profileId, scope, data, exp);
  if (!expected) return null;
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b) ? data : null;
}

// ── Celebration chain ────────────────────────────────────────────────────────
// A quest finish can trigger up to three screens, always in this order:
// Day Clear -> Level Up -> Rank Up. Each pass carries (signed) the screens still
// to come and where the hunter lands at the end, so Continue just follows it.
export type Step = "day" | "level" | `rank:${RankUpCode}`;
export type Dest = "profile" | "dashboard" | "back";
export type PassData = { x?: number; r: string[]; d: Dest };

export function packData(d: PassData): string {
  return JSON.stringify(d);
}

export function parseData(raw: string | null): PassData | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<PassData>;
    if (!Array.isArray(v.r) || !v.r.every((x) => typeof x === "string")) return null;
    if (v.d !== "profile" && v.d !== "dashboard" && v.d !== "back") return null;
    return { x: typeof v.x === "number" ? v.x : undefined, r: v.r, d: v.d };
  } catch {
    return null;
  }
}

export function isStep(step: string): step is Step {
  return step === "day" || step === "level" || (step.startsWith("rank:") && isRankUpCode(step.slice(5)));
}
