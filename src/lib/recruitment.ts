import { prisma } from "@/lib/prisma";
import type { Profile } from "@/generated/prisma/client";
import { REFERRAL_CREDIT_AMOUNT } from "@/lib/payment";

// Recruit-count thresholds and their one-time XP bonus. The "₹ total"
// shown alongside each tier on the Wallet page is just that threshold
// times the existing REFERRAL_CREDIT_AMOUNT — these tiers don't award any
// wallet credit themselves, only XP; the ₹ was already earned per-referral
// via the ordinary referral-credit mechanic (payment.ts).
export const RECRUITMENT_TIERS = [
  { count: 1, xp: 50 },
  { count: 5, xp: 150 },
  { count: 10, xp: 250 },
  { count: 25, xp: 400 },
  { count: 50, xp: 600 },
  { count: 100, xp: 1000 },
  { count: 200, xp: 1500 },
  { count: 500, xp: 3000 },
  { count: 1000, xp: 6000 },
];

export async function getCreditedReferralCount(referralCode: string) {
  return prisma.profile.count({
    where: { referredByCode: referralCode, subscriptionStatus: { not: "PENDING" } },
  });
}

// Callers should run checkRecruitmentMilestones first so a tier the hunter
// already qualifies for shows as "cleared" here, not a stale "in progress".
export async function getRecruitmentQuestList(profile: Profile) {
  const [creditedCount, claimed] = await Promise.all([
    getCreditedReferralCount(profile.referralCode),
    prisma.recruitmentMilestone.findMany({ where: { profileId: profile.id }, select: { tier: true } }),
  ]);
  const claimedTiers = new Set(claimed.map((c) => c.tier));

  let nextUnclearedShown = false;
  return RECRUITMENT_TIERS.map((t) => {
    const cleared = claimedTiers.has(t.count);
    let status: "cleared" | "progress" | "locked";
    if (cleared) {
      status = "cleared";
    } else if (!nextUnclearedShown) {
      status = "progress";
      nextUnclearedShown = true;
    } else {
      status = "locked";
    }
    return {
      count: t.count,
      xp: t.xp,
      cashTotal: t.count * REFERRAL_CREDIT_AMOUNT,
      status,
      creditedCount,
    };
  });
}

// Lazily evaluated on Wallet page load — same no-cron pattern as
// checkAndApplyLockout/checkSubscriptionStatus. Idempotent via the
// (profileId, tier) unique constraint, so re-running it is always safe.
// Returns the highest newly-claimed tier (for the achievement-unlock
// overlay) or null if nothing new crossed this time.
export async function checkRecruitmentMilestones(profile: Profile) {
  const creditedCount = await getCreditedReferralCount(profile.referralCode);
  const claimed = await prisma.recruitmentMilestone.findMany({
    where: { profileId: profile.id },
    select: { tier: true },
  });
  const claimedTiers = new Set(claimed.map((c) => c.tier));

  const newlyClaimed = RECRUITMENT_TIERS.filter(
    (t) => creditedCount >= t.count && !claimedTiers.has(t.count),
  );
  if (newlyClaimed.length === 0) return null;

  const totalXp = newlyClaimed.reduce((sum, t) => sum + t.xp, 0);

  await prisma.$transaction([
    ...newlyClaimed.map((t) =>
      prisma.recruitmentMilestone.create({
        data: { profileId: profile.id, tier: t.count, xpAwarded: t.xp },
      }),
    ),
    prisma.profile.update({ where: { id: profile.id }, data: { xp: { increment: totalXp } } }),
    ...newlyClaimed.map((t) =>
      prisma.notification.create({
        data: {
          profileId: profile.id,
          type: "WALLET",
          title: "Recruitment Quest Cleared",
          message: `Recruit ${t.count} Hunter${t.count === 1 ? "" : "s"} — +${t.xp} XP awarded.`,
        },
      }),
    ),
  ]);

  const highest = newlyClaimed[newlyClaimed.length - 1];
  return { count: highest.count, xp: highest.xp, cashTotal: highest.count * REFERRAL_CREDIT_AMOUNT };
}
