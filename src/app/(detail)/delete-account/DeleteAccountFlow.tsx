"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestAccountDeletion } from "@/actions/settings";
import { signOut } from "@/actions/auth";
import styles from "./delete-account.module.css";

type Step = "warn" | "password" | "done";

const WARN_LINES = [
  "Your level, rank progress, and all XP",
  "Your streak and full quest history",
  "Any wallet credit — forfeited, not paid out",
  "Your active subscription — no refund for the current cycle",
];

export function DeleteAccountFlow({ hunterName }: { hunterName: string }) {
  const [step, setStep] = useState<Step>("warn");
  const [confirmName, setConfirmName] = useState("");
  const [agree, setAgree] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const step1Valid = confirmName === hunterName && agree;

  function handleSubmit() {
    setError(null);
    if (!password) return;
    const fd = new FormData();
    fd.set("confirmName", confirmName);
    fd.set("password", password);
    startTransition(async () => {
      const result = await requestAccountDeletion(fd);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setScheduledFor(result.scheduledFor);
      setStep("done");
    });
  }

  return (
    <>
      {step === "warn" && (
        <div>
          <div className={styles.warnBox}>
            <div className={styles.warnTitle}>This deletes everything.</div>
            <div className={styles.warnList}>
              {WARN_LINES.map((line) => (
                <div key={line} className={styles.warnListItem}>
                  <span>✕</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Type {hunterName} to confirm</span>
            <input
              className={styles.fieldInput}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={hunterName}
            />
            <div className={styles.fieldHint}>This matches your hunter name exactly.</div>
          </div>

          <div className={styles.consentRow}>
            <input
              type="checkbox"
              id="agreeCheck"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className={styles.consentCheckbox}
            />
            <label htmlFor="agreeCheck" className={styles.consentLabel}>
              I understand this forfeits my wallet credit and cannot be undone after the grace period.
            </label>
          </div>

          <button
            type="button"
            disabled={!step1Valid}
            onClick={() => setStep("password")}
            className={`${styles.btn} ${styles.btnDanger}`}
          >
            Continue
          </button>
        </div>
      )}

      {step === "password" && (
        <div>
          {error && <div className={styles.errorText}>{error}</div>}
          <p className={styles.para}>Enter your password to finish.</p>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${styles.fieldInput} ${styles.fieldInputBody}`}
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending || !password}
            className={`${styles.btn} ${styles.btnDanger}`}
            style={{ opacity: pending ? 0.7 : 1 }}
          >
            {pending ? "Deleting…" : "Permanently Delete Account"}
          </button>
          <button type="button" onClick={() => setStep("warn")} className={`${styles.btn} ${styles.btnGhost}`}>
            Go back
          </button>
        </div>
      )}

      {step === "done" && (
        <div className={styles.doneWrap}>
          <div className={styles.doneIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--red-2)" strokeWidth="1.8" width="30" height="30">
              <path d="M12 9v4M12 17h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <h1 className={styles.doneTitle}>Account scheduled for deletion.</h1>
          <p className={styles.para}>
            Your account and all data will be permanently erased on{" "}
            <span className={styles.doneDate}>
              {scheduledFor && new Date(scheduledFor).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </span>{" "}
            — a 14-day grace period.
          </p>
          <p className={styles.para}>Changed your mind? Just log back in before then to cancel.</p>
          <button type="button" onClick={() => signOut()} className={`${styles.btn} ${styles.btnGhost}`}>
            Log out now
          </button>
        </div>
      )}

      {step !== "done" && (
        <div className={styles.backLinkWrap}>
          <Link href="/settings" className={styles.backLink}>
            ← Back to Settings
          </Link>
        </div>
      )}
    </>
  );
}
