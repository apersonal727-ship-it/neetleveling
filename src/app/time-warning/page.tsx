import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress } from "@/lib/rank";
import { prisma } from "@/lib/prisma";
import { getOpenMandatoryQuests } from "@/lib/open-quests";
import { questDayEnd } from "@/lib/quest-day";
import { startQuestSession, startPersonalQuestSession } from "@/actions/focus";
import { StartSessionButton } from "@/components/app/StartSessionButton";
import { TimeWarningCountdown } from "@/components/app/TimeWarningCountdown";
import styles from "./time-warning.module.css";

export const metadata: Metadata = {
  title: "Time Running Out — NEETLeveling",
};

export default async function TimeWarningPage() {
  const profile = await getCurrentProfile();
  const progress = getLevelProgress(profile.xp);
  const openQuests = await getOpenMandatoryQuests(profile.id, progress.level, profile.streak);

  if (openQuests.length === 0) redirect("/dashboard");

  const punishmentPool = await prisma.punishmentQuest.findMany({ select: { title: true } });
  const punishmentNames = punishmentPool.map((p) => p.title).join(", ") || "the configured penalty quests";

  return (
    <>
      <div className={styles.bgGrid} />
      <div className={styles.app}>
        <header className={styles.header}>
          <span className={styles.warnBadge}>
            <span className={styles.dot} /> Time Running Out
          </span>
        </header>

        <main className={styles.main}>
          <h1>1 Hour Left On Today&apos;s Timer.</h1>
          <p className={styles.sub}>
            <b>
              {openQuests.length} quest{openQuests.length === 1 ? "" : "s"}
            </b>{" "}
            {openQuests.length === 1 ? "is" : "are"} still open. Clear{" "}
            {openQuests.length === 1 ? "it" : "them"} before the clock hits zero, or Penalty
            Protocol activates automatically — no warning after this one.
          </p>

          <TimeWarningCountdown deadline={questDayEnd().toISOString()} />

          <div className={styles.openLabel}>
            <span className={styles.dot} /> Still Open
          </div>
          <div className={styles.questBox}>
            {openQuests.map((q) => (
              <div key={q.id} className={styles.questRow}>
                <div>
                  <div className={styles.questName}>{q.title}</div>
                  <div className={styles.questMeta}>{q.durationMinutes} min</div>
                </div>
                <StartSessionButton
                  action={
                    q.kind === "PERSONAL"
                      ? startPersonalQuestSession.bind(null, q.id)
                      : startQuestSession.bind(null, q.id)
                  }
                  className={styles.startBtn}
                >
                  ▶ Start
                </StartSessionButton>
              </div>
            ))}
          </div>

          <div className={styles.consequenceNote}>
            ⚠ If the timer hits zero with these still open,{" "}
            <b>all penalty protocols activate together</b> — {punishmentNames}.
          </div>

          <a href="/quests" className={styles.primaryBtn}>
            Clear Remaining Quests →
          </a>
          <div className={styles.dismissNote}>This warning stays until every quest today is cleared.</div>
        </main>
      </div>
    </>
  );
}
