import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { BugReportForm } from "@/components/feedback/BugReportForm";
import detailStyles from "../detail.module.css";

export const metadata: Metadata = {
  title: "Report a Bug — NEETLeveling",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  FIXED: "Fixed",
};

export default async function ReportBugPage() {
  const profile = await getCurrentProfile();
  const reports = await prisma.bugReport.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className={detailStyles.app}>
      <header className={detailStyles.header}>
        <Link href="/settings" className={detailStyles.backBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1>Report a Bug</h1>
      </header>

      <main className={detailStyles.main}>
        <div>
          <span className={detailStyles.secLabel}>What&apos;s broken</span>
          <div className={detailStyles.card} style={{ padding: "20px" }}>
            <BugReportForm />
          </div>
        </div>

        {reports.length > 0 && (
          <div>
            <span className={detailStyles.secLabel}>Your reports</span>
            <div className={detailStyles.card}>
              {reports.map((r) => (
                <div key={r.id} className={detailStyles.rowLink}>
                  <div>
                    <div className={detailStyles.rlTitle}>{r.title}</div>
                    <div className={detailStyles.rlSub}>{r.createdAt.toLocaleDateString("en-IN")}</div>
                  </div>
                  <span className={detailStyles.planBadge}>{STATUS_LABEL[r.status]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
