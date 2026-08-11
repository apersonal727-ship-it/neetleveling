"use client";

import { useState, useTransition } from "react";
import Script from "next/script";
import { initiatePayment } from "@/actions/billing";
import styles from "@/app/(onboarding)/onboarding.module.css";

declare global {
  interface Window {
    Cashfree: (config: { mode: "sandbox" | "production" }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget?: string }) => void;
    };
  }
}

export function CashfreeCheckoutButton({
  amountDue,
  mode,
}: {
  amountDue: number;
  mode: "sandbox" | "production";
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [sdkReady, setSdkReady] = useState(false);

  function handlePay() {
    setError(null);
    startTransition(async () => {
      const result = await initiatePayment();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if (!result.paymentSessionId) {
        setError("Something went wrong starting the payment. Please try again.");
        return;
      }
      const cashfree = window.Cashfree({ mode });
      cashfree.checkout({ paymentSessionId: result.paymentSessionId, redirectTarget: "_self" });
    });
  }

  return (
    <>
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" onLoad={() => setSdkReady(true)} />
      {error && (
        <div className={styles.formError}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 9v4M12 17h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      <button type="button" className={styles.btnPrimary} onClick={handlePay} disabled={pending || !sdkReady}>
        <span>{pending ? "Redirecting to payment…" : !sdkReady ? "Loading…" : `Pay ₹${amountDue} securely`}</span>
        {!pending && sdkReady && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>
    </>
  );
}
