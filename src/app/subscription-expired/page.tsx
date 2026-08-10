import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress } from "@/lib/rank";
import { prisma } from "@/lib/prisma";
import styles from "./subscription-expired.module.css";

export const metadata: Metadata = {
  title: "Subscription Expired — NEETLeveling",
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

  return (
    <>
      <div className={styles.bgGrid} />
      <div className={styles.app}>
        <header className={styles.header}>
          <span className={styles.statusPill}>
            <span className={styles.dot} /> Subscription Expired
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
            <h1 className={styles.badgeTitle}>Your renewal didn&apos;t go through.</h1>
            <p className={styles.badgeReason}>
              {lastFailed
                ? `The ₹${lastFailed.amount} charge was declined on ${fmtDate(lastFailed.createdAt)}. Update your payment method to pick up right where you left off.`
                : "Your subscription has lapsed. Renew to pick up right where you left off."}
            </p>
          </div>

          <div className={styles.safeStrip}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-4Z" />
            </svg>
            Level {getLevelProgress(profile.xp).level}, your {profile.streak}-day streak, and all
            XP are saved — nothing is lost while access is paused.
          </div>

          <section>
            <span className={styles.secLabel}>What&apos;s on hold</span>
            <div className={`${styles.card} ${styles.planCard}`}>
              <div className={styles.planRow}>
                <span>Plan</span>
                <b>Hunter Access — ₹99/mo</b>
              </div>
              {lastFailed && (
                <div className={styles.planRow}>
                  <span>Failed charge</span>
                  <b>{fmtDate(lastFailed.createdAt)}</b>
                </div>
              )}
              <div className={styles.planRow}>
                <span>Status</span>
                <b style={{ color: "var(--amber-2)" }}>Payment required</b>
              </div>
            </div>
          </section>

          <Link href="/checkout" className={`${styles.btn} ${styles.btnRenew}`}>
            Update Payment &amp; Resume
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
              This is a billing pause, not a penalty — no punishment quest, no streak reset.
              Quests simply won&apos;t resume until access does.
            </span>
          </div>
        </main>
      </div>
    </>
  );
}
