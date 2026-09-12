"use client";

import { useEffect, useState } from "react";
import styles from "@/app/subscription-expired/subscription-expired.module.css";

function format(ms: number) {
  const totalHours = Math.floor(ms / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days}d ${hours}h left`;
}

export function GraceCountdown({ deadline }: { deadline: string }) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      setRemainingMs(Math.max(0, new Date(deadline).getTime() - Date.now()));
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [deadline]);

  if (remainingMs === null) {
    return <span className={styles.statusVDim}>—</span>;
  }
  if (remainingMs <= 0) {
    return <span className={styles.statusVDanger}>Reset</span>;
  }
  return <span className={styles.statusVDim}>{format(remainingMs)}</span>;
}
