"use client";

import { useRef, useState, useTransition } from "react";
import { requestWithdrawal, uploadWithdrawalQrCode } from "@/actions/wallet";
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
  const [payeeName, setPayeeName] = useState("");
  const [qrCode, setQrCode] = useState<{ file: File; previewUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unlocked = balance >= WITHDRAWAL_MIN_BALANCE;
  const pct = Math.min(100, Math.round((balance / WITHDRAWAL_MIN_BALANCE) * 100));

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrCode({ file, previewUrl: URL.createObjectURL(file) });
  }

  function removeQrCode() {
    if (qrCode) URL.revokeObjectURL(qrCode.previewUrl);
    setQrCode(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetAndClose() {
    setShowModal(false);
    setPayeeName("");
    removeQrCode();
    setError(null);
  }

  function handleSubmit() {
    setError(null);
    if (!payeeName.trim()) {
      setError("Enter the name on your UPI account.");
      return;
    }
    if (!qrCode) {
      setError("Please upload your UPI QR code to continue.");
      return;
    }
    startTransition(async () => {
      setUploading(true);
      const uploadResult = await uploadWithdrawalQrCode(qrCode.file);
      setUploading(false);
      if ("error" in uploadResult) {
        setError(uploadResult.error);
        return;
      }
      const fd = new FormData();
      fd.set("payeeName", payeeName.trim());
      fd.set("qrCodeUrl", uploadResult.url);
      const result = await requestWithdrawal(fd);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  if (hasPendingWithdrawal) {
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
        <div className={styles.modalOverlay} onClick={done ? undefined : resetAndClose}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            {done ? (
              <>
                <div className={styles.successBadge}>✓</div>
                <h2 className={styles.successTitle}>Withdrawal Request Sent</h2>
                <p className={styles.successSub}>
                  ₹{balance.toLocaleString("en-IN")} will be sent to <b>{payeeName}</b>
                  <br />
                  using your uploaded QR code, within <b>7 days</b>.
                </p>
                <button type="button" className={styles.successDoneBtn} onClick={resetAndClose}>
                  Done
                </button>
              </>
            ) : (
              <>
                <h2>Withdraw to UPI</h2>
                <p>
                  This withdraws your full available balance of ₹{balance.toLocaleString("en-IN")}
                  . Confirm the name and drop your UPI QR code below — the same one you&apos;d
                  share to receive a payment.
                </p>

                <div style={{ textAlign: "left", marginTop: 4 }}>
                  <label
                    style={{
                      display: "block",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "10.5px",
                      letterSpacing: "0.06em",
                      color: "var(--slate)",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    Name On UPI ID
                  </label>
                  <input
                    className={styles.modalInput}
                    type="text"
                    placeholder="As it appears on your UPI account"
                    value={payeeName}
                    onChange={(e) => setPayeeName(e.target.value)}
                  />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                {!qrCode ? (
                  <div className={styles.qrDrop} onClick={() => fileInputRef.current?.click()}>
                    <div className={styles.qrDropIcon}>📷</div>
                    <div className={styles.qrDropText}>Drop your UPI QR code here</div>
                    <div className={styles.qrDropSub}>or click to upload · PNG, JPG</div>
                  </div>
                ) : (
                  <div className={styles.qrPreview}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCode.previewUrl} alt="Your UPI QR code" />
                    <div className={styles.qrFilename}>{qrCode.file.name}</div>
                    <button type="button" className={styles.qrRemove} onClick={removeQrCode}>
                      Remove &amp; upload a different one
                    </button>
                  </div>
                )}

                <div className={styles.upiWarning}>
                  ⚠ This payout is processed manually. Make sure the name matches your account and
                  this QR code is current — a wrong or outdated entry can send your money to the
                  wrong person and can&apos;t be reversed.
                </div>

                {error && <div className={styles.modalError}>{error}</div>}

                <div className={styles.modalActions}>
                  <button type="button" className={styles.modalBtnCancel} onClick={resetAndClose}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.modalBtnPrimary}
                    onClick={handleSubmit}
                    disabled={pending}
                  >
                    {uploading ? "Uploading…" : pending ? "Submitting…" : "Submit Withdrawal Request"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
