import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress, rankForLevel, cumulativeXpForLevel } from "@/lib/rank";
import styles from "./level-up.module.css";

export const metadata: Metadata = {
  title: "Level Up — NEETLeveling",
};

export default async function LevelUpPage({
  searchParams,
}: {
  searchParams: Promise<{ xp?: string }>;
}) {
  const { xp } = await searchParams;
  const profile = await getCurrentProfile();
  const progress = getLevelProgress(profile.xp);
  const rank = rankForLevel(progress.level);

  const xpGained = Number(xp) || 0;
  const nextLevelAt = cumulativeXpForLevel(progress.level + 1);
  const toGo = Math.max(0, progress.xpForLevel - progress.xpInLevel);

  return (
    <div className={styles.app}>
      <div className={styles.termPanel}>
        <div className={styles.termTitlebar}>
          <span>System // Notification</span>
          <span className={styles.live}>
            <span className={styles.dot} /> Live
          </span>
        </div>
        <div className={styles.termBody}>
          <div className={styles.logLine} style={{ animationDelay: "0.15s" }}>
            &gt; Hunter identified: <b>{profile.name}</b>
          </div>
          <div className={styles.logLine} style={{ animationDelay: "0.4s" }}>
            &gt; Verifying account history... <b>OK</b>
          </div>
          <div className={styles.logLine} style={{ animationDelay: "0.65s" }}>
            &gt; Recalculating Hunter parameters... <b>OK</b>
          </div>
          <div className={`${styles.logLine} ${styles.done}`} style={{ animationDelay: "0.9s" }}>
            &gt; Threshold exceeded. <b>LEVEL UP.</b>
          </div>

          <div className={styles.numBlock}>
            <div className={styles.bigNum}>{progress.level}</div>
            <div className={styles.numTag}>Level Reached</div>
          </div>

          <div className={styles.statLines}>
            <div className={styles.statLine}>
              <span className={styles.k}>XP Gained</span>
              <span className={`${styles.v} ${styles.gold}`}>+{xpGained} XP</span>
            </div>
            <div className={styles.statLine}>
              <span className={styles.k}>Current Rank</span>
              <span className={styles.v}>
                {rank.code} · {rank.title}
              </span>
            </div>
            <div className={styles.statLine}>
              <span className={styles.k}>Next Level At</span>
              <span className={styles.v}>
                {nextLevelAt.toLocaleString("en-IN")} XP{" "}
                <span style={{ color: "var(--slate)" }}>({toGo.toLocaleString("en-IN")} to go)</span>
              </span>
            </div>
          </div>

          <a href="/dashboard" className={styles.promptBtn}>
            &gt; continue
          </a>
        </div>
      </div>
    </div>
  );
}
