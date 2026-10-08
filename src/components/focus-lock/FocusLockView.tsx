"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/focus-lock/focus-lock.module.css";
import { CATEGORIES } from "@/lib/quest-categories";
import { QuestCompleteOverlay } from "./QuestCompleteOverlay";
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

  // Ask once, up front, so a completion that lands while the hunter is away
  // from the screen (studying off physical books, phone locked) can still
  // surface a system notification instead of going silently uncredited
  // until they next open the tab.
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") Notification.requestPermission();
  }, []);

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

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(isPunishment ? "Protocol cleared" : "Focus Mode complete", {
          body: isPunishment
            ? `${title} done — check the app.`
            : isPersonal
              ? `${title} done.`
              : `${title} done · +${xpAwarded} XP`,
          icon: "/favicon.ico",
        });
      }
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, completed]);

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
        <main className={styles.main}>
          <span className={styles.lockPill}>
            <span className={styles.dot} /> Focus Mode Active
          </span>

          {subject ? (
            <span
              className={styles.subjBadge}
              style={{ "--sc": SUBJECT_COLOR[subject] ?? "var(--blue-2)" } as React.CSSProperties}
            >
              {CATEGORIES.find((c) => c.subject === subject) && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  {CATEGORIES.find((c) => c.subject === subject)!.icon}
                </svg>
              )}
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
              <div className={styles.ringLabel}>{completing ? "Closing out…" : "Remaining"}</div>
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

          {!completed && (
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
          )}

          <p className={styles.warnCard}>No pausing, no early exit — the timer decides when you&apos;re free.</p>
        </main>
      </div>

      {completed && (
        <QuestCompleteOverlay
          kind={kind}
          xpAwarded={xpAwarded}
          streak={streak}
          questsLeftToday={questsLeftToday}
          punishmentsRemaining={punishmentsRemaining}
          onContinue={() => router.push(returnHref)}
        />
      )}
    </>
  );
}
