"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { MONTHLY_PRICE, maybeGrantReferralCredit } from "@/lib/payment";
import { createCashfreeOrder } from "@/lib/cashfree";
import { SITE_URL } from "@/lib/site";

export type ActionResult = { error: string } | { success: true };

export async function initiatePayment(): Promise<ActionResult & { paymentSessionId?: string }> {
  const profile = await getCurrentProfile();

  const creditToApply = Math.min(profile.walletCredit, MONTHLY_PRICE);
  const amountDue = MONTHLY_PRICE - creditToApply;

  if (amountDue <= 0) {
    const isFirstActivation = profile.subscriptionRenewsAt === null;
    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);
    await prisma.$transaction([
      prisma.profile.update({
        where: { id: profile.id },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionRenewsAt: renewsAt,
          walletCredit: { decrement: creditToApply },
        },
      }),
      prisma.walletTransaction.create({
        data: {
          profileId: profile.id,
          amount: -creditToApply,
          kind: "BILL_APPLIED",
          description: "Applied to subscription renewal",
        },
      }),
    ]);
    if (isFirstActivation) await maybeGrantReferralCredit(profile.id);
    redirect("/dashboard");
  }

  const tx = await prisma.paymentTransaction.create({
    data: { profileId: profile.id, amount: amountDue, status: "PENDING", method: "UPI" },
  });

  try {
    const baseUrl = process.env.NODE_ENV === "development" ? "http://localhost:3000" : SITE_URL;
    const order = await createCashfreeOrder({
      orderId: tx.id,
      amount: amountDue,
      customerId: profile.id,
      customerEmail: profile.email,
      customerName: profile.name,
      returnUrl: `${baseUrl}/checkout?order_id={order_id}`,
      notifyUrl: `${baseUrl}/api/webhooks/cashfree`,
    });

    await prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: { cashfreeOrderId: order.order_id, paymentSessionId: order.payment_session_id },
    });

    return { success: true, paymentSessionId: order.payment_session_id };
  } catch (err) {
    console.error("Cashfree order creation failed:", err);
    await prisma.paymentTransaction.update({ where: { id: tx.id }, data: { status: "FAILED" } });
    return { error: "Couldn't start the payment right now. Please try again." };
  }
}

// Manual UPI flow — active until Cashfree issues live API keys, see note in
// src/lib/payment.ts. Swap the checkout page back to initiatePayment() above
// once that happens.
export async function submitUpiPayment(formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();

  const reference = String(formData.get("reference") ?? "").trim();
  if (!reference) return { error: "Enter the UPI transaction reference (UTR) number." };
  if (reference.length < 6) return { error: "That doesn't look like a valid reference number." };

  const existingPending = await prisma.paymentTransaction.findFirst({
    where: { profileId: profile.id, status: "PENDING_REVIEW" },
  });
  if (existingPending) return { error: "You already have a payment awaiting verification." };

  const creditToApply = Math.min(profile.walletCredit, MONTHLY_PRICE);
  const amountDue = MONTHLY_PRICE - creditToApply;

  await prisma.paymentTransaction.create({
    data: {
      profileId: profile.id,
      amount: amountDue,
      status: "PENDING_REVIEW",
      method: "UPI",
      reference,
    },
  });

  const admins = await prisma.profile.findMany({ where: { isAdmin: true }, select: { id: true } });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        profileId: admin.id,
        type: "SYSTEM" as const,
        title: "Payment awaiting verification",
        message: `${profile.name} submitted ₹${amountDue} (UTR: ${reference}) — review it in Admin → Billing.`,
      })),
    });
  }

  redirect("/checkout");
}
