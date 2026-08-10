import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress, rankForLevel } from "@/lib/rank";
import { getStatBars } from "@/lib/stats";
import { getTodaysQuest, questSubjectLabel } from "@/lib/todays-quest";
import { startQuestSession } from "@/actions/focus";
import styles from "./dashboard.module.css";

export const metadata: Metadata = {
  title: "Status — NEETLeveling",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: isNew } = await searchParams;
  const profile = await getCurrentProfile();
  const progress = getLevelProgress(profile.xp);
  const rank = rankForLevel(progress.level);
  const pct = progress.xpForLevel > 0 ? (progress.xpInLevel / progress.xpForLevel) * 100 : 100;

  const [statBars, quest] = await Promise.all([
    getStatBars(profile.id),
    getTodaysQuest(profile.id, progress.level),
  ]);

  return (
    <>
      {isNew === "true" && (
        <div className={styles.welcomeBanner}>
          <span className={styles.welcomeDot} /> Hunter registered
        </div>
      )}

      <section className={`${styles.card} ${styles.statusCard}`}>
        <div className={styles.statusTop}>
          <div className={styles.rankOrb} style={{ "--rc": rank.color } as React.CSSProperties}>
            {rank.code}
          </div>
          <div>
            <div className={styles.hname}>{profile.name}</div>
            <div className={styles.rtitle}>{rank.title}</div>
            <div className={styles.rsub}>
              RANK {rank.code} · LEVEL {progress.level} OF 100
            </div>
          </div>
        </div>

        <div className={styles.xpDetail}>
          <span className={styles.xpDetailLbl}>XP to next level</span>
          <span className={styles.xpDetailVal}>
            {progress.xpInLevel.toLocaleString("en-IN")} /{" "}
            {progress.xpForLevel > 0 ? progress.xpForLevel.toLocaleString("en-IN") : "—"}
          </span>
        </div>
        <div className={styles.bigXpTrack}>
          <div className={styles.bigXpFill} style={{ width: `${pct}%` }} />
        </div>

        <div className={styles.chipRow}>
          <div className={styles.chip}>
            <div className={styles.chipVal}>{profile.streak}</div>
            <div className={styles.chipLbl}>Day streak</div>
          </div>
          <div className={styles.chip}>
            <div className={styles.chipVal}>{profile.bestStreak}</div>
            <div className={styles.chipLbl}>Best streak</div>
          </div>
          <div className={styles.chip}>
            <div className={styles.chipVal}>{profile.xp.toLocaleString("en-IN")}</div>
            <div className={styles.chipLbl}>Total XP</div>
          </div>
        </div>
      </section>

      <section>
        <span className={styles.secLabel}>Today</span>
        <div className={`${styles.card} ${styles.questCard}`}>
          {quest ? (
            <>
              <div className={styles.questTop}>
                <span className={styles.questCat}>{questSubjectLabel(quest.subject)}</span>
              </div>
              <div>
                <div className={styles.questTitle}>{quest.title}</div>
                <div className={styles.questDur}>
                  Duration: {quest.durationMinutes} min · +
                  {quest.xpOverride ?? Math.round(quest.durationMinutes * 0.67)} XP on completion
                </div>
              </div>
              <form action={startQuestSession.bind(null, quest.id)}>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} style={{ width: "100%", border: "none" }}>
                  Start Quest
                </button>
              </form>
            </>
          ) : (
            <div className={styles.emptyQuest}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
              </svg>
              <p>
                Your first quest hasn&apos;t dropped yet. Check back shortly — the System assigns
                quests on a daily cycle.
              </p>
            </div>
          )}
        </div>
      </section>

      <section>
        <span className={styles.secLabel}>Stats</span>
        <div className={styles.card}>
          <div className={styles.statRow}>
            {statBars.map((s) => (
              <div key={s.key} className={styles.statLine}>
                <span className={styles.statKey}>{s.key}</span>
                <div className={styles.statBarWrap}>
                  <div className={styles.statName}>{s.name}</div>
                  <div className={styles.statTrack}>
                    <div className={styles.statFill} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
                <span className={styles.statVal}>{s.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
