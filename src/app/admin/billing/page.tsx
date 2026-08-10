import type { Metadata } from "next";
import { requireAdminProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { AdminTransactionList } from "@/components/admin/AdminTransactionList";
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

  const [collected, successCount, failedCount, refundedCount, transactions] = await Promise.all([
    prisma.paymentTransaction.aggregate({
      where: { status: "SUCCESS", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.paymentTransaction.count({ where: { status: "SUCCESS", createdAt: { gte: startOfMonth } } }),
    prisma.paymentTransaction.count({ where: { status: "FAILED", createdAt: { gte: startOfMonth } } }),
    prisma.paymentTransaction.count({ where: { status: "REFUNDED", createdAt: { gte: startOfMonth } } }),
    prisma.paymentTransaction.findMany({
      include: { profile: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <>
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
        Live webhook event logs aren&apos;t available yet — no payment gateway is connected (see the
        checkout flow), so there are no real Razorpay webhooks to display.
      </p>
    </>
  );
}
