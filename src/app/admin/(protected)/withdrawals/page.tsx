import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { WithdrawalsReview } from "@/components/admin/WithdrawalsReview";
import styles from "../../admin.module.css";

export const metadata: Metadata = {
  title: "Withdrawals — NEETLeveling Admin",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
}

export default async function AdminWithdrawalsPage() {
  await requireAdminSession();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pending, paidHistory, paidThisMonthCount, totalPaidSum] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where: { status: "PENDING" },
      include: { profile: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.withdrawalRequest.findMany({
      where: { status: "PAID" },
      include: { profile: { select: { name: true } } },
      orderBy: { paidAt: "desc" },
      take: 30,
    }),
    prisma.withdrawalRequest.count({ where: { status: "PAID", paidAt: { gte: startOfMonth } } }),
    prisma.withdrawalRequest.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
  ]);

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <div className={styles.topbarTitle}>Withdrawals</div>
          <div className={styles.topbarSub}>Every payout request — pending or paid</div>
        </div>
      </div>

      <div className={styles.statsRow} style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.violet}`}>{pending.length}</div>
          <div className={styles.statLbl}>Pending</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.cyan}`}>{paidThisMonthCount}</div>
          <div className={styles.statLbl}>Paid This Month</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.gold}`}>₹{(totalPaidSum._sum.amount ?? 0).toLocaleString("en-IN")}</div>
          <div className={styles.statLbl}>Total Paid Out</div>
        </div>
      </div>

      <WithdrawalsReview
        initialPending={pending.map((p) => ({
          id: p.id,
          hunterName: p.profile.name,
          email: p.profile.email,
          amount: p.amount,
          payeeName: p.payeeName,
          qrCodeUrl: p.qrCodeUrl,
          requestedAt: fmtDate(p.createdAt),
        }))}
      />

      <section>
        <span className={styles.secLabel}>
          <span className={styles.dot} />Paid History
        </span>
        {paidHistory.length === 0 ? (
          <div className={styles.panelBox} style={{ padding: "20px", textAlign: "center", color: "var(--slate)" }}>
            No withdrawals paid yet.
          </div>
        ) : (
          <div className={styles.panelBox}>
            {paidHistory.map((p) => (
              <div key={p.id} className={styles.rowDashed} style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "14.5px" }}>{p.profile.name}</div>
                  <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", marginTop: "3px" }}>
                    {p.payeeName} · paid {p.paidAt ? fmtDate(p.paidAt) : "—"}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "13px", color: "var(--green)" }}>
                  ₹{p.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
