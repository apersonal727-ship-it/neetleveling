import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { FeatureRequestForm } from "@/components/feedback/FeatureRequestForm";
import detailStyles from "../detail.module.css";

export const metadata: Metadata = {
  title: "Feature Requests — NEETLeveling",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  PLANNED: "Planned",
  SHIPPED: "Shipped",
};

export default async function FeatureRequestsPage() {
  const profile = await getCurrentProfile();
  const requests = await prisma.featureRequest.findMany({
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
        <h1>Feature Requests</h1>
      </header>

      <main className={detailStyles.main}>
        <div>
          <span className={detailStyles.secLabel}>What would improve the System</span>
          <div className={detailStyles.card} style={{ padding: "20px" }}>
            <FeatureRequestForm />
          </div>
        </div>

        {requests.length > 0 && (
          <div>
            <span className={detailStyles.secLabel}>Your requests</span>
            <div className={detailStyles.card}>
              {requests.map((r) => (
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
