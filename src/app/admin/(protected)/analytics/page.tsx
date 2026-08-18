import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  getOverviewMetrics,
  getRevenueByMonth,
  getCompletionRateTrend,
  getSignupFunnel,
} from "@/lib/admin-analytics";
import { RevenueBarChart, CompletionLineChart, FunnelChart } from "@/components/admin/AnalyticsCharts";
import styles from "../../admin.module.css";

export const metadata: Metadata = {
  title: "Analytics — NEETLeveling Admin",
};

export default async function AdminAnalyticsPage() {
  await requireAdminSession();

  const [metrics, revenue, completionTrend, funnel] = await Promise.all([
    getOverviewMetrics(),
    getRevenueByMonth(),
    getCompletionRateTrend(),
    getSignupFunnel(),
  ]);

  const avgCompletion = completionTrend.length
    ? Math.round(completionTrend.reduce((a, b) => a + b, 0) / completionTrend.length)
    : 0;

  return (
    <>
      <section>
        <span className={styles.secLabel}>Overview</span>
        <div className={styles.metricGrid}>
          <div className={`${styles.card} ${styles.metric}`}>
            <div className={styles.metricVal}>₹{metrics.mrr.toLocaleString("en-IN")}</div>
            <div className={styles.metricLbl}>MRR</div>
          </div>
          <div className={`${styles.card} ${styles.metric}`}>
            <div className={styles.metricVal}>{metrics.activeSubscribers.toLocaleString("en-IN")}</div>
            <div className={styles.metricLbl}>Active subscribers</div>
          </div>
          <div className={`${styles.card} ${styles.metric}`}>
            <div className={styles.metricVal}>{metrics.churnRate}%</div>
            <div className={styles.metricLbl}>Lifetime churn</div>
          </div>
          <div className={`${styles.card} ${styles.metric}`}>
            <div className={styles.metricVal}>{metrics.dau}</div>
            <div className={styles.metricLbl}>Active today</div>
          </div>
        </div>
      </section>

      <section>
        <span className={styles.secLabel}>Revenue — last 6 months</span>
        <div className={styles.card} style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
            <span style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "15px" }}>Collected</span>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "13px", color: "var(--blue-2)" }}>
              ₹{revenue[revenue.length - 1]?.value.toLocaleString("en-IN") ?? 0} this month
            </span>
          </div>
          <RevenueBarChart data={revenue} />
        </div>
      </section>

      <section>
        <span className={styles.secLabel}>Quest completion rate — last 30 days</span>
        <div className={styles.card} style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
            <span style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "15px" }}>Completion %</span>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "13px", color: "var(--blue-2)" }}>{avgCompletion}% avg</span>
          </div>
          <CompletionLineChart points={completionTrend} />
        </div>
      </section>

      <section>
        <span className={styles.secLabel}>Signup funnel</span>
        <div className={styles.card} style={{ padding: "20px" }}>
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
