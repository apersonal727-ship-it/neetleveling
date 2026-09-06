import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { FeedbackManager } from "@/components/admin/FeedbackManager";

export const metadata: Metadata = {
  title: "Feedback — NEETLeveling Admin",
};

export default async function AdminFeedbackPage() {
  await requireAdminSession();

  const [bugReports, featureRequests] = await Promise.all([
    prisma.bugReport.findMany({
      include: { profile: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.featureRequest.findMany({
      include: { profile: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return (
    <FeedbackManager
      bugReports={bugReports.map((b) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
        hunterName: b.profile.name,
      }))}
      featureRequests={featureRequests.map((f) => ({
        id: f.id,
        title: f.title,
        description: f.description,
        status: f.status,
        createdAt: f.createdAt.toISOString(),
        hunterName: f.profile.name,
      }))}
    />
  );
}
