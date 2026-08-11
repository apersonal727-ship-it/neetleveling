"use client";

import { useState, useTransition } from "react";
import { submitUpiPayment } from "@/actions/billing";
import styles from "@/app/(onboarding)/onboarding.module.css";

export function UpiPaymentForm({ amountDue }: { amountDue: number }) {
  const [reference, setReference] = useState("");
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    if (!agree) {
      setError("Please accept the Terms and Refund Policy to continue.");
      return;
    }
    if (reference.trim().length < 6) {
      setError("Enter the UPI transaction reference (UTR) shown in your payment app after paying.");
      return;
    }
    startTransition(async () => {
      const result = await submitUpiPayment(formData);
      if (result && "error" in result) setError(result.error);
    });
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
        <span className={styles.fieldLabel}>UPI transaction reference (UTR)</span>
        <input
          className={styles.fieldInput}
          name="reference"
          type="text"
          placeholder="e.g. 402911223344"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </div>

      <div className={styles.consent}>
        <input type="checkbox" id="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <label htmlFor="agree">
          I&apos;ve paid ₹{amountDue} to the UPI ID above and agree to the <a href="/legal">Terms</a> and{" "}
          <a href="/legal">Refund Policy</a>.
        </label>
      </div>

      <button type="submit" className={styles.btnPrimary} disabled={pending}>
        <span>{pending ? "Submitting…" : "I've Paid — Submit for Verification"}</span>
        {!pending && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>
    </form>
  );
}
