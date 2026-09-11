import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress } from "@/lib/rank";
import { getTodaysQuests } from "@/lib/todays-quest";
import { questDayEnd } from "@/lib/quest-day";
import { TodaysQuestList } from "@/components/app/TodaysQuestList";
import { QuestDropCountdown } from "@/components/app/QuestDropCountdown";
import appStyles from "../app.module.css";
import styles from "./quests.module.css";

export const metadata: Metadata = {
  title: "Quests — NEETLeveling",
};

export default async function QuestsPage() {
  const profile = await getCurrentProfile();
  const progress = getLevelProgress(profile.xp);

  const todaysQuests = await getTodaysQuests(profile.id, progress.level);
  const doneCount = todaysQuests.filter((q) => q.completions.length > 0).length;

  return (
    <div className={styles.questsGrid}>
      <div className={styles.col}>
        <span className={`${styles.secTag} ${styles.mandatory}`}>
          <span className={styles.dot} />
          System Quests · Mandatory
        </span>
        <div className={styles.secTitleRow}>
          <h2>Today&apos;s Quests</h2>
          {todaysQuests.length > 0 && (
            <span className={styles.prog}>
              <b>{doneCount}</b> / {todaysQuests.length} complete
            </span>
          )}
        </div>

        {todaysQuests.length === 0 ? (
          <QuestDropCountdown deadline={questDayEnd().toISOString()} />
        ) : (
          <TodaysQuestList quests={todaysQuests} streak={profile.streak} />
        )}

        <div style={{ height: "12px" }} />
        <div className={`${appStyles.card} ${styles.wideCard}`}>
          <div className={styles.wideIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M12 17h.01M12 3a5 5 0 0 0-5 5c0 2 1.5 2.7 2.5 3.6.7.6 1 1.2 1 1.9" />
            </svg>
          </div>
          <div className={styles.wideBody}>
            <div className={styles.wideTitle}>Secret Quest</div>
            <div className={styles.wideSub}>Appears without warning. Higher reward, no set schedule.</div>
          </div>
        </div>
      </div>

      <div className={styles.col}>
        <span className={`${styles.secTag} ${styles.optional}`}>
          <span className={styles.dot} />
          Personal Quests · Self-Added
        </span>
        <div className={styles.secTitleRow}>
          <h2>Your Own Grind</h2>
        </div>

        <div className={`${appStyles.card} ${styles.personalBox}`}>
          <div className={styles.personalEmpty}>
            <div className={styles.ic}>＋</div>
            Self-tracked goals, no penalty if missed.
            <br />
            <span className={styles.comingSoonTag}>Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
