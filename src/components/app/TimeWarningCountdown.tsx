"use client";

import { useEffect, useState } from "react";
import styles from "@/app/time-warning/time-warning.module.css";

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function TimeWarningCountdown({ deadline }: { deadline: string }) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      setRemainingMs(Math.max(0, new Date(deadline).getTime() - Date.now()));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return (
    <>
      <div className={styles.countdown}>{remainingMs === null ? "--:--:--" : formatRemaining(remainingMs)}</div>
      <div className={styles.countdownLbl}>Until Reset</div>
    </>
  );
}
