import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress } from "@/lib/rank";
import { getTodaysQuests } from "@/lib/todays-quest";
import { TodaysQuestList } from "@/components/app/TodaysQuestList";
import appStyles from "../app.module.css";
import styles from "./quests.module.css";

export const metadata: Metadata = {
  title: "Quests — NEETLeveling",
};

export default async function QuestsPage() {
  const profile = await getCurrentProfile();
  const progress = getLevelProgress(profile.xp);

  const todaysQuests = await getTodaysQuests(profile.id, progress.level);

  return (
    <>
      <div className={appStyles.pageHead}>
        <h1>Quests</h1>
        <p>Clear today&apos;s set to keep the streak alive.</p>
      </div>

      <section>
        <span className={appStyles.secLabel}>Today&apos;s set</span>
        <TodaysQuestList quests={todaysQuests} streak={profile.streak} />
      </section>

      <section>
        <span className={appStyles.secLabel}>Beyond the set</span>
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

        <div style={{ height: "12px" }} />

        <div className={`${appStyles.card} ${styles.wideCard}`}>
          <div className={`${styles.wideIcon} ${styles.wideIconPq}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 6h16M4 12h10M4 18h16" />
            </svg>
          </div>
          <div className={styles.wideBody}>
            <div className={styles.wideTitle}>Personal Quests</div>
            <div className={styles.wideSub}>Self-tracked goals, no penalty if missed — coming soon.</div>
          </div>
        </div>
      </section>
    </>
  );
}
