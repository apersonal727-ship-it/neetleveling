"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/focus-lock/focus-lock.module.css";
import { completeQuestSession, completePunishmentSession } from "@/actions/focus";

const R = 112;
const CIRCUMFERENCE = 2 * Math.PI * R;

function fmt(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

export function FocusLockView({
  sessionId,
  isPunishment,
  title,
  category,
  durationSeconds,
  startedAt,
  xpAwarded,
  streak,
}: {
  sessionId: string;
  isPunishment: boolean;
  title: string;
  category: string;
  durationSeconds: number;
  startedAt: string;
  xpAwarded: number;
  streak: number;
}) {
  const router = useRouter();
  const startedAtMs = useRef(new Date(startedAt).getTime()).current;
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, durationSeconds - (Date.now() - startedAtMs) / 1000),
  );
  const [showAlert, setShowAlert] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [xpCounter, setXpCounter] = useState(0);
  const completingRef = useRef(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setRemaining(Math.max(0, durationSeconds - (Date.now() - startedAtMs) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [durationSeconds, startedAtMs]);

  useEffect(() => {
    if (remaining > 0 || completingRef.current || completed) return;
    completingRef.current = true;
    setCompleting(true);
    (async () => {
      const result = isPunishment
        ? await completePunishmentSession(sessionId)
        : await completeQuestSession(sessionId);
      if ("error" in result) {
        setCompleteError(result.error);
        completingRef.current = false;
        setCompleting(false);
        return;
      }
      setCompleted(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, completed]);

  useEffect(() => {
    if (!completed || isPunishment) return;
    const dur = 900;
    const start = performance.now();
    let raf = 0;
    function step(now: number) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setXpCounter(Math.floor(eased * xpAwarded));
      if (p < 1) raf = requestAnimationFrame(step);
    }
    const t = setTimeout(() => {
      raf = requestAnimationFrame(step);
    }, 550);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [completed, isPunishment, xpAwarded]);

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (remaining > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [remaining]);

  // Trap the browser/OS back gesture while the lock is active: push a dummy
  // history entry, then immediately re-push on every popstate so leaving via
  // back never actually navigates away. Released once the session completes.
  useEffect(() => {
    if (completed) return;
    window.history.pushState(null, "", window.location.href);
    function handlePopState() {
      window.history.pushState(null, "", window.location.href);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [completed]);

  const pct = durationSeconds > 0 ? remaining / durationSeconds : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - (1 - pct));

  if (completeError) {
    return (
      <div className={styles.app}>
        <div className={styles.main}>
          <p style={{ color: "var(--red-2)" }}>{completeError}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.bgGrid} />
      <div className={styles.app}>
        <header className={styles.header}>
          <span className={styles.lockPill}>
            <span className={styles.dot} /> Focus Lock Active
          </span>
        </header>

        <main className={styles.main}>
          <span className={styles.questCat}>{category}</span>

          <div className={styles.ringWrap}>
            <svg viewBox="0 0 250 250">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f9dff" />
                  <stop offset="100%" stopColor="#8fd6ff" />
                </linearGradient>
              </defs>
              <circle className={styles.ringTrack} cx="125" cy="125" r={R} />
              <circle
                className={styles.ringFill}
                cx="125"
                cy="125"
                r={R}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className={styles.ringCenter}>
              <div className={styles.ringTime}>{fmt(remaining)}</div>
              <div className={styles.ringLabel}>
                {completing ? "Closing out…" : "Time remaining"}
              </div>
            </div>
          </div>

          <div className={styles.questInfo}>
            <h1>{title}</h1>
            <p>{isPunishment ? "UNLOCKS YOUR ACCOUNT" : `+${xpAwarded} XP ON COMPLETION`}</p>
          </div>

          <div className={styles.warnCard}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--red)" }}>
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
            <p>
              The System does not allow you to abandon a quest mid-way. Leaving this screen or
              closing the tab will not stop the timer.
            </p>
          </div>
        </main>

        <footer style={{ padding: "20px", display: "flex", justifyContent: "center", gap: "24px" }}>
          <button
            type="button"
            onClick={() => setShowAlert(true)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "5px",
              color: "#4a5476",
              opacity: 0.55,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M8 13l2.5 2.5L16 9" />
            </svg>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px" }}>
              STATUS
            </span>
          </button>
        </footer>
      </div>

      <div className={`${styles.modalOverlay} ${showAlert ? styles.modalOverlayShow : ""}`}>
        <div className={styles.modalCard}>
          <svg className={styles.modalIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
          <h2>System Alert</h2>
          <p>
            The System does not allow you to abandon a quest mid-way. Your Focus Lock stays
            active until the timer ends.
          </p>
          <button type="button" className={styles.modalBtn} onClick={() => setShowAlert(false)}>
            Understood
          </button>
        </div>
      </div>

      <div className={styles.completeOverlay} style={{ display: completed ? "flex" : "none" }}>
        <div className={styles.cmpRings}>
          <div className={styles.cmpRing} />
          <div className={styles.cmpRing} />
          <div className={styles.cmpRing} />
          <div className={styles.cmpBadge}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-4Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
        </div>
        <span className={styles.cmpEyebrow}>
          {isPunishment ? "Punishment cleared" : "Quest closed out"}
        </span>
        <h1>{isPunishment ? "Account Unlocked" : `${category} Complete`}</h1>
        <div className={styles.cmpMeta}>
          {title.toUpperCase()} · {fmt(durationSeconds).replace(/^00:/, "")}
        </div>
        {!isPunishment && (
          <div className={styles.xpCounterWrap}>
            <div className={styles.xpCounter}>+{xpCounter}</div>
            <div className={styles.xpCounterLbl}>XP credited</div>
          </div>
        )}
        {!isPunishment && streak > 0 && (
          <div className={styles.streakLine}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2c0 0-5 4.5-5 10a5 5 0 0 0 10 0c0-1.2-.4-2-1-2.8.1 1-.3 1.8-1 2.3.3-2.5-1-4-1.6-5.2C13.5 4.5 13.4 3 12 2Z" />
            </svg>
            Streak day {streak}
          </div>
        )}
        <button
          type="button"
          className={styles.btnReturn}
          onClick={() => router.push("/dashboard")}
        >
          Return to Status
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </>
  );
}
