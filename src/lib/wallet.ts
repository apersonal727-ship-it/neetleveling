import { prisma } from "@/lib/prisma";

const MONTHLY_PRICE = 99;

export async function getWalletData(profileId: string) {
  const profile = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
  const transactions = await prisma.walletTransaction.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const dueNextBill = Math.max(0, MONTHLY_PRICE - profile.walletCredit);

  return {
    balance: profile.walletCredit,
    referralCode: profile.referralCode,
    subscriptionRenewsAt: profile.subscriptionRenewsAt,
    dueNextBill,
    transactions,
  };
}
