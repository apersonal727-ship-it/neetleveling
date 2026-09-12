import { prisma } from "@/lib/prisma";
import { getLevelProgress, rankForLevel } from "@/lib/rank";

const MONTHLY_PRICE = 99;

// "Credited" here means this recruit has paid at least once — subscription
// status only ever moves off PENDING via a successful payment, and that
// first payment is exactly the moment maybeGrantReferralCredit (payment.ts)
// fires — so it's a reliable stand-in for "did this recruit earn me ₹20"
// without needing to string-match WalletTransaction descriptions.
export async function getReferralData(profileId: string, referralCode: string) {
  const recruits = await prisma.profile.findMany({
    where: { referredByCode: referralCode },
    select: { name: true, xp: true, subscriptionStatus: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const withRank = recruits.map((r) => {
    const progress = getLevelProgress(r.xp);
    const rank = rankForLevel(progress.level);
    return {
      name: r.name,
      rankCode: rank.code,
      level: progress.level,
      credited: r.subscriptionStatus !== "PENDING",
    };
  });

  const credited = withRank.filter((r) => r.credited).length;

  return {
    recruits: withRank,
    invited: withRank.length,
    credited,
    notYetJoined: withRank.length - credited,
  };
}

export async function getWithdrawalHistory(profileId: string) {
  return prisma.withdrawalRequest.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

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
