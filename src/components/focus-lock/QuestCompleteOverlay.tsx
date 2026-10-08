"use client";

import { StreakFire } from "@/components/app/StreakFire";
import { useEffect, useRef, useState } from "react";
import styles from "./QuestCompleteOverlay.module.css";

const STEP_DELAYS = [200, 700, 1200, 1700, 2300, 2750, 3150, 3500];
const CONFETTI_DELAY = 2300;
const CONFETTI_COLORS = ["#f5c542", "#4fd8ff", "#ffe08a"];

type Props = {
  kind: "QUEST" | "PUNISHMENT" | "PERSONAL";
  xpAwarded: number;
  streak: number;
  questsLeftToday: number | null;
  punishmentsRemaining: number | null;
  onContinue: () => void;
};

export function QuestCompleteOverlay({
  kind,
  xpAwarded,
  streak,
  questsLeftToday,
  punishmentsRemaining,
  onContinue,
}: Props) {
  const [step, setStep] = useState(-1);
  const confettiRef = useRef<HTMLDivElement>(null);
  const isPunishment = kind === "PUNISHMENT";
  const isPersonal = kind === "PERSONAL";
  const unlocked = isPunishment && (punishmentsRemaining ?? 0) === 0;

  useEffect(() => {
    const timers = STEP_DELAYS.map((delay, i) => setTimeout(() => setStep(i), delay));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Punishment clears skip the confetti — it's a penalty being lifted, not
  // an achievement, matching the tonal distinction the rest of this page
  // already draws (no XP/streak shown for punishment completions either).
  useEffect(() => {
    if (isPunishment) return;
    const layer = confettiRef.current;
    if (!layer) return;
    const timer = setTimeout(() => {
      const pieces: HTMLDivElement[] = [];
      for (let i = 0; i < 40; i++) {
        const piece = document.createElement("div");
        piece.className = styles.confettiPiece;
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        piece.style.animationDelay = `${Math.random() * 0.4}s`;
        piece.style.animationDuration = `${1.8 + Math.random() * 1.2}s`;
        if (Math.random() > 0.5) piece.style.borderRadius = "50%";
        layer.appendChild(piece);
        pieces.push(piece);
      }
      const clearTimer = setTimeout(() => pieces.forEach((p) => p.remove()), 3200);
      return () => clearTimeout(clearTimer);
    }, CONFETTI_DELAY);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPunishment]);

  const lines = isPunishment
    ? [
        <>
          &gt; Verifying protocol completion<span>...</span> <b>OK</b>
        </>,
        <>
          &gt; Reps logged<span>...</span> <b>OK</b>
        </>,
        <>
          &gt; Releasing seal<span>...</span> <b>OK</b>
        </>,
        unlocked ? (
          <>
            &gt; Lockout <b>resolved.</b>
          </>
        ) : (
          <>
            &gt; {punishmentsRemaining} protocol{punishmentsRemaining === 1 ? "" : "s"} <b>remaining.</b>
          </>
        ),
      ]
    : [
        <>
          &gt; Verifying quest completion<span>...</span> <b>OK</b>
        </>,
        isPersonal ? (
          <>
            &gt; Self-tracked — <b>no XP awarded</b>
          </>
        ) : (
          <>
            &gt; XP calculated<span>...</span> <b>+{xpAwarded} XP</b>
          </>
        ),
        <>
          &gt; Releasing seal<span>...</span> <b>OK</b>
        </>,
        streak > 0 && !isPersonal ? (
          <>
            &gt; Streak <b>protected.</b>
          </>
        ) : (
          <>
            &gt; Quest <b>logged.</b>
          </>
        ),
      ];

  const statusText = isPunishment ? (unlocked ? "ACCOUNT UNLOCKED" : "PROTOCOL CLEARED") : "QUEST CLEARED";
  const continueLabel = isPunishment && !unlocked ? "Continue Protocols →" : "Return To Dashboard →";

  const shown = (i: number) => step >= i;

  return (
    <div className={styles.overlay}>
      <div className={styles.confettiLayer} ref={confettiRef} />
      <div className={styles.wrap}>
        <div className={styles.panel}>
          <div className={styles.titlebar}>
            <span>System // {isPunishment ? "Protocol" : "Quest"} Complete</span>
            <span className={styles.live}>
              <span className={styles.dot} />
              Verified
            </span>
          </div>
          <div className={styles.body}>
            {lines.map((line, i) => (
              <div key={i} className={`${styles.logLine} ${shown(i) ? styles.show : ""}`}>
                {line}
              </div>
            ))}

            <div className={styles.unlockVisual}>
              <div className={`${styles.unlockIcon} ${shown(4) ? styles.show : ""}`}>🔓</div>
              <div className={`${styles.unlockStatus} ${shown(5) ? styles.show : ""}`}>{statusText}</div>
            </div>

            <div className={`${styles.statRow} ${shown(6) ? styles.show : ""}`}>
              {isPunishment ? (
                <div className={styles.statPill}>
                  <div className={styles.num}>{punishmentsRemaining ?? 0}</div>
                  <div className={styles.lbl}>Protocols Left</div>
                </div>
              ) : (
                <>
                  {!isPersonal && (
                    <div className={styles.statPill}>
                      <div className={styles.num}>+{xpAwarded}</div>
                      <div className={styles.lbl}>XP Earned</div>
                    </div>
                  )}
                  {!isPersonal && streak > 0 && (
                    <div className={styles.statPill}>
                      <div className={styles.num}>
                        <StreakFire />
                        {streak}
                      </div>
                      <div className={styles.lbl}>Streak Held</div>
                    </div>
                  )}
                  {questsLeftToday !== null && (
                    <div className={styles.statPill}>
                      <div className={styles.num}>{questsLeftToday}</div>
                      <div className={styles.lbl}>Quests Left</div>
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              type="button"
              className={`${styles.continueBtn} ${shown(7) ? styles.show : ""}`}
              onClick={onContinue}
            >
              {continueLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
