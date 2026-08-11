import type { Metadata } from "next";
import { requireAdminProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { AdminTransactionList } from "@/components/admin/AdminTransactionList";
import { PendingPaymentsReview } from "@/components/admin/PendingPaymentsReview";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Billing — NEETLeveling Admin",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
}

export default async function AdminBillingPage() {
  await requireAdminProfile();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [collected, successCount, failedCount, refundedCount, transactions, pendingPayments] = await Promise.all([
    prisma.paymentTransaction.aggregate({
      where: { status: "SUCCESS", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.paymentTransaction.count({ where: { status: "SUCCESS", createdAt: { gte: startOfMonth } } }),
    prisma.paymentTransaction.count({ where: { status: "FAILED", createdAt: { gte: startOfMonth } } }),
    prisma.paymentTransaction.count({ where: { status: "REFUNDED", createdAt: { gte: startOfMonth } } }),
    prisma.paymentTransaction.findMany({
      where: { status: { notIn: ["PENDING_REVIEW", "PENDING"] } },
      include: { profile: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.paymentTransaction.findMany({
      where: { status: "PENDING_REVIEW" },
      include: { profile: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <>
      <PendingPaymentsReview
        initialPending={pendingPayments.map((p) => ({
          id: p.id,
          hunterName: p.profile.name,
          email: p.profile.email,
          amount: p.amount,
          reference: p.reference,
          submittedAt: fmtDate(p.createdAt),
        }))}
      />

      <section>
        <span className={styles.secLabel}>This month</span>
        <div className={styles.metricGrid}>
          <div className={`${styles.card} ${styles.metric}`}>
            <div className={styles.metricVal} style={{ color: "var(--green)" }}>
              ₹{(collected._sum.amount ?? 0).toLocaleString("en-IN")}
            </div>
            <div className={styles.metricLbl}>Collected</div>
          </div>
          <div className={`${styles.card} ${styles.metric}`}>
            <div className={styles.metricVal}>{successCount}</div>
            <div className={styles.metricLbl}>Successful charges</div>
          </div>
          <div className={`${styles.card} ${styles.metric}`}>
            <div className={styles.metricVal} style={{ color: "var(--red)" }}>{failedCount}</div>
            <div className={styles.metricLbl}>Failed payments</div>
          </div>
          <div className={`${styles.card} ${styles.metric}`}>
            <div className={styles.metricVal} style={{ color: "var(--amber)" }}>{refundedCount}</div>
            <div className={styles.metricLbl}>Refunds issued</div>
          </div>
        </div>
      </section>

      <section>
        <span className={styles.secLabel}>Transactions</span>
        <AdminTransactionList
          transactions={transactions.map((t) => ({
            id: t.id,
            name: t.profile.name,
            amount: t.amount,
            status: t.status,
            method: t.method,
            date: fmtDate(t.createdAt),
          }))}
        />
      </section>

      <p style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", lineHeight: 1.6 }}>
        Payments are processed automatically via Cashfree and verified by webhook — no manual review needed.
        The Pending Verification queue above only shows legacy manual submissions, if any.
      </p>
    </>
  );
}
