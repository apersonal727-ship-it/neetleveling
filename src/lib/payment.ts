import { prisma } from "@/lib/prisma";

// Manual UPI collection while Cashfree's live activation is pending — no
// automated verification involved yet. Students pay this VPA directly via
// their UPI app, submit the transaction reference, and an admin verifies +
// activates the subscription from /admin/billing. The Cashfree-based
// automated flow (src/lib/cashfree.ts, initiatePayment in billing.ts,
// /api/webhooks/cashfree) is already built and tested — swap checkout back
// to it once Cashfree issues live API keys.
export const UPI_VPA = "arghyadasidbi@ibl";
export const UPI_PAYEE_NAME = "NEETLeveling";
export const MONTHLY_PRICE = 99;

export function buildUpiLink(amount: number, note: string) {
  const params = new URLSearchParams({
    pa: UPI_VPA,
    pn: UPI_PAYEE_NAME,
    am: String(amount),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

export async function finalizeSuccessfulPayment(cashfreeOrderId: string, cashfreePaymentId: string) {
  const tx = await prisma.paymentTransaction.findUnique({
    where: { cashfreeOrderId },
    include: { profile: true },
  });
  if (!tx || tx.status !== "PENDING") return;

  const creditToApply = Math.min(tx.profile.walletCredit, Math.max(0, MONTHLY_PRICE - tx.amount));
  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + 1);

  await prisma.$transaction([
    prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: { status: "SUCCESS", cashfreePaymentId, reviewedAt: new Date() },
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
        title: "Payment successful",
        message: `Your ₹${tx.amount} payment was verified — Hunter Access is unlocked.`,
      },
    }),
  ]);
}

export async function markFailedPayment(cashfreeOrderId: string) {
  const tx = await prisma.paymentTransaction.findUnique({ where: { cashfreeOrderId } });
  if (!tx || tx.status !== "PENDING") return;
  await prisma.paymentTransaction.update({
    where: { id: tx.id },
    data: { status: "FAILED", reviewedAt: new Date() },
  });
}
