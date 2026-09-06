"use client";

import { useState, useTransition } from "react";
import { submitBugReport } from "@/actions/feedback";
import styles from "@/app/(onboarding)/onboarding.module.css";

export function BugReportForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitBugReport(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setDone(true);
      }
    });
  }

  if (done) {
    return (
      <div className={styles.formError} style={{ background: "rgba(61, 220, 132, 0.08)", borderColor: "rgba(61, 220, 132, 0.35)" }}>
        <span>Reported. We aim to fix it within 48 hours — you&apos;ll get a notification when it&apos;s done.</span>
      </div>
    );
  }

  return (
    <form action={handleSubmit}>
      {error && (
        <div className={styles.formError}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 9v4M12 17h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className={styles.field2}>
        <span className={styles.fieldLabel}>What&apos;s broken</span>
        <input className={styles.fieldInput} name="title" type="text" placeholder="e.g. Streak reset even though I completed everything" />
      </div>

      <div className={styles.field2}>
        <span className={styles.fieldLabel}>What happened</span>
        <textarea
          className={styles.fieldInput}
          name="description"
          rows={5}
          placeholder="What you expected, what actually happened, and when it happened."
        />
      </div>

      <button type="submit" className={styles.btnPrimary} disabled={pending}>
        <span>{pending ? "Submitting…" : "Report It"}</span>
      </button>
    </form>
  );
}
