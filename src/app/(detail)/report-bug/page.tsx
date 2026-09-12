import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { ReportForm } from "@/components/feedback/ReportForm";
import detailStyles from "../detail.module.css";

export const metadata: Metadata = {
  title: "Report An Issue — NEETLeveling",
};

const BUG_STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  FIXED: "Fixed",
};
const FEATURE_STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  PLANNED: "Planned",
  SHIPPED: "Shipped",
};

export default async function ReportBugPage() {
  const profile = await getCurrentProfile();
  const [bugReports, featureRequests] = await Promise.all([
    prisma.bugReport.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.featureRequest.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const combined = [
    ...bugReports.map((r) => ({
      id: r.id,
      title: r.title,
      createdAt: r.createdAt,
      statusLabel: BUG_STATUS_LABEL[r.status],
      kind: "Bug" as const,
    })),
    ...featureRequests.map((r) => ({
      id: r.id,
      title: r.title,
      createdAt: r.createdAt,
      statusLabel: FEATURE_STATUS_LABEL[r.status],
      kind: "Feature" as const,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className={detailStyles.app}>
      <header className={detailStyles.header}>
        <Link href="/settings" className={detailStyles.backBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1>Report An Issue</h1>
      </header>

      <main className={detailStyles.main}>
        <div>
          <span className={detailStyles.secLabel}>Every report gets a real look</span>
          <div className={detailStyles.card} style={{ padding: "20px" }}>
            <ReportForm />
          </div>
        </div>

        {combined.length > 0 && (
          <div>
            <span className={detailStyles.secLabel}>Your reports</span>
            <div className={detailStyles.card}>
              {combined.map((r) => (
                <div key={`${r.kind}-${r.id}`} className={detailStyles.rowLink}>
                  <div>
                    <div className={detailStyles.rlTitle}>{r.title}</div>
                    <div className={detailStyles.rlSub}>
                      {r.kind} · {r.createdAt.toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <span className={detailStyles.planBadge}>{r.statusLabel}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
