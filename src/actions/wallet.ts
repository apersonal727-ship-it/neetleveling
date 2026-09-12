"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/current-profile";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { WITHDRAWAL_MIN_BALANCE } from "@/lib/wallet-constants";

export type WalletResult = { error: string } | { success: true };

// Manual cash-out request — no payout API involved. This just records the
// request and zeroes out the withdrawn amount from the hunter's wallet
// credit immediately (so it can't also be applied to a bill); an admin
// pays the hunter by hand via UPI outside the system and marks it PAID in
// /admin/withdrawals (see markWithdrawalPaid below).
export async function requestWithdrawal(formData: FormData): Promise<WalletResult> {
  const profile = await getCurrentProfile();

  const upiId = String(formData.get("upiId") ?? "").trim();
  if (!upiId) return { error: "Enter your UPI ID." };
  if (!/^[\w.-]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
    return { error: "Enter a valid UPI ID (e.g. yourname@upi)." };
  }

  const amount = profile.walletCredit;
  if (amount < WITHDRAWAL_MIN_BALANCE) {
    return { error: `You need at least ₹${WITHDRAWAL_MIN_BALANCE} to withdraw.` };
  }

  const existingPending = await prisma.withdrawalRequest.findFirst({
    where: { profileId: profile.id, status: "PENDING" },
  });
  if (existingPending) return { error: "You already have a withdrawal request pending." };

  await prisma.$transaction([
    prisma.withdrawalRequest.create({ data: { profileId: profile.id, amount, upiId } }),
    prisma.walletTransaction.create({
      data: {
        profileId: profile.id,
        amount: -amount,
        kind: "WITHDRAWAL_REQUESTED",
        description: `Withdrawal requested to ${upiId}`,
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
