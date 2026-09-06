import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress, rankForLevel } from "@/lib/rank";
import { getStatBars, getHunterProgressStats } from "@/lib/stats";
import { getTodaysQuests } from "@/lib/todays-quest";
import { TodaysQuestList } from "@/components/app/TodaysQuestList";
import appStyles from "../app.module.css";
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

  const [statBars, hunterStats, todaysQuests] = await Promise.all([
    getStatBars(profile.id),
    getHunterProgressStats(profile.id),
    getTodaysQuests(profile.id, progress.level),
  ]);

  const doneCount = todaysQuests.filter((q) => q.completions.length > 0).length;

  return (
    <>
      {isNew === "true" && (
        <div className={styles.welcomeBanner}>
          <span className={styles.welcomeDot} /> Hunter registered
        </div>
      )}

      <section className={`${appStyles.card} ${styles.statusCard}`}>
        <div className={styles.titlebar}>
          <span>[ Hunter Status ]</span>
          <span className={styles.live}>
            <span className={styles.welcomeDot} /> Online
          </span>
        </div>

        <div className={styles.titlebarBody}>
          <div className={styles.statusTop}>
            <div className={styles.rankOrb} style={{ "--rc": rank.color } as React.CSSProperties}>
              {rank.code}
            </div>
            <div>
              <div className={styles.hname}>{profile.name}</div>
              <div className={styles.rtitle}>{rank.title}</div>
              <div className={styles.rsub}>
                Rank {rank.code} · Level {progress.level} of 100
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
        </div>
      </section>

      <section>
        <span className={styles.secEyebrow}>
          <span className={styles.dot} />
          Today&apos;s Briefing
        </span>
        <div className={styles.secTitleRow}>
          <span className={styles.secTitle}>Quest Log</span>
          {todaysQuests.length > 0 && (
            <span className={styles.questDur}>
              {doneCount} / {todaysQuests.length} complete
            </span>
          )}
        </div>
        {todaysQuests.length === 0 ? (
          <div className={`${appStyles.card} ${styles.questCard}`}>
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
          </div>
        ) : (
          <TodaysQuestList quests={todaysQuests} streak={profile.streak} />
        )}
      </section>

      <section>
        <span className={styles.secLabel}>Hunter Stats</span>
        <div className={appStyles.card}>
          <div className={styles.hstatGrid}>
            <div className={styles.hstat}>
              <span className={styles.hstatIcon}>🎥</span>
              <div>
                <div className={styles.hstatVal}>{hunterStats.classHours.toLocaleString("en-IN")}</div>
                <div className={styles.hstatLbl}>Class hours</div>
              </div>
            </div>
            <div className={styles.hstat}>
              <span className={styles.hstatIcon}>🧠</span>
              <div>
                <div className={styles.hstatVal}>{hunterStats.questionHours.toLocaleString("en-IN")}</div>
                <div className={styles.hstatLbl}>Question hours</div>
              </div>
            </div>
            <div className={styles.hstat}>
              <span className={styles.hstatIcon}>🎯</span>
              <div>
                <div className={styles.hstatVal}>{hunterStats.questionsSolved.toLocaleString("en-IN")}</div>
                <div className={styles.hstatLbl}>Questions solved</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <span className={styles.secLabel}>Stats</span>
        <div className={appStyles.card}>
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
