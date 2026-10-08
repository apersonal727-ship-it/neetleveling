"use client";

import { useTransition } from "react";
import { deletePersonalQuest } from "@/actions/personal-quests";
import styles from "./PersonalQuestLibraryPanel.module.css";

const RING_R = 18;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

type PersonalQuest = {
  id: string;
  title: string;
  durationMinutes: number;
  subject: string | null;
  mandatory: boolean;
  frequency: "ONCE" | "DAILY";
  countsToday?: boolean;
  completionRate: number | null;
};

// The "Quest Management" view's quest list — pure add/remove/track, no
// Start action. Launching any quest (system or personal) happens
// exclusively from the Dashboard now; this page exists to curate what
// shows up there and to preview tomorrow's practice-question load.
export function PersonalQuestListPanel({ quests }: { quests: PersonalQuest[] }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Remove this personal quest?")) return;
    startTransition(() => {
      deletePersonalQuest(id);
    });
  }

  if (quests.length === 0) {
    return (
      <div className={styles.personalBox}>
        <div className={styles.personalEmpty}>
          <div className={styles.ic}>＋</div>
          No personal quests yet.
          <br />
          Add one to get extra reps in.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.personalBox}>
      {quests.map((q) => {
        const isMandDaily = q.countsToday ?? (q.mandatory && q.frequency === "DAILY");
        const rate = q.completionRate;
        const tier = rate !== null && rate >= 60 ? "high" : "low";
        return (
          <div key={q.id} className={styles.pQuestItem}>
            {rate === null ? (
              <div className={styles.ringWrap}>
                <div className={styles.ringFresh}>+</div>
              </div>
            ) : (
              <div className={styles.ringWrap}>
                <svg className={styles.ringSvg} viewBox="0 0 44 44">
                  <circle className={styles.ringTrack} cx="22" cy="22" r={RING_R} />
                  <circle
                    className={`${styles.ringFill} ${styles[tier]}`}
                    cx="22"
                    cy="22"
                    r={RING_R}
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={RING_CIRCUMFERENCE * (1 - rate / 100)}
                  />
                </svg>
                <div className={`${styles.ringPct} ${styles[tier]}`}>{rate}</div>
              </div>
            )}
            <div className={styles.pInfo}>
              <div className={styles.qname}>
                {q.title}
                {q.subject && <span style={{ color: "var(--slate)", fontWeight: 400, fontSize: 12 }}> · {q.subject}</span>}
                <span className={`${styles.tagBadge} ${q.mandatory ? styles.mand : styles.opt}`}>
                  {q.mandatory ? "Mandatory" : "Optional"}
                </span>
                <span className={`${styles.tagBadge} ${q.frequency === "DAILY" ? styles.daily : styles.once}`}>
                  {q.frequency === "DAILY" ? "Daily" : "One-Time"}
                </span>
              </div>
              <div className={styles.qtime}>
                <span className={styles.d} />
                {q.durationMinutes} min
              </div>
              <div className={`${styles.pCompletion} ${rate === null ? "" : styles[tier]}`}>
                {rate === null ? "No history yet" : rate >= 60 ? "Holding steady" : "Slipping — worth a look"}
              </div>
              {isMandDaily && <div className={styles.syncedNote}>↳ Shows up in your daily Dashboard quest set</div>}
            </div>
            <div className={styles.pActions}>
              <button type="button" className={styles.pRemove} onClick={() => handleDelete(q.id)} disabled={isPending}>
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
