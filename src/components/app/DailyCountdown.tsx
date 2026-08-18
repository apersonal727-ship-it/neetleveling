"use client";

import { useEffect, useState } from "react";
import styles from "@/app/(app)/app.module.css";

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// Ticks down to the 5 AM IST quest-day boundary (see src/lib/quest-day.ts) —
// the same instant checkAndApplyLockout uses to decide a quest's window has
// closed. Renders a placeholder until mount to avoid a hydration mismatch
// between server-render time and client hydration time.
export function DailyCountdown({ deadline }: { deadline: string }) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      setRemainingMs(Math.max(0, new Date(deadline).getTime() - Date.now()));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (remainingMs === null) {
    return (
      <div className={styles.countdown}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </svg>
        <span>Quests reset in --:--:--</span>
      </div>
    );
  }

  const urgency = remainingMs < 60 * 60 * 1000 ? "critical" : remainingMs < 3 * 60 * 60 * 1000 ? "warning" : "normal";

  return (
    <div className={styles.countdown} data-urgency={urgency}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
      <span>
        {remainingMs <= 0 ? (
          "Resetting…"
        ) : (
          <>
            Quests reset in <b>{formatRemaining(remainingMs)}</b>
          </>
        )}
        <span className={styles.countdownNote}> · daily reset at 5:00 AM IST</span>
      </span>
    </div>
  );
}
