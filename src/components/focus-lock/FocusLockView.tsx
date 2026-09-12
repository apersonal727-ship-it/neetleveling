"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/focus-lock/focus-lock.module.css";
import {
  completeQuestSession,
  completePunishmentSession,
  completePersonalQuestSession,
} from "@/actions/focus";

type SessionKind = "QUEST" | "PUNISHMENT" | "PERSONAL";

const R = 112;
const CIRCUMFERENCE = 2 * Math.PI * R;

const SUBJECT_COLOR: Record<string, string> = {
  PHYSICS: "#8fe8ff",
  CHEMISTRY: "#ffb84f",
  BIOLOGY: "#3ddc84",
  DISCIPLINE: "#8fe8ff",
  SECRET: "#8b5cf6",
};

function fmt(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

export function FocusLockView({
  sessionId,
  kind,
  title,
  category,
  subject,
  durationSeconds,
  startedAt,
  xpAwarded,
  streak,
}: {
  sessionId: string;
  kind: SessionKind;
  title: string;
  category: string;
  subject: string | null;
  durationSeconds: number;
  startedAt: string;
  xpAwarded: number;
  streak: number;
}) {
  const isPunishment = kind === "PUNISHMENT";
  const isPersonal = kind === "PERSONAL";
  const router = useRouter();
  const startedAtMs = useRef(new Date(startedAt).getTime()).current;
  // Seeded with the full duration (a value the server can compute too) so
  // the first client render matches SSR exactly — Date.now() would differ
  // between server-render time and hydration time and produce a hydration
  // mismatch on this timer (and on the ring's strokeDashoffset) every
  // single time this page loads. The real elapsed-adjusted value is set
  // right after mount instead, same pattern as DailyCountdown.
  const [remaining, setRemaining] = useState(durationSeconds);
  const [shaking, setShaking] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [xpCounter, setXpCounter] = useState(0);
  const [returnHref, setReturnHref] = useState("/dashboard");
  const [questsLeftToday, setQuestsLeftToday] = useState<number | null>(null);
  const [punishmentsRemaining, setPunishmentsRemaining] = useState<number | null>(null);
  const completingRef = useRef(false);

  useEffect(() => {
    function tick() {
      setRemaining(Math.max(0, durationSeconds - (Date.now() - startedAtMs) / 1000));
    }
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [durationSeconds, startedAtMs]);

  useEffect(() => {
    if (remaining > 0 || completingRef.current || completed) return;
    completingRef.current = true;
    setCompleting(true);
    (async () => {
      const result = isPunishment
        ? await completePunishmentSession(sessionId)
        : isPersonal
          ? await completePersonalQuestSession(sessionId)
          : await completeQuestSession(sessionId);
      if ("error" in result) {
        setCompleteError(result.error);
        completingRef.current = false;
        setCompleting(false);
        return;
      }
      if (isPunishment && (result.punishmentsRemaining ?? 0) > 0) {
        // More punishment quests still open — this lockout isn't actually
        // resolved yet, so don't show "Account Unlocked" or route to the
        // dashboard (the account is still locked; that would just bounce
        // straight back to /locked).
        setReturnHref("/locked");
      } else if (result.rankedUp) {
        setReturnHref(`/rank-up?from=${result.fromRank}`);
      } else if (result.leveledUp) {
        setReturnHref(`/level-up?xp=${xpAwarded}`);
      } else if (result.dayCleared) {
        setReturnHref("/day-clear");
      }
      setPunishmentsRemaining(result.punishmentsRemaining);
      setQuestsLeftToday(result.questsLeftToday);
      setCompleted(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, completed]);

  useEffect(() => {
    if (!completed || isPunishment || isPersonal) return;
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
      <div className="systemBackdrop" />
      <div className={styles.app}>
        <header className={styles.header}>
          <span className={styles.lockPill}>
            <span className={styles.dot} /> Focus Lock Active
          </span>
        </header>

        <main className={styles.main}>
          {subject ? (
            <span
              className={styles.subjBadge}
              style={{ "--sc": SUBJECT_COLOR[subject] ?? "var(--blue-2)" } as React.CSSProperties}
            >
              {category}
            </span>
          ) : (
            <span className={styles.questCat}>{category}</span>
          )}

          <div className={styles.ringWrap}>
            <svg viewBox="0 0 250 250">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4fd8ff" />
                  <stop offset="100%" stopColor="#8fe8ff" />
                </linearGradient>
              </defs>
              <circle className={styles.ringTrack} cx="125" cy="125" r={R} />
              <circle
                className={`${styles.ringFill} ${completing || completed ? styles.ringFillComplete : ""}`}
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
            <p>
            {isPunishment
              ? "UNLOCKS YOUR ACCOUNT"
              : isPersonal
                ? "SELF-TRACKED · NO XP"
                : `+${xpAwarded} XP ON COMPLETION`}
          </p>
          </div>

          <div className={styles.warnCard}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--red)" }}>
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
            <p>&quot;No pausing, no early exit — the timer decides when you&apos;re free.&quot;</p>
          </div>

          {!completed && (
            <div>
              <button
                type="button"
                className={`${styles.exitLockedBtn} ${shaking ? styles.shake : ""}`}
                onClick={() => {
                  setShaking(false);
                  requestAnimationFrame(() => setShaking(true));
                }}
              >
                🔒 Exit Locked
              </button>
              <div className={styles.exitNote}>Unlocks automatically when the timer hits zero.</div>
            </div>
          )}
        </main>
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
          {isPunishment ? "Protocol cleared" : isPersonal ? "Personal quest closed out" : "Quest closed out"}
        </span>
        <h1>
          {isPunishment
            ? punishmentsRemaining === 0
              ? "Access Regained."
              : `${title} Cleared.`
            : `${category} Complete`}
        </h1>
        <div className={styles.cmpMeta}>
          {title.toUpperCase()} · {fmt(durationSeconds).replace(/^00:/, "")}
        </div>
        {isPunishment && punishmentsRemaining !== null && punishmentsRemaining > 0 && (
          <div className={styles.cmpRemaining}>
            {punishmentsRemaining} more protocol{punishmentsRemaining === 1 ? "" : "s"} to go
          </div>
        )}
        {!isPunishment && !isPersonal && (
          <div className={styles.xpCounterWrap}>
            <div className={styles.xpCounter}>+{xpCounter}</div>
            <div className={styles.xpCounterLbl}>XP credited</div>
          </div>
        )}
        {!isPunishment && !isPersonal && streak > 0 && (
          <div className={styles.streakLine}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2c0 0-5 4.5-5 10a5 5 0 0 0 10 0c0-1.2-.4-2-1-2.8.1 1-.3 1.8-1 2.3.3-2.5-1-4-1.6-5.2C13.5 4.5 13.4 3 12 2Z" />
            </svg>
            Streak day {streak}
          </div>
        )}
        {!isPunishment && questsLeftToday !== null && (
          <div className={styles.cmpRemaining}>
            {questsLeftToday === 0
              ? "All quests cleared today"
              : `${questsLeftToday} quest${questsLeftToday === 1 ? "" : "s"} left today`}
          </div>
        )}
        <button
          type="button"
          className={styles.btnReturn}
          onClick={() => router.push(returnHref)}
        >
          {isPunishment && (punishmentsRemaining ?? 0) > 0 ? "Continue Protocols" : "Return To Dashboard"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </>
  );
}
