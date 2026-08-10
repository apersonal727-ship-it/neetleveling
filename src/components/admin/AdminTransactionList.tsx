"use client";

import { useState } from "react";
import styles from "@/app/admin/admin.module.css";

type Tx = {
  id: string;
  name: string;
  amount: number;
  status: string;
  method: string;
  date: string;
};

const FILTERS = ["all", "SUCCESS", "FAILED", "REFUNDED"] as const;
const FILTER_LABEL: Record<(typeof FILTERS)[number], string> = {
  all: "All",
  SUCCESS: "Successful",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export function AdminTransactionList({ transactions }: { transactions: Tx[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.status === filter);

  const colorFor = (status: string) =>
    status === "SUCCESS" ? "var(--green)" : status === "FAILED" ? "var(--red)" : "var(--amber)";

  return (
    <>
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", marginBottom: "12px" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "11px",
              padding: "8px 14px",
              borderRadius: "100px",
              border: `1px solid ${filter === f ? "transparent" : "var(--border-strong)"}`,
              color: filter === f ? "var(--blue-2)" : "var(--slate)",
              background: filter === f ? "rgba(79,157,255,.1)" : "none",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>
      <div className={styles.card}>
        {filtered.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--slate)" }}>
            No transactions
          </div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: colorFor(t.status), boxShadow: `0 0 6px ${colorFor(t.status)}`, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", marginTop: "3px" }}>
                  {t.method} · {t.date}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "13px", color: colorFor(t.status), flexShrink: 0 }}>
                {t.status === "REFUNDED" ? "−" : ""}₹{t.amount}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
