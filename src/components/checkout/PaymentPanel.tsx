"use client";

import { useState } from "react";
import { CashfreeCheckoutButton } from "@/components/checkout/CashfreeCheckoutButton";
import styles from "@/app/(onboarding)/onboarding.module.css";

export function PaymentPanel({
  amountDue,
  mode,
}: {
  amountDue: number;
  mode: "sandbox" | "production";
}) {
  const [accepted, setAccepted] = useState(false);

  return (
    <>
      <div className={styles.gatewayNote}>
        <span className={styles.gatewayBadge}>Cashfree</span>
        <span>
          You&apos;ll be redirected to Cashfree&apos;s secure checkout to complete payment — UPI,
          cards, netbanking, all supported there.
        </span>
      </div>

      <label className={styles.termsRow}>
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span>
          I understand this is a <b>₹{amountDue > 0 ? amountDue : 99}/month recurring charge</b>,
          there&apos;s <b>no free tier</b>, and charges are <b>final — no refunds</b>.
        </span>
      </label>

      <CashfreeCheckoutButton amountDue={amountDue} mode={mode} disabled={!accepted} />
      <div className={styles.trustLine}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        Payments processed by Cashfree — verified automatically, no manual review
      </div>
    </>
  );
}
