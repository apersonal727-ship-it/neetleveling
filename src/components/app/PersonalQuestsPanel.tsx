"use client";

import { useTransition } from "react";
import { deletePersonalQuest } from "@/actions/personal-quests";
import { startPersonalQuestSession } from "@/actions/focus";
import { StartSessionButton } from "@/components/app/StartSessionButton";
import styles from "@/app/(app)/quests/quests.module.css";

type PersonalQuest = {
  id: string;
  title: string;
  durationMinutes: number;
  subject: string | null;
  mandatory: boolean;
  frequency: "ONCE" | "DAILY";
  countsToday?: boolean;
  done: boolean;
};

// Dashboard-only: view and launch personal quests. Adding/removing them
// lives exclusively on the Quest Management page now, so this never
// duplicates that form — one place to manage, one place to execute.
export function PersonalQuestsPanel({ quests, streak }: { quests: PersonalQuest[]; streak: number }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Remove this personal quest?")) return;
    startTransition(() => {
      deletePersonalQuest(id);
    });
  }

  return (
    <div className={styles.personalBox}>
      {quests.length === 0 ? (
        <div className={styles.personalEmpty}>
          <div className={styles.ic}>＋</div>
          No personal quests yet.
          <br />
          Add one from Quest Management to get extra reps in.
        </div>
      ) : (
        quests.map((q) => {
          const isMandDaily = q.countsToday ?? (q.mandatory && q.frequency === "DAILY");
          return (
            <div key={q.id} className={styles.pQuestItem}>
              <div>
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
                  {q.durationMinutes} min{q.done ? " · ✓ Done" : ""}
                </div>
                {isMandDaily && <div className={styles.syncedNote}>↳ Counts toward your daily System Quests</div>}
              </div>
              <div className={styles.pActions}>
                {!q.done && (
                  <StartSessionButton
                    action={startPersonalQuestSession.bind(null, q.id)}
                    className={styles.startPill}
                    questName={q.title}
                    durationMinutes={q.durationMinutes}
                    xpReward={0}
                    streak={streak}
                  >
                    ▶ Start
                  </StartSessionButton>
                )}
                <button type="button" className={styles.pRemove} onClick={() => handleDelete(q.id)} disabled={isPending}>
                  ✕
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
