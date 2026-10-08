"use client";

import { useEffect, useRef } from "react";
import { VANITY_BASE, ticksElapsed, getHuntersOnline } from "@/lib/vanity-stats";
import styles from "@/app/(app)/dashboard/dashboard.module.css";

// Total Hunters is shown exact, never rounded to "10,000+" — that would sit
// visually frozen for hours at a time between thousand-boundaries, which
// defeats the whole point of it being a live, always-visibly-climbing
// number (see getVanityHunterCount in @/lib/vanity-stats).
//
// Neither number has anything real behind it — real signups are still ~0
// pre-launch. Both are the same deterministic FOMO figures shown on the
// homepage (see @/lib/vanity-stats): pure functions of wall-clock time, so
// any two viewers at the same moment always see the same numbers. Arrives
// as server-rendered starting values (matching first paint, no hydration
// mismatch), then polls the same formulas client-side so it keeps
// climbing/drifting live for as long as this stays mounted.
export function NetworkPulseLine({
  totalHunters,
  huntersOnline,
}: {
  totalHunters: number;
  huntersOnline: number;
}) {
  const onlineRef = useRef<HTMLSpanElement>(null);
  const totalRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let lastTicks = totalHunters - VANITY_BASE;
    let lastOnline = huntersOnline;

    // One poll, one Date.now() read, both numbers derived from it together —
    // deliberately NOT two separate intervals each keeping their own copy
    // of "current total," since Online depends on Total and two
    // independently-scheduled timers can fire out of order, leaving Online
    // computed against a stale Total for a moment. Computing both from the
    // same instant every tick makes that whole class of mismatch
    // impossible, not just rare.
    const poll = setInterval(() => {
      const now = Date.now();
      const nowTicks = ticksElapsed(now);
      if (nowTicks > lastTicks) {
        lastTicks = nowTicks;
        const total = VANITY_BASE + nowTicks;
        if (totalRef.current) totalRef.current.textContent = total.toLocaleString("en-IN");
      }
      const total = VANITY_BASE + lastTicks;
      const online = getHuntersOnline(total, now);
      if (online !== lastOnline) {
        lastOnline = online;
        if (onlineRef.current) onlineRef.current.textContent = online.toLocaleString("en-IN");
      }
    }, 500);

    return () => clearInterval(poll);
  }, [totalHunters, huntersOnline]);

  return (
    <div className={styles.networkLine}>
      <span className={styles.networkDot} />
      <span className={`${styles.networkVal} ${styles.online}`} ref={onlineRef}>
        {huntersOnline.toLocaleString("en-IN")}
      </span>
      Online
      <span className={styles.networkSep}>·</span>
      <span className={`${styles.networkVal} ${styles.total}`} ref={totalRef}>
        {totalHunters.toLocaleString("en-IN")}
      </span>
      Total Hunters
    </div>
  );
}
