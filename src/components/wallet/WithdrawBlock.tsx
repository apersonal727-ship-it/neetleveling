"use client";

import { useState, useTransition } from "react";
import { requestWithdrawal } from "@/actions/wallet";
import { WITHDRAWAL_MIN_BALANCE } from "@/lib/wallet-constants";
import styles from "@/app/(app)/wallet/wallet.module.css";

export function WithdrawBlock({
  balance,
  hasPendingWithdrawal,
}: {
  balance: number;
  hasPendingWithdrawal: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const unlocked = balance >= WITHDRAWAL_MIN_BALANCE;
  const pct = Math.min(100, Math.round((balance / WITHDRAWAL_MIN_BALANCE) * 100));

  function handleSubmit() {
    setError(null);
    const fd = new FormData();
    fd.set("upiId", upiId);
    startTransition(async () => {
      const result = await requestWithdrawal(fd);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  if (hasPendingWithdrawal || done) {
    return (
      <div className={styles.withdrawBlock}>
        <div className={styles.withdrawPending}>
          ⏳ Withdrawal requested — an admin will pay you via UPI shortly.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.withdrawBlock}>
        <div className={styles.withdrawRow}>
          <span>Withdraw Unlocked</span>
          <b>₹{balance.toLocaleString("en-IN")} Available</b>
        </div>
        <div className={styles.withdrawTrack}>
          <div className={styles.withdrawFill} style={{ width: `${pct}%` }} />
        </div>
        <button
          type="button"
          className={`${styles.withdrawBtn} ${unlocked ? styles.withdrawBtnUnlocked : ""}`}
          disabled={!unlocked}
          onClick={() => setShowModal(true)}
        >
          💸 Withdraw to UPI
        </button>
        <div className={`${styles.withdrawHint} ${unlocked ? styles.withdrawHintUnlocked : ""}`}>
          {unlocked
            ? `Unlocked — you crossed ₹${WITHDRAWAL_MIN_BALANCE}. Withdraw anytime.`
            : `Unlocks at ₹${WITHDRAWAL_MIN_BALANCE} balance.`}
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2>Withdraw to UPI</h2>
            <p>
              We&apos;ll send ₹{balance.toLocaleString("en-IN")} manually to the UPI ID below — this
              isn&apos;t instant, an admin processes it by hand.
            </p>
            <input
              className={styles.modalInput}
              type="text"
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
            {error && <div className={styles.modalError}>{error}</div>}
            <div className={styles.modalActions}>
              <button type="button" className={styles.modalBtnCancel} onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalBtnPrimary}
                onClick={handleSubmit}
                disabled={pending || !upiId}
              >
                {pending ? "Submitting…" : "Request Withdrawal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
