import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getOverviewMetrics } from "@/lib/admin-analytics";
import { prisma } from "@/lib/prisma";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Overview — NEETLeveling Admin",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMrr(mrr: number) {
  if (mrr >= 100000) return `₹${(mrr / 100000).toFixed(2)}L`;
  return `₹${mrr.toLocaleString("en-IN")}`;
}

export default async function AdminOverviewPage() {
  await requireAdminSession();

  const [metrics, pendingWithdrawalCount, openBugCount, pendingWithdrawals, openBugReports] = await Promise.all([
    getOverviewMetrics(),
    prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
    prisma.bugReport.count({ where: { status: "OPEN" } }),
    prisma.withdrawalRequest.findMany({
      where: { status: "PENDING" },
      include: { profile: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.bugReport.findMany({
      where: { status: "OPEN" },
      include: { profile: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <div className={styles.topbarTitle}>Admin Console</div>
          <div className={styles.topbarSub}>System-wide overview</div>
        </div>
      </div>

      <div className={styles.statsRow} style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.cyan}`}>{metrics.totalProfiles.toLocaleString("en-IN")}</div>
          <div className={styles.statLbl}>Total Hunters</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.green}`}>{metrics.activeSubscribers.toLocaleString("en-IN")}</div>
          <div className={styles.statLbl}>Active Subs</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.gold}`}>{fmtMrr(metrics.mrr)}</div>
          <div className={styles.statLbl}>MRR</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.violet}`}>{pendingWithdrawalCount}</div>
          <div className={styles.statLbl}>Pending Withdrawals</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.danger}`}>{openBugCount}</div>
          <div className={styles.statLbl}>Open Bug Reports</div>
        </div>
      </div>

      <section>
        <span className={styles.secLabel}>
          <span className={styles.dot} />Withdrawal Requests
        </span>
        <div className={styles.panelBox}>
          {pendingWithdrawals.length === 0 ? (
            <div className={styles.rowDashed} style={{ textAlign: "center", color: "var(--slate)" }}>
              No pending withdrawal requests.
            </div>
          ) : (
            pendingWithdrawals.map((w) => (
              <div key={w.id} className={styles.rowDashed} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "14.5px" }}>{w.profile.name}</div>
                  <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", marginTop: "3px" }}>
                    Requested {fmtDate(w.createdAt)}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "16px", color: "var(--gold)" }}>
                  ₹{w.amount}
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ marginTop: "10px" }}>
          <Link href="/admin/withdrawals" className={styles.opChip}>
            View all withdrawals →
          </Link>
        </div>
      </section>

      <section>
        <span className={styles.secLabel} style={{ color: "var(--violet)" }}>
          <span className={styles.dot} style={{ background: "var(--violet)", boxShadow: "0 0 6px var(--violet)" }} />Bug Reports
        </span>
        <div className={styles.panelBox}>
          {openBugReports.length === 0 ? (
            <div className={styles.rowDashed} style={{ textAlign: "center", color: "var(--slate)" }}>
              No open bug reports.
            </div>
          ) : (
            openBugReports.map((b) => (
              <div key={b.id} className={styles.rowDashed}>
                <div style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 600, fontSize: "14.5px" }}>{b.title}</div>
                <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", marginTop: "4px" }}>
                  {b.profile.name} · {fmtDate(b.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ marginTop: "10px" }}>
          <Link href="/admin/feedback" className={styles.opChip}>
            View all bug reports →
          </Link>
        </div>
      </section>
    </>
  );
}
