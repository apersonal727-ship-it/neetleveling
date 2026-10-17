import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress, rankForLevel, cumulativeXpForLevel } from "@/lib/rank";
import { parseData, verifyPass } from "@/lib/rank-up-pass";
import { StripPassToken } from "@/components/rank-up/StripPassToken";
import { ContinueButton } from "@/components/celebration/ContinueButton";
import styles from "./level-up.module.css";

export const metadata: Metadata = {
  title: "Level Up — NEETLeveling",
};

export default async function LevelUpPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const profile = await getCurrentProfile();
  // Only reachable with a pass issued right after a real level-up (see openLevelUp).
  const data = parseData(verifyPass(t, profile.id, "level"));
  if (!data) notFound();
  const progress = getLevelProgress(profile.xp);
  const rank = rankForLevel(progress.level);

  const xpGained = data.x ?? 0;
  const nextLevelAt = cumulativeXpForLevel(progress.level + 1);
  const toGo = Math.max(0, progress.xpForLevel - progress.xpInLevel);

  return (
    <>
      <StripPassToken />
      <div className="systemBackdrop" />
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

          <ContinueButton rest={data.r} dest={data.d} className={styles.promptBtn}>
            &gt; continue
          </ContinueButton>
        </div>
      </div>
    </div>
    </>
  );
}
