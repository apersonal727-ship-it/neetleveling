"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/current-profile";
import { requireAdminSession } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { WITHDRAWAL_MIN_BALANCE } from "@/lib/wallet-constants";

export type WalletResult = { error: string } | { success: true };

const QR_BUCKET = "withdrawal-qr-codes";
const MAX_QR_BYTES = 5 * 1024 * 1024;

// Uploads to a Supabase Storage bucket named "withdrawal-qr-codes" — create
// it in the Supabase dashboard (Storage → New bucket, public) plus an
// authenticated-insert policy, same as report-screenshots, before this can
// succeed.
export async function uploadWithdrawalQrCode(
  file: File,
): Promise<{ error: string } | { url: string }> {
  const profile = await getCurrentProfile();

  if (!file || file.size === 0) return { error: "No file provided." };
  if (file.size > MAX_QR_BYTES) return { error: "QR code image must be under 5MB." };
  if (!file.type.startsWith("image/")) return { error: "Only image files are supported." };

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${profile.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(QR_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { error: `Couldn't upload QR code: ${uploadError.message}` };
  }

  const { data } = supabase.storage.from(QR_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

// Manual cash-out request — no payout API involved. This just records the
// request (with the hunter's name + their uploaded UPI QR code) and zeroes
// out the withdrawn amount from wallet credit immediately (so it can't
// also be applied to a bill); an admin scans the QR code and pays the
// hunter by hand outside the system, then marks it PAID in
// /admin/withdrawals (see markWithdrawalPaid below).
export async function requestWithdrawal(formData: FormData): Promise<WalletResult> {
  const profile = await getCurrentProfile();

  const payeeName = String(formData.get("payeeName") ?? "").trim();
  const qrCodeUrl = String(formData.get("qrCodeUrl") ?? "").trim();

  if (!payeeName) return { error: "Enter the name on your UPI account." };
  if (!qrCodeUrl) return { error: "Upload your UPI QR code to continue." };

  const amount = profile.walletCredit;
  if (amount < WITHDRAWAL_MIN_BALANCE) {
    return { error: `You need at least ₹${WITHDRAWAL_MIN_BALANCE} to withdraw.` };
  }

  const existingPending = await prisma.withdrawalRequest.findFirst({
    where: { profileId: profile.id, status: "PENDING" },
  });
  if (existingPending) return { error: "You already have a withdrawal request pending." };

  await prisma.$transaction([
    prisma.withdrawalRequest.create({ data: { profileId: profile.id, amount, payeeName, qrCodeUrl } }),
    prisma.walletTransaction.create({
      data: {
        profileId: profile.id,
        amount: -amount,
        kind: "WITHDRAWAL_REQUESTED",
        description: `Withdrawal requested — ₹${amount} to ${payeeName}`,
      },
    }),
    prisma.profile.update({ where: { id: profile.id }, data: { walletCredit: { decrement: amount } } }),
  ]);

  revalidatePath("/wallet");
  return { success: true };
}

// ── Admin fulfillment ─────────────────────────────────────────────

export async function markWithdrawalPaid(id: string): Promise<WalletResult> {
  await requireAdminSession();

  await prisma.withdrawalRequest.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });

  revalidatePath("/admin/withdrawals");
  return { success: true };
}
