import { prisma } from "@/lib/prisma";
import type { Profile } from "@/generated/prisma/client";

const REMINDER_WINDOW_DAYS = 2;

// Lazily evaluates a hunter's subscription lifecycle — same no-cron pattern
// as checkAndApplyLockout and ensureDailyQuestsDeployed, run on every
// request via getCurrentProfile(). Since there's no auto-billing yet
// (Cashfree Autopay isn't live), a lapsed renewal date would otherwise sit
// on an ACTIVE profile forever with nothing to actually enforce it — this
// is what flips status to EXPIRED so the (app) layout's gate locks them
// out until they pay again, and reminds them a couple days beforehand.
export async function checkSubscriptionStatus(profile: Profile) {
  const profileId = profile.id;

  if (profile.subscriptionStatus !== "ACTIVE" || !profile.subscriptionRenewsAt) return;

  const now = Date.now();
  const renewsAt = profile.subscriptionRenewsAt.getTime();

  if (renewsAt < now) {
    await prisma.profile.update({
      where: { id: profileId },
      data: { subscriptionStatus: "EXPIRED" },
    });
    return;
  }

  const daysUntilRenewal = (renewsAt - now) / 86_400_000;
  const alreadyReminded = profile.renewalReminderSentAt?.getTime() === renewsAt;

  if (daysUntilRenewal <= REMINDER_WINDOW_DAYS && !alreadyReminded) {
    await prisma.$transaction([
      prisma.profile.update({
        where: { id: profileId },
        data: { renewalReminderSentAt: profile.subscriptionRenewsAt },
      }),
      prisma.notification.create({
        data: {
          profileId,
          type: "SYSTEM",
          title: "Your subscription renews soon",
          message: `Hunter Access renews on ${profile.subscriptionRenewsAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — pay before then to avoid losing access.`,
        },
      }),
    ]);
  }
}
