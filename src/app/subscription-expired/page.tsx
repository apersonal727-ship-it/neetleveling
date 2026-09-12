import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress, rankForLevel } from "@/lib/rank";
import { lapsedAt, streakGraceDeadline } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";
import { GraceCountdown } from "@/components/subscription/GraceCountdown";
import styles from "./subscription-expired.module.css";

export const metadata: Metadata = {
  title: "Access Paused — NEETLeveling",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function SubscriptionExpiredPage() {
  const profile = await getCurrentProfile();

  const active =
    profile.subscriptionStatus === "ACTIVE" &&
    (!profile.subscriptionRenewsAt || profile.subscriptionRenewsAt.getTime() >= Date.now());
  if (active) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <Link href="/dashboard">Your subscription is active — back to Status</Link>
      </div>
    );
  }

  const lastFailed = await prisma.paymentTransaction.findFirst({
    where: { profileId: profile.id, status: "FAILED" },
    orderBy: { createdAt: "desc" },
  });

  const lapseDate = lapsedAt(profile);
  const graceDeadline = streakGraceDeadline(profile);
  const progress = getLevelProgress(profile.xp);
  const rank = rankForLevel(progress.level);

  return (
    <>
      <div className={styles.bgGrid} />
      <div className={styles.app}>
        <header className={styles.header}>
          <span className={styles.statusPill}>
            <span className={styles.dot} /> Subscription Lapsed
          </span>
        </header>

        <main className={styles.main}>
          <div className={styles.badgeWrap}>
            <div className={styles.badge}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M2 10h20M12 15v.01" />
              </svg>
            </div>
            <h1 className={styles.badgeTitle}>Your Access Is Paused.</h1>
            <p className={styles.badgeReason}>
              {lastFailed
                ? `The ₹${lastFailed.amount} charge was declined on ${fmtDate(lastFailed.createdAt)}. The System is waiting — nothing has been lost.`
                : `Your ₹99/month billing cycle ended${lapseDate ? ` on ${fmtDate(lapseDate)}` : ""} and wasn't renewed. The System is waiting — nothing has been lost.`}
            </p>
          </div>

          <div className={styles.safeStrip}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-4Z" />
            </svg>
            Your rank, XP, streak, and history are saved exactly as they were. Reactivate anytime
            and pick up right where you left off.
          </div>

          {profile.streak > 0 && graceDeadline && (
            <div className={styles.streakWarn}>
              <span className={styles.ic}>🔥</span>
              <span className={styles.txt}>
                Your <b>{profile.streak}-day streak</b> is on hold, not broken — but it resets to
                zero if you don&apos;t reactivate within <b>7 days</b>.
              </span>
            </div>
          )}

          <section>
            <span className={styles.secLabel}>Status</span>
            <div className={styles.statusBox}>
              <div className={styles.statusRow}>
                <div className={styles.statusK}>Last Active</div>
                <div className={styles.statusVDim}>{lapseDate ? fmtDate(lapseDate) : "—"}</div>
              </div>
              <div className={styles.statusRow}>
                <div className={styles.statusK}>Rank On Hold</div>
                <div className={styles.statusV}>
                  {rank.code}-Rank · LVL {progress.level}
                </div>
              </div>
              {profile.streak > 0 && graceDeadline && (
                <div className={styles.statusRow}>
                  <div className={styles.statusK}>Streak Grace Period</div>
                  <GraceCountdown deadline={graceDeadline.toISOString()} />
                </div>
              )}
            </div>
          </section>

          <Link href="/checkout" className={`${styles.btn} ${styles.btnRenew}`}>
            Reactivate — ₹99/month
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>

          <div className={styles.infoLine}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 9v4M12 17h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span>
              This is a billing pause, not a penalty — no punishment quest. Quests simply
              won&apos;t resume until access does.
            </span>
          </div>
        </main>
      </div>
    </>
  );
}
