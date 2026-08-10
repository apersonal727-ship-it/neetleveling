"use client";

import { useState, useTransition } from "react";
import { activateSubscription } from "@/actions/billing";
import styles from "../onboarding.module.css";

function nextRenewalLabel() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function CheckoutPage() {
  const [method, setMethod] = useState<"upi" | "card">("upi");
  const [upi, setUpi] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [agree, setAgree] = useState(true);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const nextErrors: Record<string, boolean> = {};

    if (method === "upi") {
      if (!upi.includes("@")) nextErrors.upi = true;
    } else {
      const digits = cardNumber.replace(/\s/g, "");
      if (digits.length < 12) nextErrors.cardNumber = true;
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) nextErrors.cardExpiry = true;
      if (cardCvv.trim().length < 3) nextErrors.cardCvv = true;
    }

    if (!agree) {
      setError("Please accept the Terms and Refund Policy to continue.");
      setErrors(nextErrors);
      return;
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    startTransition(async () => {
      const result = await activateSubscription();
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <>
      <div className={styles.bgGrid} />
      <div className={styles.app}>
        <header className={styles.header}>
          <div className={styles.stepTrack}>
            <div className={styles.stepFill} style={{ width: "100%" }} />
          </div>
          <span className={styles.stepLabel}>Step 4 of 4 · Unlock Access</span>
        </header>

        <main className={styles.main}>
          <div className={styles.pageHead}>
            <h1>One plan. Fully premium.</h1>
            <p>This is the only step between you and Level 1.</p>
          </div>

          <div className={`${styles.card} ${styles.summaryCard}`}>
            <div className={styles.summaryTop}>
              <div>
                <div className={styles.summaryTitle}>Hunter Access</div>
                <div className={styles.summarySub}>Billed monthly · cancel anytime</div>
              </div>
              <div className={styles.summaryPrice}>
                ₹99<span>/month</span>
              </div>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}>
              <span>Today&apos;s charge</span>
              <b>₹99</b>
            </div>
            <div className={styles.summaryRow}>
              <span>Next renewal</span>
              <b>{nextRenewalLabel()}</b>
            </div>
          </div>

          <section>
            <span className={styles.sectionLabel}>Pay with</span>
            <div className={styles.methodRow}>
              <button
                type="button"
                className={`${styles.methodBtn} ${method === "upi" ? styles.methodBtnActive : ""}`}
                onClick={() => setMethod("upi")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 10h18" />
                </svg>
                <span>UPI</span>
              </button>
              <button
                type="button"
                className={`${styles.methodBtn} ${method === "card" ? styles.methodBtnActive : ""}`}
                onClick={() => setMethod("card")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M2 10h20" />
                </svg>
                <span>CARD</span>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className={styles.formError}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 9v4M12 17h.01" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {method === "upi" ? (
                <div className={styles.field2}>
                  <span className={styles.fieldLabel}>UPI ID</span>
                  <input
                    className={`${styles.fieldInput} ${errors.upi ? styles.fieldInputError : ""}`}
                    type="text"
                    placeholder="yourname@upi"
                    value={upi}
                    onChange={(e) => setUpi(e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div className={styles.field2}>
                    <span className={styles.fieldLabel}>Card Number</span>
                    <input
                      className={`${styles.fieldInput} ${errors.cardNumber ? styles.fieldInputError : ""}`}
                      type="text"
                      placeholder="1234  5678  9012  3456"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.field2}>
                      <span className={styles.fieldLabel}>Expiry</span>
                      <input
                        className={`${styles.fieldInput} ${errors.cardExpiry ? styles.fieldInputError : ""}`}
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                      />
                    </div>
                    <div className={styles.field2}>
                      <span className={styles.fieldLabel}>CVV</span>
                      <input
                        className={`${styles.fieldInput} ${errors.cardCvv ? styles.fieldInputError : ""}`}
                        type="text"
                        placeholder="•••"
                        inputMode="numeric"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className={styles.consent}>
                <input
                  type="checkbox"
                  id="agree"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <label htmlFor="agree">
                  I agree to the <a href="/legal">Terms</a> and understand this is a recurring
                  ₹99/month subscription — cancellable anytime, but{" "}
                  <strong>all payments are final</strong> per the <a href="/legal">Refund Policy</a>.
                </label>
              </div>

              <button type="submit" className={styles.btnPrimary} disabled={pending}>
                <span>{pending ? "Processing…" : "Pay ₹99 & Unlock"}</span>
                {!pending && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
              </button>
            </form>
          </section>

          <div className={styles.trustLine}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Payments encrypted &amp; processed securely
          </div>
        </main>
      </div>
    </>
  );
}
