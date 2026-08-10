"use client";

import { useState } from "react";
import styles from "@/app/(app)/wallet/wallet.module.css";

export function ReferralCard({ referralCode }: { referralCode: string }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const text = `Join me on NEETLeveling — use my code ${referralCode} at signup.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "NEETLeveling", text, url });
      } catch {
        // user cancelled — no-op
      }
    } else {
      navigator.clipboard.writeText(`${text} ${url}`).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  }

  return (
    <>
      <div className={styles.refCodeRow}>
        <div className={styles.refCode}>{referralCode}</div>
        <button type="button" className={styles.refCopy} onClick={copyCode}>
          {copied ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
      <button type="button" className={styles.btnShare} onClick={share}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 10.5 15.4 6.5M8.6 13.5l6.8 4" />
        </svg>
        {copied ? "Copied!" : "Share invite link"}
      </button>
    </>
  );
}
