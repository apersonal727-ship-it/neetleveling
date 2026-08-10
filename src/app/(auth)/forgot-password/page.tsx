"use client";

import { useState } from "react";
import Link from "next/link";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { requestPasswordReset } from "@/actions/auth";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  async function handleSubmit(formData: FormData) {
    const value = String(formData.get("email") ?? "").trim();
    setEmail(value || "you@email.com");
    await requestPasswordReset(formData);
    setSubmitted(true);
  }

  function resend() {
    setResendCooldown(30);
    const iv = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(iv);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  return (
    <>
      <div className={styles.bgGrid} />
      <div className={styles.app}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <FlameIcon className={styles.flame} />
            NEETLEVELING
          </div>
        </div>

        <main className={styles.main}>
          {!submitted ? (
            <form action={handleSubmit}>
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "22px" }}>Reset your password.</h1>
                <p
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "12px",
                    color: "var(--slate)",
                    marginTop: "8px",
                    lineHeight: 1.6,
                  }}
                >
                  Enter the email on your account and the System will send a reset link.
                </p>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Email</span>
                <input
                  className={styles.fieldInput}
                  name="email"
                  type="email"
                  placeholder="you@email.com"
                  autoComplete="email"
                  required
                />
              </div>
              <button type="submit" className={styles.btnPrimary}>
                Send Reset Link
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
              <div className={styles.backLine}>
                Remembered it? <Link href="/login">Log in</Link>
              </div>
            </form>
          ) : (
            <div>
              <div className={styles.confirmWrap}>
                <div className={styles.confirmIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m4 6 8 7 8-7" />
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                  </svg>
                </div>
                <h1>Check your inbox.</h1>
                <p>
                  If an account exists for <span className={styles.confirmEmail}>{email}</span>, a
                  reset link is on its way.
                </p>
                <p>Links expire after 30 minutes.</p>
                <div className={styles.resendLine}>
                  Didn&apos;t get it?{" "}
                  <button type="button" onClick={resend} disabled={resendCooldown > 0}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend link"}
                  </button>
                </div>
              </div>
              <div className={styles.backLine}>
                Back to <Link href="/login">Log in</Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
