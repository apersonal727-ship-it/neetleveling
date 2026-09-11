"use client";

import { useEffect, useRef } from "react";
import styles from "@/app/(app)/dashboard/dashboard.module.css";

// "Hunters Online" and "In Focus Mode" have no real presence tracking behind
// them — they're the same kind of animated flavor tick as the homepage's
// live counters, seeded from the real total so they stay plausible. "Total
// Hunters" and "Cleared Today" are the real numbers, passed in as props.
export function SystemNetworkPanel({
  totalHunters,
  clearedToday,
}: {
  totalHunters: number;
  clearedToday: number;
}) {
  const onlineRef = useRef<HTMLSpanElement>(null);
  const focusRef = useRef<HTMLSpanElement>(null);
  const clearedRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let online = Math.max(12, Math.round(totalHunters * 0.18));
    let focus = Math.max(4, Math.round(totalHunters * 0.06));
    let cleared = clearedToday;

    function flash(el: HTMLSpanElement | null) {
      if (!el) return;
      el.style.transition = "opacity 0.2s ease";
      el.style.opacity = "0.4";
      setTimeout(() => {
        el.style.opacity = "1";
      }, 220);
    }

    const onlineInterval = setInterval(() => {
      online = Math.max(8, online + Math.floor(Math.random() * 11) - 5);
      if (onlineRef.current) onlineRef.current.textContent = online.toLocaleString("en-IN");
      flash(onlineRef.current);
    }, 4000);

    const focusInterval = setInterval(() => {
      focus = Math.max(2, focus + Math.floor(Math.random() * 7) - 3);
      if (focusRef.current) focusRef.current.textContent = focus.toLocaleString("en-IN");
      flash(focusRef.current);
    }, 5000);

    const clearedInterval = setInterval(() => {
      cleared += Math.floor(Math.random() * 3);
      if (clearedRef.current) clearedRef.current.textContent = cleared.toLocaleString("en-IN");
      flash(clearedRef.current);
    }, 9000);

    return () => {
      clearInterval(onlineInterval);
      clearInterval(focusInterval);
      clearInterval(clearedInterval);
    };
  }, [totalHunters, clearedToday]);

  return (
    <div className={styles.pulsePanel}>
      <div className={styles.pulseHead}>
        <span>System Network</span>
        <span className={styles.pulseLive}>
          <span className={styles.pulseDot} />
          Live
        </span>
      </div>
      <div className={styles.pulseGrid}>
        <div className={`${styles.pulseTile} ${styles.pulseOnline}`}>
          <div className={styles.pulseNum}>
            <span className={styles.pdot} />
            <span ref={onlineRef}>{Math.max(12, Math.round(totalHunters * 0.18)).toLocaleString("en-IN")}</span>
          </div>
          <div className={styles.pulseLbl}>Hunters Online</div>
        </div>
        <div className={`${styles.pulseTile} ${styles.pulseTotal}`}>
          <div className={styles.pulseNum}>{totalHunters.toLocaleString("en-IN")}</div>
          <div className={styles.pulseLbl}>Total Hunters</div>
        </div>
        <div className={`${styles.pulseTile} ${styles.pulseDone}`}>
          <div className={styles.pulseNum}>
            <span ref={clearedRef}>{clearedToday.toLocaleString("en-IN")}</span>
          </div>
          <div className={styles.pulseLbl}>Cleared Today</div>
        </div>
        <div className={`${styles.pulseTile} ${styles.pulseFocus}`}>
          <div className={styles.pulseNum}>
            <span className={styles.pdot} />
            <span ref={focusRef}>{Math.max(4, Math.round(totalHunters * 0.06)).toLocaleString("en-IN")}</span>
          </div>
          <div className={styles.pulseLbl}>In Focus Mode</div>
        </div>
      </div>
    </div>
  );
}
