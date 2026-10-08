import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { ticketCode } from "@/lib/ticket";
import { SideNav } from "@/components/app/SideNav";
import { BottomTabbar } from "@/components/app/BottomTabbar";
import { ReportPage, type ReportItem } from "@/components/feedback/ReportPage";

export const metadata: Metadata = {
  title: "Report An Issue — NEETLeveling",
};

type Tone = ReportItem["tone"];

const BUG_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: "Open", tone: "open" },
  IN_PROGRESS: { label: "In Progress", tone: "progress" },
  FIXED: { label: "Fixed", tone: "fixed" },
};
const FEATURE_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: "Open", tone: "open" },
  PLANNED: { label: "Planned", tone: "progress" },
  SHIPPED: { label: "Shipped", tone: "fixed" },
};

// Formatted here, on the server, in a fixed timezone — formatting it in the
// client component would render a different day for SSR vs the browser
// around midnight and trip a hydration mismatch.
function dateLabel(d: Date) {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export default async function ReportBugPage() {
  const profile = await getCurrentProfile();
  const [bugReports, featureRequests] = await Promise.all([
    prisma.bugReport.findMany({ where: { profileId: profile.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.featureRequest.findMany({ where: { profileId: profile.id }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  const reports: (ReportItem & { at: number })[] = [
    ...bugReports.map((r) => ({
      id: r.id,
      ticket: ticketCode(r.id),
      title: r.title,
      dateLabel: dateLabel(r.createdAt),
      kind: "Bug" as const,
      statusLabel: BUG_STATUS[r.status].label,
      tone: BUG_STATUS[r.status].tone,
      at: r.createdAt.getTime(),
    })),
    ...featureRequests.map((r) => ({
      id: r.id,
      ticket: ticketCode(r.id),
      title: r.title,
      dateLabel: dateLabel(r.createdAt),
      kind: "Feature" as const,
      statusLabel: FEATURE_STATUS[r.status].label,
      tone: FEATURE_STATUS[r.status].tone,
      at: r.createdAt.getTime(),
    })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 30);

  return (
    <>
      <div className="systemBackdrop" />
      <SideNav activeHref="/settings" />
      <ReportPage initialReports={reports.map((r) => ({
          id: r.id,
          ticket: r.ticket,
          title: r.title,
          dateLabel: r.dateLabel,
          kind: r.kind,
          statusLabel: r.statusLabel,
          tone: r.tone,
        }))} />
      <BottomTabbar activeHref="/settings" />
    </>
  );
}
