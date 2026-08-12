"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { checkAndApplyLockout } from "@/lib/lockout";
import { MONTHLY_PRICE, maybeGrantReferralCredit } from "@/lib/payment";

export type ActionResult = { error: string } | { success: true };

// ── Quests ─────────────────────────────────────────────────────

export async function deployQuest(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdminProfile();

  const title = String(formData.get("title") ?? "").trim();
  const subject = String(formData.get("subject") ?? "PHYSICS");
  const durationMinutes = parseInt(String(formData.get("durationMinutes") ?? ""), 10);
  const xpOverrideRaw = String(formData.get("xpOverride") ?? "").trim();
  const assignScope = String(formData.get("assignScope") ?? "ALL");
  const assignRank = String(formData.get("assignRank") ?? "").trim() || null;
  const assignedToId = String(formData.get("assignedToId") ?? "").trim() || null;
  const scheduledForRaw = String(formData.get("scheduledFor") ?? "").trim();

  if (!title) return { error: "Title is required." };
  if (!durationMinutes || durationMinutes <= 0) return { error: "Duration must be a positive number of minutes." };
  if (assignScope === "RANK" && !assignRank) return { error: "Pick a rank to assign to." };
  if (assignScope === "SPECIFIC_HUNTER" && !assignedToId) return { error: "Pick a hunter to assign to." };

  await prisma.quest.create({
    data: {
      title,
      subject: subject as never,
      durationMinutes,
      xpOverride: xpOverrideRaw ? parseInt(xpOverrideRaw, 10) : null,
      assignScope: assignScope as never,
      assignRank: assignScope === "RANK" ? assignRank : null,
      assignedToId: assignScope === "SPECIFIC_HUNTER" ? assignedToId : null,
      scheduledFor: scheduledForRaw ? new Date(scheduledForRaw) : null,
      createdById: admin.id,
    },
  });

  revalidatePath("/admin/quests");
  return { success: true };
}

export async function deleteQuest(id: string): Promise<ActionResult> {
  await requireAdminProfile();
  await prisma.quest.delete({ where: { id } });
  revalidatePath("/admin/quests");
  return { success: true };
}

// ── Default daily quests ──────────────────────────────────────

export async function addQuestTemplate(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdminProfile();

  const title = String(formData.get("title") ?? "").trim();
  const subject = String(formData.get("subject") ?? "PHYSICS");
  const durationMinutes = parseInt(String(formData.get("durationMinutes") ?? ""), 10);
  const xpOverrideRaw = String(formData.get("xpOverride") ?? "").trim();

  if (!title) return { error: "Title is required." };
  if (!durationMinutes || durationMinutes <= 0) return { error: "Duration must be a positive number of minutes." };

  await prisma.questTemplate.create({
    data: {
      title,
      subject: subject as never,
      durationMinutes,
      xpOverride: xpOverrideRaw ? parseInt(xpOverrideRaw, 10) : null,
      createdById: admin.id,
    },
  });

  revalidatePath("/admin/quests");
  return { success: true };
}

export async function removeQuestTemplate(id: string): Promise<ActionResult> {
  await requireAdminProfile();
  await prisma.questTemplate.delete({ where: { id } });
  revalidatePath("/admin/quests");
  return { success: true };
}

export async function toggleQuestTemplateActive(id: string): Promise<ActionResult> {
  await requireAdminProfile();
  const template = await prisma.questTemplate.findUniqueOrThrow({ where: { id } });
  await prisma.questTemplate.update({ where: { id }, data: { active: !template.active } });
  revalidatePath("/admin/quests");
  return { success: true };
}

// ── Punishment pool ────────────────────────────────────────────

export async function addPunishmentQuest(formData: FormData): Promise<ActionResult> {
  await requireAdminProfile();
  const title = String(formData.get("title") ?? "").trim();
  const durationMinutes = parseInt(String(formData.get("durationMinutes") ?? ""), 10);

  if (!title) return { error: "Title is required." };
  if (!durationMinutes || durationMinutes <= 0) return { error: "Duration must be a positive number of minutes." };

  await prisma.punishmentQuest.create({ data: { title, durationMinutes } });
  revalidatePath("/admin/punishment");
  return { success: true };
}

export async function removePunishmentQuest(id: string): Promise<ActionResult> {
  await requireAdminProfile();
  await prisma.punishmentConfig.updateMany({
    where: { id: 1, fixedPunishmentId: id },
    data: { fixedPunishmentId: null },
  });
  await prisma.punishmentQuest.delete({ where: { id } });
  revalidatePath("/admin/punishment");
  return { success: true };
}

export async function setPunishmentMode(mode: "RANDOM" | "FIXED", fixedPunishmentId?: string): Promise<ActionResult> {
  await requireAdminProfile();
  await prisma.punishmentConfig.upsert({
    where: { id: 1 },
    create: { id: 1, mode, fixedPunishmentId: fixedPunishmentId ?? null },
    update: { mode, fixedPunishmentId: mode === "FIXED" ? (fixedPunishmentId ?? null) : null },
  });
  revalidatePath("/admin/punishment");
  return { success: true };
}

// ── Hunters ────────────────────────────────────────────────────

export async function adjustHunterXp(profileId: string, xp: number): Promise<ActionResult> {
  await requireAdminProfile();
  if (xp < 0) return { error: "XP can't be negative." };
  await prisma.profile.update({ where: { id: profileId }, data: { xp } });
  revalidatePath("/admin/hunters");
  return { success: true };
}

export async function resetHunterStreak(profileId: string): Promise<ActionResult> {
  await requireAdminProfile();
  await prisma.profile.update({ where: { id: profileId }, data: { streak: 0 } });
  revalidatePath("/admin/hunters");
  return { success: true };
}

export async function toggleHunterLock(profileId: string): Promise<ActionResult> {
  await requireAdminProfile();
  const profile = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });

  if (profile.locked) {
    await prisma.profile.update({ where: { id: profileId }, data: { locked: false } });
    await prisma.lockoutEvent.updateMany({
      where: { profileId, resolved: false },
      data: { resolved: true, unlockedAt: new Date() },
    });
  } else {
    // Manually locking mirrors the automatic flow: bump the lockout cursor
    // forward (see checkAndApplyLockout) so the lazy check doesn't also fire
    // for whatever quest triggered this, then apply the same lock+assign
    // logic an automatic penalty would.
    await checkAndApplyLockout(profile);
    const after = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
    if (!after.locked) {
      // No missed quest for the lazy check to find — lock directly.
      const pool = await prisma.punishmentQuest.findMany();
      const punishment = pool[Math.floor(Math.random() * pool.length)];
      await prisma.$transaction([
        prisma.profile.update({ where: { id: profileId }, data: { locked: true, streak: 0 } }),
        prisma.lockoutEvent.create({
          data: { profileId, reason: "Manually locked by admin", punishmentQuestId: punishment?.id },
        }),
      ]);
    }
  }

  revalidatePath("/admin/hunters");
  return { success: true };
}

export async function getHunterQuestHistory(profileId: string) {
  await requireAdminProfile();
  return prisma.questCompletion.findMany({
    where: { profileId },
    include: { quest: true },
    orderBy: { completedAt: "desc" },
    take: 10,
  });
}

// ── Manual UPI payment review ─────────────────────────────────────

export async function approvePayment(transactionId: string): Promise<ActionResult> {
  await requireAdminProfile();

  const tx = await prisma.paymentTransaction.findUnique({
    where: { id: transactionId },
    include: { profile: true },
  });
  if (!tx || tx.status !== "PENDING_REVIEW") return { error: "This payment is no longer pending." };

  const isFirstActivation = tx.profile.subscriptionRenewsAt === null;
  const creditToApply = Math.min(
    tx.profile.walletCredit,
    Math.max(0, MONTHLY_PRICE - tx.amount),
  );

  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + 1);

  await prisma.$transaction([
    prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: { status: "SUCCESS", reviewedAt: new Date() },
    }),
    prisma.profile.update({
      where: { id: tx.profileId },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionRenewsAt: renewsAt,
        walletCredit: { decrement: creditToApply },
      },
    }),
    ...(creditToApply > 0
      ? [
          prisma.walletTransaction.create({
            data: {
              profileId: tx.profileId,
              amount: -creditToApply,
              kind: "BILL_APPLIED" as const,
              description: "Applied to subscription renewal",
            },
          }),
        ]
      : []),
    prisma.notification.create({
      data: {
        profileId: tx.profileId,
        type: "WALLET",
        title: "Payment verified",
        message: "Your ₹99 payment was verified — Hunter Access is unlocked.",
      },
    }),
  ]);

  if (isFirstActivation) await maybeGrantReferralCredit(tx.profileId);

  revalidatePath("/admin/billing");
  return { success: true };
}

export async function rejectPayment(transactionId: string, note?: string): Promise<ActionResult> {
  await requireAdminProfile();

  const tx = await prisma.paymentTransaction.findUnique({ where: { id: transactionId } });
  if (!tx || tx.status !== "PENDING_REVIEW") return { error: "This payment is no longer pending." };

  await prisma.$transaction([
    prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: { status: "FAILED", reviewedAt: new Date(), rejectionNote: note ?? null },
    }),
    prisma.notification.create({
      data: {
        profileId: tx.profileId,
        type: "WALLET",
        title: "Payment couldn't be verified",
        message: note
          ? `We couldn't verify your payment: ${note}. Please try again or contact support.`
          : "We couldn't verify your payment reference. Please try again or contact support.",
      },
    }),
  ]);

  revalidatePath("/admin/billing");
  return { success: true };
}
