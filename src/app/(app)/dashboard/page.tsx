import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress, rankForLevel } from "@/lib/rank";
import { getSystemNetworkStats } from "@/lib/stats";
import { getTodaysQuests } from "@/lib/todays-quest";
import { TodaysQuestList } from "@/components/app/TodaysQuestList";
import { SystemNetworkPanel } from "@/components/app/SystemNetworkPanel";
import { SystemToast } from "@/components/app/SystemToast";
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

  const [networkStats, todaysQuests] = await Promise.all([
    getSystemNetworkStats(),
    getTodaysQuests(profile.id, progress.level),
  ]);

  const doneCount = todaysQuests.filter((q) => q.completions.length > 0).length;

  return (
    <>
      {isNew === "true" ? (
        <div className={styles.welcomeBanner}>
          <span className={styles.welcomeDot} /> Hunter registered
        </div>
      ) : (
        <SystemToast message="New quest has arrived." />
      )}

      <div className={styles.dashGrid}>
        <div className={styles.leftCol}>
          <section className={`${appStyles.card} ${styles.statusCard}`}>
            <span className={`${styles.corner} ${styles.tl}`} />
            <span className={`${styles.corner} ${styles.br}`} />
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

          <SystemNetworkPanel
            totalHunters={networkStats.totalHunters}
            clearedToday={networkStats.clearedToday}
          />
        </div>

        <div className={styles.rightCol}>
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
                    Your first quest hasn&apos;t dropped yet. Check back shortly — the System
                    assigns quests on a daily cycle.
                  </p>
                </div>
              </div>
            ) : (
              <TodaysQuestList quests={todaysQuests} streak={profile.streak} />
            )}
          </section>
        </div>
      </div>
    </>
  );
}
