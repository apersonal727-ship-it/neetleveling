"use server";

import { revalidatePath } from "next/cache";
import { getSupportProfile } from "@/lib/support-profile";
import { requireAdminSession } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ticketCode } from "@/lib/ticket";
import type { BugReportStatus, FeatureRequestStatus } from "@/generated/prisma/client";

export type SubmittedReport = {
  id: string;
  ticket: string;
  title: string;
  kind: "Bug" | "Feature";
};
export type FeedbackResult = { error: string } | { success: true; report?: SubmittedReport };
export type ActionResult = { error: string } | { success: true };

const SCREENSHOT_BUCKET = "report-screenshots";
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

// Uploads to a Supabase Storage bucket named "report-screenshots" — create
// it in the Supabase dashboard (Storage → New bucket, public) before this
// can succeed; until then this just returns an error and the report still
// submits without a screenshot (see submitBugReport below).
export async function uploadReportScreenshot(
  file: File,
): Promise<{ error: string } | { url: string }> {
  const profile = await getSupportProfile();

  if (!file || file.size === 0) return { error: "No file provided." };
  if (file.size > MAX_SCREENSHOT_BYTES) return { error: "Screenshot must be under 5MB." };
  if (!file.type.startsWith("image/")) return { error: "Only image files are supported." };

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${profile.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { error: `Couldn't upload screenshot: ${uploadError.message}` };
  }

  const { data } = supabase.storage.from(SCREENSHOT_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function submitBugReport(formData: FormData): Promise<FeedbackResult> {
  const profile = await getSupportProfile();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const screenshotUrl = String(formData.get("screenshotUrl") ?? "").trim() || null;

  if (title.length < 4) return { error: "Give it a short title so we know what it's about." };
  if (description.length < 8) return { error: "A quick description helps us fix it faster." };

  const created = await prisma.bugReport.create({
    data: { profileId: profile.id, title, description, screenshotUrl },
  });

  revalidatePath("/report-bug");
  revalidatePath("/admin/feedback");
  return { success: true, report: { id: created.id, ticket: ticketCode(created.id), title, kind: "Bug" } };
}

export async function submitFeatureRequest(formData: FormData): Promise<FeedbackResult> {
  const profile = await getSupportProfile();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (title.length < 4) return { error: "Give your idea a short title." };
  if (description.length < 8) return { error: "Tell us a bit more so we can understand the idea." };

  const created = await prisma.featureRequest.create({
    data: { profileId: profile.id, title, description },
  });

  revalidatePath("/report-bug");
  revalidatePath("/feature-requests");
  revalidatePath("/admin/feedback");
  return { success: true, report: { id: created.id, ticket: ticketCode(created.id), title, kind: "Feature" } };
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

  // The hunter sees this status on their own report list — a different
  // route, so it needs its own refresh or it keeps showing the old status.
  revalidatePath("/admin/feedback");
  revalidatePath("/report-bug");
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

  // The hunter sees this status on their own report list — a different
  // route, so it needs its own refresh or it keeps showing the old status.
  revalidatePath("/admin/feedback");
  revalidatePath("/report-bug");
  return { success: true };
}
