import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { CancelSubscriptionLink } from "@/components/settings/CancelSubscriptionLink";
import detailStyles from "../detail.module.css";
import styles from "./billing.module.css";

export const metadata: Metadata = {
  title: "Billing — NEETLeveling",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_CLASS: Record<string, string> = {
  SUCCESS: styles.txStatusSuccess,
  FAILED: styles.txStatusFailed,
};

export default async function BillingPage() {
  const profile = await getCurrentProfile();
  const transactions = await prisma.paymentTransaction.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const lastMethod = transactions[0]?.method ?? null;

  return (
    <div className={detailStyles.app}>
      <header className={detailStyles.header}>
        <Link href="/settings" className={detailStyles.backBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1>Billing</h1>
      </header>

      <main className={detailStyles.main}>
        <section>
          <span className={detailStyles.secLabel}>Current plan</span>
          <div className={detailStyles.card} style={{ padding: "20px" }}>
            <div className={styles.planRow}>
              <div>
                <div className={styles.planName}>Hunter Access</div>
                <div className={styles.planPrice}>₹99/month · billed monthly</div>
              </div>
              <span className={detailStyles.planBadge}>{profile.subscriptionStatus}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.detailRow}>
              <span>Next renewal</span>
              <b className={styles.detailVal}>
                {profile.subscriptionRenewsAt ? fmtDate(profile.subscriptionRenewsAt) : "—"}
              </b>
            </div>
            <div className={styles.detailRow}>
              <span>Wallet credit applied</span>
              <b className={styles.detailVal}>₹{profile.walletCredit}</b>
            </div>
          </div>
        </section>

        <section>
          <span className={detailStyles.secLabel}>Payment method</span>
          <div className={detailStyles.card} style={{ padding: "14px 20px" }}>
            <div className={styles.methodRow}>
              <div className={styles.methodIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="17" height="17">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
              <div className={styles.methodBody}>
                <div className={styles.methodTitle}>
                  {lastMethod ? `Last paid via ${lastMethod}` : "No payment on file"}
                </div>
                <div className={styles.methodSub}>
                  {lastMethod ? "Managed at your next checkout" : "Added automatically on your next payment"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <span className={detailStyles.secLabel}>Invoice history</span>
          {transactions.length === 0 ? (
            <div className={detailStyles.card}>
              <div className={styles.emptyState}>No invoices yet.</div>
            </div>
          ) : (
            <div className={detailStyles.card}>
              {transactions.map((tx) => (
                <div key={tx.id} className={detailStyles.rowLink} style={{ cursor: "default" }}>
                  <div>
                    <div className={styles.txDate}>{fmtDate(tx.createdAt)}</div>
                    <div className={`${styles.txStatus} ${STATUS_CLASS[tx.status] ?? styles.txStatusPending}`}>
                      {tx.status}
                    </div>
                  </div>
                  <div className={styles.txAmount}>₹{tx.amount}</div>
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
