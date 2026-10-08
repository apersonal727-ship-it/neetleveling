"use client";

import { StreakFire } from "@/components/app/StreakFire";
import { useEffect, useRef, useState, useTransition } from "react";
import { LockingInOverlay } from "./LockingInOverlay";
import styles from "./StartSessionButton.module.css";

// How long the modal-close animation runs (see modalOut in the CSS module) —
// the overlay stays mounted for this long after "closing" so the exit
// transition actually gets to play, instead of the old behavior of just
// vanishing the instant Cancel/backdrop was clicked.
const CLOSE_ANIMATION_MS = 180;

export function StartSessionButton({
  action,
  children,
  className,
  style,
  questName,
  durationMinutes,
  xpReward,
  streak,
}: {
  action: () => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** The quest's display name, shown under "Enter Focus Mode?" */
  questName: string;
  durationMinutes: number;
  /** XP this specific session pays out — 0 for punishment/personal quests. */
  xpReward: number;
  /** The hunter's current streak, shown as what's "on the line" today. */
  streak: number;
}) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [locking, setLocking] = useState(false);
  const [isPending, startTransition] = useTransition();
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mount with the overlay's fade-in class absent, then add it on the next
  // frame — a CSS `transition` only animates a change it can see happen; if
  // "open" (opacity: 1) were applied in the very same render as the mount
  // (opacity: 0's default), the browser never gets a chance to paint the
  // "before" frame and the fade just snaps instead of playing.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  function dismiss() {
    setVisible(false);
    setClosing(true);
    closeTimeout.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, CLOSE_ANIMATION_MS);
  }

  function confirm() {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setOpen(false);
    setVisible(false);
    setClosing(false);
    setLocking(true);
  }

  function handleLockedIn() {
    startTransition(() => {
      action();
    });
  }

  return (
    <>
      <button
        type="button"
        className={className}
        style={style}
        onClick={() => setOpen(true)}
        disabled={isPending}
      >
        {children}
      </button>

      {open && (
        <div
          className={`${styles.overlay} ${visible ? styles.open : ""} ${closing ? styles.closing : ""}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) dismiss();
          }}
        >
          <div className={styles.card}>
            <div className={styles.titlebar}>
              <span>System // Confirm Entry</span>
              <span className={styles.live}>
                <span className={styles.dot} />
                Ready
              </span>
            </div>

            <div className={styles.body}>
              <div className={styles.lockIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </div>
              <div className={styles.title}>Enter Focus Mode?</div>
              <div className={styles.questName}>{questName}</div>

              <div className={styles.warning}>
                <div className={styles.warnRow}>
                  <svg className={styles.warnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                  </svg>
                  <span>
                    <b>No pausing.</b> Once the timer starts, it doesn&apos;t stop.
                  </span>
                </div>
                <div className={styles.warnRow}>
                  <svg className={styles.warnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                  </svg>
                  <span>
                    <b>No early exit.</b> You&apos;re locked in until it hits zero.
                  </span>
                </div>
                <div className={styles.warnRow}>
                  <svg className={styles.warnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                  </svg>
                  <span>
                    Make sure you&apos;re <b>actually ready</b> before you confirm.
                  </span>
                </div>
              </div>

              <div className={styles.quote}>&quot;The timer decides when you&apos;re free.&quot;</div>

              <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <div className={styles.metaNum}>{String(durationMinutes).padStart(2, "0")}:00</div>
                  <div className={styles.metaLbl}>Duration</div>
                </div>
                <div className={styles.metaItem}>
                  <div className={styles.metaNum}>+{xpReward}</div>
                  <div className={styles.metaLbl}>XP Reward</div>
                </div>
                <div className={styles.metaItem}>
                  <div className={styles.metaNum}>
                    <StreakFire lit={streak > 0} />
                    {streak}
                  </div>
                  <div className={styles.metaLbl}>Streak On Line</div>
                </div>
              </div>

              <div className={styles.btnRow}>
                <button type="button" className={styles.cancelBtn} onClick={dismiss}>
                  Not Yet
                </button>
                <button type="button" className={styles.enterBtn} onClick={confirm} disabled={isPending}>
                  {isPending ? "Entering…" : "Enter & Lock In →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {locking && <LockingInOverlay questName={questName} onDone={handleLockedIn} />}
    </>
  );
}
