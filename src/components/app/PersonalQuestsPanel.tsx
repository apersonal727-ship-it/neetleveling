"use client";

import { useState, useTransition } from "react";
import { addPersonalQuest, deletePersonalQuest } from "@/actions/personal-quests";
import { startPersonalQuestSession } from "@/actions/focus";
import { StartSessionButton } from "@/components/app/StartSessionButton";
import appStyles from "@/app/(app)/app.module.css";
import styles from "@/app/(app)/quests/quests.module.css";

type PersonalQuest = {
  id: string;
  title: string;
  durationMinutes: number;
  subject: string | null;
  mandatory: boolean;
  frequency: "ONCE" | "DAILY";
  done: boolean;
};

export function PersonalQuestsPanel({ quests }: { quests: PersonalQuest[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [mandatory, setMandatory] = useState<"mandatory" | "optional">("optional");
  const [frequency, setFrequency] = useState<"once" | "daily">("once");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setMandatory("optional");
    setFrequency("once");
    setError(null);
    setFormOpen(false);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addPersonalQuest(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      resetForm();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this personal quest?")) return;
    startTransition(() => {
      deletePersonalQuest(id);
    });
  }

  return (
    <>
      <div className={`${appStyles.card} ${styles.personalBox}`}>
        {quests.length === 0 ? (
          <div className={styles.personalEmpty}>
            <div className={styles.ic}>＋</div>
            No personal quests yet.
            <br />
            Add one to get extra reps in.
          </div>
        ) : (
          quests.map((q) => {
            const isMandDaily = q.mandatory && q.frequency === "DAILY";
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

      {!formOpen ? (
        <button type="button" className={styles.addQuestBtn} onClick={() => setFormOpen(true)}>
          ＋ Add Personal Quest
        </button>
      ) : (
        <form className={styles.addForm} action={handleSubmit}>
          <div className={styles.addFormTitle}>New Personal Quest</div>

          <div className={styles.formRow}>
            <label htmlFor="pq-title">Quest Name</label>
            <input id="pq-title" name="title" type="text" placeholder="e.g. Revise Organic Chemistry" required />
          </div>
          <div className={styles.formRow}>
            <label htmlFor="pq-duration">Duration (minutes)</label>
            <input id="pq-duration" name="durationMinutes" type="number" min={1} placeholder="30" required />
          </div>
          <div className={styles.formRow}>
            <label htmlFor="pq-subject">Subject (optional)</label>
            <select id="pq-subject" name="subject" defaultValue="">
              <option value="">— None —</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label>Quest Type</label>
            <div className={styles.toggleGroup}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${styles.opt} ${mandatory === "optional" ? styles.active : ""}`}
                onClick={() => setMandatory("optional")}
              >
                Optional
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${styles.mand} ${mandatory === "mandatory" ? styles.active : ""}`}
                onClick={() => setMandatory("mandatory")}
              >
                Mandatory
              </button>
            </div>
            <input type="hidden" name="mandatory" value={mandatory} />
            <div className={`${styles.formHint} ${mandatory === "mandatory" ? styles.warn : ""}`}>
              {mandatory === "mandatory"
                ? "Mandatory — must clear before today's timer hits zero, or the System locks and Penalty Protocol activates."
                : "Optional — resets when today's timer does. No penalty, no lockout."}
            </div>
          </div>
          <div className={styles.formRow}>
            <label>Frequency</label>
            <div className={styles.toggleGroup}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${styles.once} ${frequency === "once" ? styles.active : ""}`}
                onClick={() => setFrequency("once")}
              >
                One-Time
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${styles.daily} ${frequency === "daily" ? styles.active : ""}`}
                onClick={() => setFrequency("daily")}
              >
                Daily
              </button>
            </div>
            <input type="hidden" name="frequency" value={frequency} />
            <div className={styles.formHint}>
              {frequency === "daily" ? "Repeats every day — added permanently to your quest list." : "Runs once, today only."}
            </div>
          </div>

          {error && <div className={styles.formError}>{error}</div>}

          <div className={styles.formBtns}>
            <button type="submit" className={styles.formSubmit} disabled={isPending}>
              {isPending ? "Adding…" : "Add Quest"}
            </button>
            <button type="button" className={styles.formCancel} onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </>
  );
}
