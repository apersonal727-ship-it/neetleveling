import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  getOverviewMetrics,
  getRevenueByMonth,
  getCompletionRateTrend,
  getSignupFunnel,
  getSubscriptionBreakdown,
  getReferralProgramCost,
} from "@/lib/admin-analytics";
import { RevenueBarChart, CompletionLineChart, FunnelChart } from "@/components/admin/AnalyticsCharts";
import styles from "../../admin.module.css";

export const metadata: Metadata = {
  title: "Revenue — NEETLeveling Admin",
};

function fmtMrr(mrr: number) {
  if (mrr >= 100000) return `₹${(mrr / 100000).toFixed(2)}L`;
  return `₹${mrr.toLocaleString("en-IN")}`;
}

export default async function AdminAnalyticsPage() {
  await requireAdminSession();

  const [metrics, revenue, completionTrend, funnel, subBreakdown, referralCost] = await Promise.all([
    getOverviewMetrics(),
    getRevenueByMonth(),
    getCompletionRateTrend(),
    getSignupFunnel(),
    getSubscriptionBreakdown(),
    getReferralProgramCost(),
  ]);

  const avgCompletion = completionTrend.length
    ? Math.round(completionTrend.reduce((a, b) => a + b, 0) / completionTrend.length)
    : 0;

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <div className={styles.topbarTitle}>Revenue</div>
          <div className={styles.topbarSub}>Subscriptions, MRR trend, and referral program cost</div>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.gold}`}>{fmtMrr(metrics.mrr)}</div>
          <div className={styles.statLbl}>MRR</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.cyan}`}>{metrics.activeSubscribers.toLocaleString("en-IN")}</div>
          <div className={styles.statLbl}>Active Subscriptions</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.danger}`}>{metrics.churnRate}%</div>
          <div className={styles.statLbl}>Lifetime Churn</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.green}`}>{metrics.dau}</div>
          <div className={styles.statLbl}>Active Today</div>
        </div>
      </div>

      <section>
        <span className={styles.secLabel}>
          <span className={styles.dot} />MRR — Last 6 Months
        </span>
        <div className={styles.panelBox} style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
            <span style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "15px" }}>Collected</span>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "13px", color: "var(--blue)" }}>
              ₹{revenue[revenue.length - 1]?.value.toLocaleString("en-IN") ?? 0} this month
            </span>
          </div>
          <RevenueBarChart data={revenue} />
        </div>
      </section>

      <div className={styles.lowerGrid}>
        <section>
          <span className={styles.secLabel}>
            <span className={styles.dot} />Subscription Breakdown
          </span>
          <div className={styles.panelBox}>
            <div className={styles.breakdownRow}>
              <div className={styles.breakdownK}>
                <span className={`${styles.breakdownDot} ${styles.green}`} />Active
              </div>
              <div className={styles.breakdownV}>
                <b>{subBreakdown.active.count.toLocaleString("en-IN")}</b> · {subBreakdown.active.pct}%
              </div>
            </div>
            <div className={styles.breakdownRow}>
              <div className={styles.breakdownK}>
                <span className={`${styles.breakdownDot} ${styles.amber}`} />Lapsed (Grace Period)
              </div>
              <div className={styles.breakdownV}>
                <b>{subBreakdown.lapsed.count.toLocaleString("en-IN")}</b> · {subBreakdown.lapsed.pct}%
              </div>
            </div>
            <div className={styles.breakdownRow}>
              <div className={styles.breakdownK}>
                <span className={`${styles.breakdownDot} ${styles.danger}`} />Cancelled
              </div>
              <div className={styles.breakdownV}>
                <b>{subBreakdown.cancelled.count.toLocaleString("en-IN")}</b> · {subBreakdown.cancelled.pct}%
              </div>
            </div>
          </div>
        </section>

        <section>
          <span className={styles.secLabel} style={{ color: "var(--violet)" }}>
            <span className={styles.dot} style={{ background: "var(--violet)", boxShadow: "0 0 6px var(--violet)" }} />
            Referral Program Cost
          </span>
          <div className={styles.panelBox}>
            <div className={styles.breakdownRow}>
              <div className={styles.breakdownK}>Total Credits Issued</div>
              <div className={styles.breakdownV}>
                <b>₹{referralCost.totalIssued.toLocaleString("en-IN")}</b>
              </div>
            </div>
            <div className={styles.breakdownRow}>
              <div className={styles.breakdownK}>Withdrawn To UPI</div>
              <div className={styles.breakdownV}>
                <b>₹{referralCost.totalWithdrawn.toLocaleString("en-IN")}</b>
              </div>
            </div>
            <div className={styles.breakdownRow}>
              <div className={styles.breakdownK}>Applied To Bills</div>
              <div className={styles.breakdownV}>
                <b>₹{referralCost.totalApplied.toLocaleString("en-IN")}</b>
              </div>
            </div>
            <div className={styles.breakdownRow}>
              <div className={styles.breakdownK}>Hunters Acquired Via Referral</div>
              <div className={styles.breakdownV}>
                <b>{referralCost.referredCount.toLocaleString("en-IN")}</b>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section>
        <span className={styles.secLabel}>
          <span className={styles.dot} />Quest Completion Rate — Last 30 Days
        </span>
        <div className={styles.panelBox} style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
            <span style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "15px" }}>Completion %</span>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "13px", color: "var(--blue)" }}>{avgCompletion}% avg</span>
          </div>
          <CompletionLineChart points={completionTrend} />
        </div>
      </section>

      <section>
        <span className={styles.secLabel}>
          <span className={styles.dot} />Signup Funnel
        </span>
        <div className={styles.panelBox} style={{ padding: "20px" }}>
          <FunnelChart steps={funnel} />
        </div>
        <p style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", marginTop: "10px", lineHeight: 1.6 }}>
          Pre-signup steps (landing page visits, abandoned checkouts) aren&apos;t tracked yet — no
          page-view analytics is wired up. These are the funnel stages we can measure from account
          data alone.
        </p>
      </section>
    </>
  );
}
