"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/current-profile";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { BugReportStatus, FeatureRequestStatus } from "@/generated/prisma/client";

export type FeedbackResult = { error: string } | { success: true };
export type ActionResult = { error: string } | { success: true };

export async function submitBugReport(formData: FormData): Promise<FeedbackResult> {
  const profile = await getCurrentProfile();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) return { error: "Give the bug a short title." };
  if (!description) return { error: "Describe what happened." };

  await prisma.bugReport.create({
    data: { profileId: profile.id, title, description },
  });

  revalidatePath("/report-bug");
  return { success: true };
}

export async function submitFeatureRequest(formData: FormData): Promise<FeedbackResult> {
  const profile = await getCurrentProfile();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) return { error: "Give your idea a short title." };
  if (!description) return { error: "Describe what you'd want." };

  await prisma.featureRequest.create({
    data: { profileId: profile.id, title, description },
  });

  revalidatePath("/feature-requests");
  return { success: true };
}

// ── Admin triage ───────────────────────────────────────────────

export async function updateBugReportStatus(
  id: string,
  status: BugReportStatus,
): Promise<ActionResult> {
  await requireAdminSession();

  const report = await prisma.bugReport.update({ where: { id }, data: { status } });

  if (status === "FIXED") {
    await prisma.notification.create({
      data: {
        profileId: report.profileId,
        type: "SYSTEM",
        title: "Bug fixed",
        message: `"${report.title}" has been fixed. Thanks for reporting it.`,
      },
    });
  }

  revalidatePath("/admin/feedback");
  return { success: true };
}

export async function updateFeatureRequestStatus(
  id: string,
  status: FeatureRequestStatus,
): Promise<ActionResult> {
  await requireAdminSession();

  const request = await prisma.featureRequest.update({ where: { id }, data: { status } });

  if (status === "SHIPPED") {
    await prisma.notification.create({
      data: {
        profileId: request.profileId,
        type: "SYSTEM",
        title: "Feature shipped",
        message: `"${request.title}" is live. Thanks for the idea.`,
      },
    });
  }

  revalidatePath("/admin/feedback");
  return { success: true };
}
