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
export const REFERRAL_CREDIT_AMOUNT = 20;

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

  const isFirstActivation = tx.profile.subscriptionRenewsAt === null;
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

  if (isFirstActivation) await maybeGrantReferralCredit(tx.profileId);
}

// Credits the referrer ₹20 the moment a referred hunter completes their
// first-ever subscription activation — never on renewals, never as cash,
// only ever usable toward the referrer's own next bill (regular
// walletCredit). Callers must only invoke this when they've confirmed this
// activation is the profile's first (subscriptionRenewsAt was null right
// before this activation) — checked by the caller since by the time this
// runs, the profile's own subscriptionRenewsAt has usually just been set.
export async function maybeGrantReferralCredit(profileId: string) {
  const profile = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
  if (!profile.referredByCode) return;

  const referrer = await prisma.profile.findUnique({ where: { referralCode: profile.referredByCode } });
  if (!referrer) return;

  await prisma.$transaction([
    prisma.profile.update({
      where: { id: referrer.id },
      data: { walletCredit: { increment: REFERRAL_CREDIT_AMOUNT } },
    }),
    prisma.walletTransaction.create({
      data: {
        profileId: referrer.id,
        amount: REFERRAL_CREDIT_AMOUNT,
        kind: "REFERRAL_CREDIT",
        description: `${profile.name} joined using your referral code`,
      },
    }),
    prisma.notification.create({
      data: {
        profileId: referrer.id,
        type: "WALLET",
        title: "Referral credit earned",
        message: `${profile.name} just subscribed using your code — ₹${REFERRAL_CREDIT_AMOUNT} credit added to your wallet.`,
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
