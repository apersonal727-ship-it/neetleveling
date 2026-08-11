"use client";

import { useState, useTransition } from "react";
import { approvePayment, rejectPayment } from "@/actions/admin";
import styles from "@/app/admin/admin.module.css";

type Pending = {
  id: string;
  hunterName: string;
  email: string;
  amount: number;
  reference: string | null;
  submittedAt: string;
};

export function PendingPaymentsReview({ initialPending }: { initialPending: Pending[] }) {
  const [pending, setPending] = useState(initialPending);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [, startTransition] = useTransition();

  function handleApprove(id: string) {
    if (!confirm("Approve this payment and activate the hunter's subscription?")) return;
    setPending((p) => p.filter((x) => x.id !== id));
    startTransition(() => {
      approvePayment(id);
    });
  }

  function handleReject(id: string) {
    setPending((p) => p.filter((x) => x.id !== id));
    setRejectingId(null);
    const reason = note.trim();
    setNote("");
    startTransition(() => {
      rejectPayment(id, reason || undefined);
    });
  }

  if (pending.length === 0) return null;

  return (
    <section>
      <span className={styles.secLabel} style={{ color: "var(--amber)" }}>
        Pending verification ({pending.length})
      </span>
      <div className={styles.card}>
        {pending.map((p) => (
          <div key={p.id} style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{p.hunterName}</div>
                <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", marginTop: "3px" }}>
                  {p.email} · {p.submittedAt}
                </div>
                <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--blue-2)", marginTop: "6px" }}>
                  UTR: {p.reference}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "15px", fontWeight: 600, flexShrink: 0 }}>
                ₹{p.amount}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => handleApprove(p.id)}
                style={{
                  flex: 1,
                  height: "38px",
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
                Approve
              </button>
              <button
                type="button"
                onClick={() => setRejectingId(rejectingId === p.id ? null : p.id)}
                style={{
                  flex: 1,
                  height: "38px",
                  borderRadius: "9px",
                  border: "1px solid rgba(255,77,94,.4)",
                  background: "rgba(255,77,94,.08)",
                  color: "var(--red)",
                  fontFamily: "var(--font-rajdhani), sans-serif",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Reject
              </button>
            </div>

            {rejectingId === p.id && (
              <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                <input
                  className={styles.fieldInput}
                  placeholder="Reason (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => handleReject(p.id)}
                  style={{
                    padding: "0 16px",
                    borderRadius: "9px",
                    border: "none",
                    background: "var(--red)",
                    color: "#fff0f0",
                    fontFamily: "var(--font-rajdhani), sans-serif",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
