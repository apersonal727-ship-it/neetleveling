import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { startPunishmentSession } from "@/actions/focus";
import { penaltyReps, penaltyDurationMinutes } from "@/lib/penalty";
import { StartSessionButton } from "@/components/app/StartSessionButton";
import styles from "./locked.module.css";

export const metadata: Metadata = {
  title: "Account Locked — NEETLeveling",
};

export default async function LockedPage() {
  const profile = await getCurrentProfile();
  if (!profile.locked) redirect("/dashboard");

  const lockoutEvent = await prisma.lockoutEvent.findFirst({
    where: { profileId: profile.id, resolved: false },
    orderBy: { lockedAt: "desc" },
    include: { punishments: { include: { punishmentQuest: true }, orderBy: { id: "asc" } } },
  });

  const punishments = lockoutEvent?.punishments ?? [];
  const remaining = punishments.filter((p) => !p.completed).length;

  const previousStreak = profile.bestStreak > 0 && profile.streak === 0 ? profile.bestStreak : null;
  const tier = lockoutEvent?.penaltyStreakAtLock ?? profile.penaltyStreak;
  const reps = penaltyReps(tier);
  const durationMinutes = penaltyDurationMinutes(tier);

  return (
    <>
      <div className={styles.bgGrid} />
      <div className={styles.app}>
        <header className={styles.header}>
          <span className={styles.lockPill}>
            <span className={styles.dot} /> Account Locked
          </span>
        </header>

        <main className={styles.main}>
          <div className={styles.lockBadgeWrap}>
            <div className={styles.lockRings}>
              <div className={styles.lockRing} />
              <div className={styles.lockRing} />
              <div className={styles.lockRing} />
              <div className={styles.lockBadge}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </div>
            </div>
            <h1 className={styles.lockTitle}>Penalty Protocol Activated.</h1>
            <p className={styles.lockReason}>
              Yesterday&apos;s quests weren&apos;t completed in time. The System has locked this
              account.
            </p>
          </div>

          {previousStreak && (
            <div className={styles.streakLost}>
              <span className={styles.streakLostFrom}>{previousStreak}-day streak</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
              <span className={styles.streakLostTo}>Reset to 0</span>
            </div>
          )}

          {punishments.length > 0 ? (
            <section>
              <span className={styles.secLabel}>
                Only way back in{remaining > 0 ? ` — ${remaining} left` : ""}
              </span>
              {punishments.map((lp) => (
                <div
                  key={lp.id}
                  className={`${styles.card} ${styles.pqCard}`}
                  style={{ marginBottom: "12px", opacity: lp.completed ? 0.55 : 1 }}
                >
                  <div className={styles.pqTop}>
                    <span className={styles.pqTag}>{lp.completed ? "CLEARED" : "PUNISHMENT QUEST"}</span>
                    <span className={`${styles.pqDur} mono`}>{durationMinutes} min</span>
                  </div>
                  <div className={styles.pqTitle}>
                    {reps} {lp.punishmentQuest.title}
                  </div>
                  {lp.completed ? (
                    <p className={styles.pqNote}>Cleared.</p>
                  ) : (
                    <>
                      <p className={styles.pqNote}>
                        Complete {remaining > 1 ? "all of these" : "it"} and you&apos;re back in.
                      </p>
                      <StartSessionButton
                        action={startPunishmentSession.bind(null, lp.punishmentQuestId)}
                        className={`${styles.btn} ${styles.btnUnlock}`}
                        style={{ width: "100%" }}
                        message="Once you begin, the timer can't be paused, abandoned, or backed out of until it ends."
                      >
                        Start
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </StartSessionButton>
                    </>
                  )}
                </div>
              ))}
            </section>
          ) : (
            <div className={styles.infoLine}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 9v4M12 17h.01" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              <span>
                No punishment quest is configured yet — contact an admin to set one up so accounts
                can unlock.
              </span>
            </div>
          )}

          <div className={styles.infoLine}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 9v4M12 17h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span>
              Everything else stays locked until this is done — Quests, History, and Wallet are
              unreachable until the punishment quest closes out.
            </span>
          </div>
        </main>

        <footer className={styles.footer}>
          <div className={styles.lockedTab}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M8 13l2.5 2.5L16 9" />
            </svg>
            <span>STATUS</span>
            <svg className={styles.miniLock} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3Z" />
            </svg>
          </div>
          <div className={styles.lockedTab}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
            <span>QUESTS</span>
            <svg className={styles.miniLock} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3Z" />
            </svg>
          </div>
          <div className={styles.lockedTab}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 8v5l3 2" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span>HISTORY</span>
            <svg className={styles.miniLock} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3Z" />
            </svg>
          </div>
          <div className={styles.lockedTab}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path d="M3 10h18M16 14h2" />
            </svg>
            <span>WALLET</span>
            <svg className={styles.miniLock} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3Z" />
            </svg>
          </div>
        </footer>
      </div>
    </>
  );
}
