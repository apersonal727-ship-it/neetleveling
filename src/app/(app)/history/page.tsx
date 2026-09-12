import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { getHistorySummary, getSubjectHours, getHeatmap, getRecentActivity } from "@/lib/history";
import { questSubjectLabel } from "@/lib/todays-quest";
import { HeatmapScroller } from "@/components/history/HeatmapScroller";
import appStyles from "../app.module.css";
import styles from "./history.module.css";

export const metadata: Metadata = {
  title: "History — NEETLeveling",
};

function fmtDuration(minutes: number) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}H ${m}M` : `${h}H`;
  }
  return `${minutes}M`;
}

function fmtRelative(date: Date) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((startOfToday.getTime() - date.getTime()) / 86400000);
  if (diffDays <= 0) return "TODAY";
  if (diffDays === 1) return "YESTERDAY";
  return `${diffDays} DAYS AGO`;
}

export default async function HistoryPage() {
  const profile = await getCurrentProfile();
  const summary = await getHistorySummary(profile.id);

  const pageHead = (
    <div className={appStyles.pageHead}>
      <span className={appStyles.pageEyebrow}>
        <span className={appStyles.dot} />
        The Record
      </span>
      <h1>History</h1>
      <p>Every quest, logged. This is the receipt for the arc.</p>
    </div>
  );

  if (summary.questsCompleted === 0) {
    return (
      <>
        {pageHead}
        <div className={styles.histEmpty}>
          <div className={styles.histEmptyIcon}>📜</div>
          <div className={styles.histEmptyTitle}>Nothing Logged Yet.</div>
          <div className={styles.histEmptySub}>
            Your History fills in the moment you clear your first quest. Every cleared day, every
            streak, every lockout — it all starts showing up here.
          </div>
        </div>
      </>
    );
  }

  const [subjectHours, heatmap, activity] = await Promise.all([
    getSubjectHours(profile.id),
    getHeatmap(profile.id),
    getRecentActivity(profile.id),
  ]);

  return (
    <>
      {pageHead}

      <section>
        <div className={styles.chipGrid}>
          <div className={styles.chip}>
            <div className={`${styles.chipVal} ${styles.gold}`}>{summary.currentStreak}</div>
            <div className={styles.chipLbl}>Day Streak</div>
          </div>
          <div className={styles.chip}>
            <div className={styles.chipVal}>{summary.longestStreak}</div>
            <div className={styles.chipLbl}>Best Streak</div>
          </div>
          <div className={styles.chip}>
            <div className={`${styles.chipVal} ${styles.cyan}`}>{summary.questsCompleted}</div>
            <div className={styles.chipLbl}>Quests Cleared</div>
          </div>
          <div className={styles.chip}>
            <div className={`${styles.chipVal} ${styles.danger}`}>{summary.lockoutsTotal}</div>
            <div className={styles.chipLbl}>Lockouts Total</div>
          </div>
        </div>
      </section>

      <section>
        <span className={appStyles.secLabel}>Last 10 weeks</span>
        <div className={`${appStyles.card} ${styles.heatmapCard}`}>
          <HeatmapScroller cells={heatmap} />
          <div className={styles.heatLegend}>
            <span className={styles.lgItem}>
              <span className={`${styles.hcell} ${styles.hcellL3}`} /> Cleared
            </span>
            <span className={styles.lgItem}>
              <span className={`${styles.hcell} ${styles.hcellMiss}`} /> Locked
            </span>
            <span className={styles.lgItem}>
              <span className={styles.hcell} /> No Data
            </span>
          </div>
        </div>
      </section>

      <section>
        <span className={appStyles.secLabel}>Hours by subject</span>
        <div className={`${appStyles.card} ${styles.subjRow}`}>
          {subjectHours.map((s) => (
            <div key={s.label} className={styles.subjLine}>
              <span className={styles.subjKey}>{s.label}</span>
              <div className={styles.subjTrack}>
                <div className={styles.subjFill} style={{ width: `${s.pct}%` }} />
              </div>
              <span className={styles.subjVal}>{s.hours.toFixed(1)}h</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <span className={appStyles.secLabel}>Recent activity</span>
        <div className={`${appStyles.card} ${styles.logList}`}>
          {activity.map((entry, i) => (
            <div key={i} className={styles.logItem}>
              <div className={`${styles.logDot} ${entry.kind === "penalty" ? styles.logDotPenalty : ""}`} />
              <div className={styles.logBody}>
                <div className={styles.logTitle}>
                  {entry.kind === "penalty" ? `Punishment — ${entry.title}` : entry.title}
                </div>
                <div className={styles.logMeta}>
                  {fmtRelative(entry.at)} · {fmtDuration(entry.durationMinutes)}
                  {entry.kind === "quest" && ` · ${questSubjectLabel(entry.subject)}`}
                  {entry.kind === "penalty" && !entry.resolved && " · UNRESOLVED"}
                </div>
              </div>
              <div className={`${styles.logXp} ${entry.kind === "penalty" ? styles.logXpPenalty : ""}`}>
                {entry.kind === "quest" ? `+${entry.xp}` : "—"}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
