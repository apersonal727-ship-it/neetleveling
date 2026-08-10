"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type ActionResult = { error: string } | { success: true };

const MONTHLY_PRICE = 99;

// No payment gateway is wired up yet (the blueprint specifies Razorpay, but
// no account/API keys exist for this project). Until that's set up, this
// activates the subscription directly instead of processing a real charge —
// swap in real Razorpay order creation + webhook verification here once keys
// are available; nothing else in the app needs to change.
export async function activateSubscription(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You need to be logged in to do this." };

  const profile = await prisma.profile.findUnique({
    where: { authUserId: user.id },
  });
  if (!profile) return { error: "Profile not found." };

  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + 1);

  const creditToApply = Math.min(profile.walletCredit, MONTHLY_PRICE);

  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profile.id },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionRenewsAt: renewsAt,
        walletCredit: { decrement: creditToApply },
      },
    }),
    prisma.paymentTransaction.create({
      data: {
        profileId: profile.id,
        amount: MONTHLY_PRICE - creditToApply,
        status: "SUCCESS",
        method: "UPI",
      },
    }),
    ...(creditToApply > 0
      ? [
          prisma.walletTransaction.create({
            data: {
              profileId: profile.id,
              amount: -creditToApply,
              kind: "BILL_APPLIED" as const,
              description: "Applied to subscription renewal",
            },
          }),
        ]
      : []),
  ]);

  redirect("/dashboard?new=true");
}
