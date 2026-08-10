import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { CancelSubscriptionLink } from "@/components/settings/CancelSubscriptionLink";
import styles from "../detail.module.css";

export const metadata: Metadata = {
  title: "Billing — NEETLeveling",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function BillingPage() {
  const profile = await getCurrentProfile();
  const transactions = await prisma.paymentTransaction.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const lastMethod = transactions[0]?.method ?? null;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link href="/settings" className={styles.backBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1>Billing</h1>
      </header>

      <main className={styles.main}>
        <section>
          <span className={styles.secLabel}>Current plan</span>
          <div className={styles.card} style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "16px" }}>
                  Hunter Access
                </div>
                <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--slate)", marginTop: "3px" }}>
                  ₹99/month · billed monthly
                </div>
              </div>
              <span className={styles.planBadge}>{profile.subscriptionStatus}</span>
            </div>
            <div style={{ height: "1px", background: "var(--border)", margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "var(--slate)" }}>
              <span>Next renewal</span>
              <b style={{ color: "var(--ice)" }}>
                {profile.subscriptionRenewsAt ? fmtDate(profile.subscriptionRenewsAt) : "—"}
              </b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "var(--slate)", marginTop: "8px" }}>
              <span>Wallet credit applied</span>
              <b style={{ color: "var(--ice)" }}>₹{profile.walletCredit}</b>
            </div>
          </div>
        </section>

        <section>
          <span className={styles.secLabel}>Payment method</span>
          <div className={styles.card} style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "9px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(79,157,255,.1)", border: "1px solid var(--border-strong)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="17" height="17" style={{ color: "var(--blue-2)" }}>
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13.5px", fontWeight: 600 }}>
                {lastMethod ? `Last paid via ${lastMethod}` : "No payment on file"}
              </div>
              <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--slate)", marginTop: "3px" }}>
                {lastMethod ? "Managed at your next checkout" : "Added automatically on your next payment"}
              </div>
            </div>
          </div>
        </section>

        <section>
          <span className={styles.secLabel}>Invoice history</span>
          {transactions.length === 0 ? (
            <div className={styles.card} style={{ padding: "20px", textAlign: "center", color: "var(--slate)", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px" }}>
              No invoices yet.
            </div>
          ) : (
            <div className={styles.card}>
              {transactions.map((tx) => (
                <div key={tx.id} className={styles.rowLink} style={{ cursor: "default" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{fmtDate(tx.createdAt)}</div>
                    <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", color: tx.status === "SUCCESS" ? "var(--green)" : tx.status === "FAILED" ? "var(--red)" : "var(--amber)", marginTop: "3px" }}>
                      {tx.status}
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "13px" }}>₹{tx.amount}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <CancelSubscriptionLink disabled={profile.subscriptionStatus === "CANCELED"} />
      </main>
    </div>
  );
}
