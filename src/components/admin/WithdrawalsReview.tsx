"use client";

import { useState, useTransition } from "react";
import { markWithdrawalPaid } from "@/actions/wallet";
import styles from "@/app/admin/admin.module.css";

type Pending = {
  id: string;
  hunterName: string;
  email: string;
  amount: number;
  upiId: string;
  requestedAt: string;
};

export function WithdrawalsReview({ initialPending }: { initialPending: Pending[] }) {
  const [pending, setPending] = useState(initialPending);
  const [, startTransition] = useTransition();

  function handleMarkPaid(id: string) {
    if (!confirm("Confirm you've paid this hunter via UPI outside the system?")) return;
    setPending((p) => p.filter((x) => x.id !== id));
    startTransition(() => {
      markWithdrawalPaid(id);
    });
  }

  if (pending.length === 0) {
    return (
      <section>
        <span className={styles.secLabel}>Pending withdrawals</span>
        <div className={styles.card} style={{ padding: "20px", textAlign: "center", color: "var(--slate)" }}>
          No pending withdrawal requests.
        </div>
      </section>
    );
  }

  return (
    <section>
      <span className={styles.secLabel} style={{ color: "var(--gold)" }}>
        Pending withdrawals ({pending.length})
      </span>
      <div className={styles.card}>
        {pending.map((p) => (
          <div key={p.id} style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{p.hunterName}</div>
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "10.5px",
                    color: "var(--slate)",
                    marginTop: "3px",
                  }}
                >
                  {p.email} · {p.requestedAt}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "12px",
                    color: "var(--blue-2)",
                    marginTop: "6px",
                  }}
                >
                  UPI: {p.upiId}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "15px", fontWeight: 600, flexShrink: 0 }}>
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
                borderRadius: "9px",
                border: "1px solid rgba(61,220,132,.4)",
                background: "rgba(61,220,132,.08)",
                color: "var(--green)",
                fontFamily: "var(--font-rajdhani), sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Mark Paid
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
