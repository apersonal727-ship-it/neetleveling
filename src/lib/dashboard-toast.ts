import { prisma } from "@/lib/prisma";
import { questDayStart } from "@/lib/quest-day";

// The dashboard's "[System] ..." toast used to fire on every single page
// load — refresh, revisit, doesn't matter — which is meaningless noise
// once a hunter's already seen it. It should only ever surface for a real
// reason: an admin actually broadcast something since this hunter's last
// visit (see sendBroadcast in @/actions/broadcast), or this genuinely is
// the first visit since the 5 AM IST reset that generated today's quests.
// Profile.lastDashboardSeenAt tracks that boundary — this both decides
// what (if anything) to show and advances the boundary for next time, in
// one call, so a given reason only ever fires once.
export async function getDashboardToastMessage(
  profile: { id: string; lastDashboardSeenAt: Date | null },
  hasQuestsToday: boolean,
): Promise<string | null> {
  const lastSeen = profile.lastDashboardSeenAt;

  const [latestBroadcast] = await Promise.all([
    prisma.notification.findFirst({
      where: {
        profileId: profile.id,
        type: "SYSTEM",
        ...(lastSeen ? { createdAt: { gt: lastSeen } } : {}),
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.profile.update({ where: { id: profile.id }, data: { lastDashboardSeenAt: new Date() } }),
  ]);

  if (latestBroadcast) return latestBroadcast.message;

  const isFirstVisitSinceReset = !lastSeen || lastSeen < questDayStart();
  if (isFirstVisitSinceReset && hasQuestsToday) return "New quest has arrived.";

  return null;
}
