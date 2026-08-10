import { prisma } from "@/lib/prisma";

const PRICE = 99;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getOverviewMetrics() {
  const [activeCount, canceledCount, expiredCount, totalProfiles] = await Promise.all([
    prisma.profile.count({ where: { subscriptionStatus: "ACTIVE" } }),
    prisma.profile.count({ where: { subscriptionStatus: "CANCELED" } }),
    prisma.profile.count({ where: { subscriptionStatus: "EXPIRED" } }),
    prisma.profile.count(),
  ]);

  const lapsedEver = canceledCount + expiredCount;
  const everSubscribed = activeCount + lapsedEver;
  const churnRate = everSubscribed > 0 ? Math.round((lapsedEver / everSubscribed) * 1000) / 10 : 0;

  const today = startOfDay(new Date());
  const [activeToday1, activeToday2] = await Promise.all([
    prisma.questCompletion.findMany({ where: { completedAt: { gte: today } }, select: { profileId: true } }),
    prisma.questSession.findMany({ where: { startedAt: { gte: today } }, select: { profileId: true } }),
  ]);
  const dau = new Set([...activeToday1.map((c) => c.profileId), ...activeToday2.map((s) => s.profileId)]).size;

  return {
    mrr: activeCount * PRICE,
    activeSubscribers: activeCount,
    churnRate,
    dau,
    totalProfiles,
  };
}

export async function getRevenueByMonth(months = 6) {
  const now = new Date();
  const results: { label: string; value: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const sum = await prisma.paymentTransaction.aggregate({
      where: { status: "SUCCESS", createdAt: { gte: start, lt: end } },
      _sum: { amount: true },
    });
    results.push({
      label: start.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      value: sum._sum.amount ?? 0,
    });
  }

  return results;
}

export async function getCompletionRateTrend(days = 30) {
  const today = startOfDay(new Date());
  const results: number[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(today);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [assigned, completed] = await Promise.all([
      prisma.quest.count({ where: { createdAt: { gte: dayStart, lt: dayEnd }, scheduledFor: null } }),
      prisma.questCompletion.count({ where: { completedAt: { gte: dayStart, lt: dayEnd } } }),
    ]);

    results.push(assigned > 0 ? Math.min(100, Math.round((completed / assigned) * 100)) : 0);
  }

  return results;
}

export async function getSignupFunnel() {
  const totalProfiles = await prisma.profile.count();
  const everUnlocked = await prisma.profile.count({
    where: { subscriptionStatus: { in: ["ACTIVE", "CANCELED", "EXPIRED"] } },
  });

  const profiles = await prisma.profile.findMany({ select: { id: true, createdAt: true } });
  let activeAfter7d = 0;
  for (const p of profiles) {
    const weekLater = new Date(p.createdAt);
    weekLater.setDate(weekLater.getDate() + 7);
    const hasActivity = await prisma.questCompletion.findFirst({
      where: { profileId: p.id, completedAt: { gte: p.createdAt, lte: weekLater } },
      select: { id: true },
    });
    if (hasActivity) activeAfter7d += 1;
  }

  return [
    { label: "Created profile", value: totalProfiles, pct: 100 },
    {
      label: "Paid & unlocked",
      value: everUnlocked,
      pct: totalProfiles > 0 ? Math.round((everUnlocked / totalProfiles) * 100) : 0,
    },
    {
      label: "Active within 7 days",
      value: activeAfter7d,
      pct: totalProfiles > 0 ? Math.round((activeAfter7d / totalProfiles) * 100) : 0,
    },
  ];
}
