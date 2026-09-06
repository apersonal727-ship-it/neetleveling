"use client";

import { useState, useTransition } from "react";
import { submitFeatureRequest } from "@/actions/feedback";
import styles from "@/app/(onboarding)/onboarding.module.css";

export function FeatureRequestForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitFeatureRequest(formData);
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
        <span>Sent. If it improves the System, it&apos;ll be added free for every Hunter.</span>
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
        <span className={styles.fieldLabel}>Your idea</span>
        <input className={styles.fieldInput} name="title" type="text" placeholder="e.g. Dark mode for Focus Lock" />
      </div>

      <div className={styles.field2}>
        <span className={styles.fieldLabel}>Why it&apos;d help</span>
        <textarea
          className={styles.fieldInput}
          name="description"
          rows={5}
          placeholder="What you'd want it to do, and why it'd make the System better."
        />
      </div>

      <button type="submit" className={styles.btnPrimary} disabled={pending}>
        <span>{pending ? "Sending…" : "Send It"}</span>
      </button>
    </form>
  );
}
