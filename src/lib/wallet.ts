import { prisma } from "@/lib/prisma";

const MONTHLY_PRICE = 99;

export async function getWalletData(profileId: string) {
  const [profile, transactions, pendingWithdrawal] = await Promise.all([
    prisma.profile.findUniqueOrThrow({ where: { id: profileId } }),
    prisma.walletTransaction.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.withdrawalRequest.findFirst({
      where: { profileId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const dueNextBill = Math.max(0, MONTHLY_PRICE - profile.walletCredit);

  return {
    balance: profile.walletCredit,
    referralCode: profile.referralCode,
    subscriptionRenewsAt: profile.subscriptionRenewsAt,
    dueNextBill,
    transactions,
    pendingWithdrawal,
  };
}
