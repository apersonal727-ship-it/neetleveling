"use client";

import { useEffect, useState } from "react";
import styles from "./LockingInOverlay.module.css";

// A single deliberate sequence — each step waits for the last to settle,
// nothing overlaps abruptly. Mirrors the exact timings of the reference
// design: 4 log lines, then the lock icon, then the LOCKED status, then a
// held beat before the veil fades in and onDone fires — onDone is what
// actually calls the real server action (creating the QuestSession and
// redirecting into /focus-lock), timed to land right as the veil finishes
// covering the screen so the swap into the real timer reads as one
// continuous cross-fade instead of an abrupt cut.
const STEPS = ["line1", "line2", "line3", "line4", "lockIcon", "lockStatus"] as const;
const STEP_DELAYS = [200, 700, 1200, 1700, 2300, 2750];
const VEIL_DELAY = 3600;
const DONE_DELAY = 4300;

export function LockingInOverlay({ questName, onDone }: { questName: string; onDone: () => void }) {
  const [step, setStep] = useState(-1);
  const [veiled, setVeiled] = useState(false);

  useEffect(() => {
    const timers = STEP_DELAYS.map((delay, i) => setTimeout(() => setStep(i), delay));
    const veilTimer = setTimeout(() => setVeiled(true), VEIL_DELAY);
    const doneTimer = setTimeout(onDone, DONE_DELAY);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(veilTimer);
      clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = (i: number) => step >= i;

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.wrap}>
          <div className={styles.panel}>
            <div className={styles.titlebar}>
              <span>System // Locking In</span>
              <span className={styles.live}>
                <span className={styles.dot} />
                Live
              </span>
            </div>
            <div className={styles.body}>
              <div className={`${styles.logLine} ${shown(0) ? styles.show : ""}`}>
                &gt; Verifying Hunter identity<span>...</span> <b>OK</b>
              </div>
              <div className={`${styles.logLine} ${shown(1) ? styles.show : ""}`}>
                &gt; Loading quest: <b>{questName}</b>
              </div>
              <div className={`${styles.logLine} ${styles.danger} ${shown(2) ? styles.show : ""}`}>
                &gt; Sealing exit protocols<span>...</span> <b>OK</b>
              </div>
              <div className={`${styles.logLine} ${styles.danger} ${shown(3) ? styles.show : ""}`}>
                &gt; No pausing. No early exit. <b>Confirmed.</b>
              </div>

              <div className={styles.lockVisual}>
                <div className={`${styles.lockIcon} ${shown(4) ? styles.show : ""}`}>🔒</div>
                <div className={`${styles.lockStatus} ${shown(5) ? styles.show : ""}`}>LOCKED</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`${styles.veil} ${veiled ? styles.show : ""}`} />
    </>
  );
}
