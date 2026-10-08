"use client";

import { useState, useTransition } from "react";
import { addPersonalQuest } from "@/actions/personal-quests";
import styles from "./PersonalQuestLibraryPanel.module.css";

// Closed-by-default button+form on mobile; forced permanently open in the
// page's sticky side column on desktop (see the 900px block in
// PersonalQuestLibraryPanel.module.css) — same component either way, pure
// CSS handles the responsive difference.
export function PersonalQuestAddForm() {
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

  return (
    <>
      <button type="button" className={styles.addQuestBtn} onClick={() => setFormOpen(true)}>
        ＋ Add A Personal Quest
      </button>

      <form className={`${styles.addForm} ${formOpen ? styles.show : ""}`} action={handleSubmit}>
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
            {frequency === "daily"
              ? "Repeats every day — added permanently to your daily quest set on the Dashboard."
              : "Runs once, today only."}
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
    </>
  );
}
