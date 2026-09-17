"use client";

import { useState, useTransition } from "react";
import { markWithdrawalPaid } from "@/actions/wallet";
import styles from "@/app/admin/admin.module.css";

type Pending = {
  id: string;
  hunterName: string;
  email: string;
  amount: number;
  payeeName: string;
  qrCodeUrl: string;
  requestedAt: string;
};

export function WithdrawalsReview({ initialPending }: { initialPending: Pending[] }) {
  const [pending, setPending] = useState(initialPending);
  const [previewing, setPreviewing] = useState<Pending | null>(null);
  const [, startTransition] = useTransition();

  function handleMarkPaid(id: string) {
    if (!confirm("Confirm you've scanned their QR code and paid this hunter outside the system?")) return;
    setPending((p) => p.filter((x) => x.id !== id));
    startTransition(() => {
      markWithdrawalPaid(id);
    });
  }

  return (
    <section>
      <span className={styles.secLabel} style={{ color: "var(--gold)" }}>
        <span className={styles.dot} style={{ background: "var(--gold)", boxShadow: "0 0 6px var(--gold)" }} />
        Pending Withdrawals ({pending.length})
      </span>

      {pending.length === 0 ? (
        <div className={styles.panelBox} style={{ padding: "20px", textAlign: "center", color: "var(--slate)" }}>
          No pending withdrawal requests.
        </div>
      ) : (
        <div className={styles.panelBox}>
          {pending.map((p) => (
            <div key={p.id} className={styles.rowDashed}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <button
                  type="button"
                  onClick={() => setPreviewing(p)}
                  style={{
                    width: "46px",
                    height: "46px",
                    flex: "0 0 auto",
                    border: "1px solid var(--border)",
                    background: "var(--void)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  📷
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "15px" }}>{p.hunterName}</div>
                  <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", marginTop: "3px" }}>
                    {p.email} · {p.requestedAt}
                  </div>
                  <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--blue)", marginTop: "6px" }}>
                    Pay to: {p.payeeName}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "17px", color: "var(--gold)", flex: "0 0 auto" }}>
                  ₹{p.amount}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleMarkPaid(p.id)}
                style={{
                  width: "100%",
                  height: "38px",
                  marginTop: "12px",
                  border: "1px solid rgba(74,222,128,.4)",
                  background: "rgba(74,222,128,.08)",
                  color: "var(--green)",
                  fontFamily: "var(--font-rajdhani), sans-serif",
                  fontWeight: 700,
                  fontSize: "13px",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                ✓ Mark Paid
              </button>
            </div>
          ))}
        </div>
      )}

      {previewing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(5,3,10,.75)",
            backdropFilter: "blur(3px)",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewing(null);
          }}
        >
          <div className={styles.panelBox} style={{ width: "100%", maxWidth: "320px", textAlign: "center", padding: "26px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewing.qrCodeUrl}
              alt="UPI QR code"
              style={{ width: "100%", aspectRatio: "1", objectFit: "cover", border: "1px solid var(--border)", marginBottom: "14px" }}
            />
            <div style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "15px" }}>{previewing.hunterName}</div>
            <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--slate)", marginTop: "6px" }}>
              ₹{previewing.amount} requested
            </div>
            <button
              type="button"
              onClick={() => setPreviewing(null)}
              style={{
                marginTop: "16px",
                padding: "10px 24px",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "11px",
                color: "var(--slate)",
                border: "1px solid var(--border)",
                background: "transparent",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
