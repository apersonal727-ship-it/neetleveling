"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updatePassword } from "@/actions/auth";
import styles from "../auth.module.css";

export default function ChangePasswordPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pending, startTransition] = useTransition();

  const lenOk = newPw.length >= 8;
  const numOk = /\d/.test(newPw);
  const matchOk = confirmPw.length > 0 && newPw === confirmPw;

  function handleSubmit(formData: FormData) {
    setError(null);
    if (!lenOk || !numOk || !matchOk) return;
    startTransition(async () => {
      const result = await updatePassword(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setDone(true);
      }
    });
  }

  return (
    <div className={styles.app}>
      <div className={styles.backHeader}>
        <Link href="/settings" className={styles.backBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1>Change Password</h1>
      </div>

      <main className={styles.main} style={{ justifyContent: "flex-start" }}>
        {!done ? (
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
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Current Password</span>
              <input
                className={styles.fieldInput}
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>New Password</span>
              <input
                className={styles.fieldInput}
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Confirm New Password</span>
              <input
                className={`${styles.fieldInput} ${
                  confirmPw.length > 0 && !matchOk ? styles.fieldInputError : ""
                }`}
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
              />
              {confirmPw.length > 0 && !matchOk && (
                <div className={styles.fieldHintError}>Passwords don&apos;t match.</div>
              )}
            </div>

            <div className={styles.reqList}>
              <div className={`${styles.reqItem} ${lenOk ? styles.reqItemMet : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                At least 8 characters
              </div>
              <div className={`${styles.reqItem} ${numOk ? styles.reqItemMet : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Contains a number
              </div>
              <div className={`${styles.reqItem} ${matchOk ? styles.reqItemMet : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Passwords match
              </div>
            </div>

            <button
              type="submit"
              className={`${styles.btnPrimary} ${pending ? styles.btnPrimaryLoading : ""}`}
            >
              Update Password
            </button>
          </form>
        ) : (
          <div className={styles.confirmWrap} style={{ paddingTop: "24px" }}>
            <div className={styles.confirmIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h1>Password updated.</h1>
            <p>Use your new password next time you log in.</p>
            <Link href="/settings" className={styles.btnPrimary} style={{ display: "flex", marginTop: "24px" }}>
              Back to Settings
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
