"use client";

import { useEffect, useState } from "react";
import styles from "@/app/(app)/quests/quests.module.css";

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function QuestDropCountdown({ deadline }: { deadline: string }) {
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
    <div className={styles.waitingState}>
      <div className={styles.waitingIcon}>🌙</div>
      <div className={styles.waitingTitle}>Quests Haven&apos;t Dropped Yet.</div>
      <div className={styles.waitingSub}>
        The System releases today&apos;s quests at <b>5:00 AM IST</b>, all at once. Nothing to do
        until then — get some rest.
      </div>
      <div className={styles.waitingCountdown}>
        {remainingMs === null ? "--:--:--" : formatRemaining(remainingMs)}
      </div>
      <div className={styles.waitingLbl}>Until Quests Drop</div>
    </div>
  );
}
