import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Single source of truth for the "hunters have joined" marketing number
// shown on the homepage — deterministic, not random, so every caller at
// the same moment gets the exact same value with no server-side state or
// cron job needed (same lazy-computation idiom used elsewhere in this
// app, e.g. checkAndApplyLockout). Anywhere else on the site that ever
// wants to show this same figure should call this endpoint rather than
// invent its own number, so nothing can ever drift out of sync.
//
// The visible count is a fixed early "vanity" baseline that climbs on a
// steady clock — never the real signup count directly, since this is a
// pre-launch/early-stage product and the real count is still small. It's
// floored by the real count so the marketing number can never claim to
// be *behind* reality, only ahead of it.
const VANITY_BASE = 10_483;
const VANITY_EPOCH = new Date("2026-09-21T08:56:19Z").getTime();
const MS_PER_INCREMENT = 15_000; // ~1 new "hunter" every 15s

export async function GET() {
  const elapsedIncrements = Math.max(0, Math.floor((Date.now() - VANITY_EPOCH) / MS_PER_INCREMENT));
  const vanityCount = VANITY_BASE + elapsedIncrements;

  // The real count is only a safety floor, never load-bearing for the
  // number to render at all — a DB hiccup must never freeze this public,
  // marketing-facing counter, so a failed lookup just skips the floor
  // check instead of failing the whole request.
  let realCount = 0;
  try {
    realCount = await prisma.profile.count({ where: { isAdmin: false } });
  } catch {
    // DB unreachable — fall back to the vanity count alone.
  }

  return NextResponse.json({ total: Math.max(vanityCount, realCount) });
}
