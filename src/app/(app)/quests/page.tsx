import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { getPersonalQuests } from "@/lib/personal-quests";
import { tomorrowForecast } from "@/lib/progressive-overload";
import { PersonalQuestListPanel } from "@/components/app/PersonalQuestListPanel";
import { PersonalQuestAddForm } from "@/components/app/PersonalQuestAddForm";
import appStyles from "../app.module.css";
import styles from "./quests.module.css";

export const metadata: Metadata = {
  title: "Quest Management — NEETLeveling",
};

// Subject identity colors — same ones used everywhere else in the app
// (quest badges, Focus Lock, category icons), not the mockup's own
// red/gold/green, so tomorrow's forecast reads as "Physics" rather than
// looking like an unrelated severity indicator.
const FORECAST_COLOR: Record<string, string> = {
  PHYSICS: "#8fe8ff",
  CHEMISTRY: "#ffb84f",
  BIOLOGY: "#3ddc84",
};

export default async function QuestsPage() {
  const profile = await getCurrentProfile();

  const personalQuests = await getPersonalQuests(profile.id);
  const forecast = tomorrowForecast(profile.streak);

  return (
    <>
      <div className={appStyles.pageHead}>
        <h1>Quest Management</h1>
        <p>
          Manage your personal quests here, and preview tomorrow&apos;s MCQ load before it lands.
          Today&apos;s quests are on your Dashboard.
        </p>
      </div>

      <div className={styles.questLayout}>
        <div>
          <div className={styles.incomingBox}>
            <div className={styles.incomingHead}>Incoming — Tomorrow</div>
            <div className={styles.incomingSub}>
              Quest counts increase automatically each day. Here&apos;s what&apos;s upcoming.
            </div>
            <div className={styles.barsRow}>
              {(Object.keys(forecast) as (keyof typeof forecast)[]).map((subject) => {
                const { count, cap } = forecast[subject];
                const pct = Math.round((count / cap) * 100);
                return (
                  <div key={subject} className={styles.barCol} style={{ "--bc": FORECAST_COLOR[subject] } as React.CSSProperties}>
                    <div className={styles.barVal}>{count}</div>
                    <div className={styles.bar} style={{ height: `${pct}%` }} />
                    <div className={styles.barLbl}>{subject.charAt(0) + subject.slice(1).toLowerCase()}</div>
                    <div className={styles.barCap}>{count >= cap ? "capped" : "climbing"}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <span className={`${styles.secTag} ${styles.optional}`}>
            <span className={styles.dot} />
            Personal Quests
          </span>
          <div className={styles.secTitleRow}>
            <h2>Your Personal Quests</h2>
            <span className={styles.prog}>{personalQuests.length} added</span>
          </div>

          <PersonalQuestListPanel quests={personalQuests} />
        </div>

        <div className={styles.questSide}>
          <PersonalQuestAddForm />
        </div>
      </div>
    </>
  );
}
