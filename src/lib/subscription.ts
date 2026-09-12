import { prisma } from "@/lib/prisma";
import type { Profile } from "@/generated/prisma/client";

const REMINDER_WINDOW_DAYS = 2;
export const STREAK_GRACE_PERIOD_DAYS = 7;

// The instant a profile's access actually lapsed — subscriptionRenewsAt
// still holds that date even after status flips away from ACTIVE (the
// field means "paid through", not "still active"), so it doubles as the
// lapse timestamp for both EXPIRED and a CANCELED subscription past its
// paid-through date. Returns null if the profile isn't actually lapsed.
export function lapsedAt(profile: Profile): Date | null {
  if (!profile.subscriptionRenewsAt) return null;
  const isLapsed =
    profile.subscriptionStatus === "EXPIRED" ||
    (profile.subscriptionStatus === "CANCELED" && profile.subscriptionRenewsAt.getTime() < Date.now());
  return isLapsed ? profile.subscriptionRenewsAt : null;
}

export function streakGraceDeadline(profile: Profile): Date | null {
  const lapse = lapsedAt(profile);
  if (!lapse) return null;
  return new Date(lapse.getTime() + STREAK_GRACE_PERIOD_DAYS * 86_400_000);
}

// Lazily evaluates a hunter's subscription lifecycle — same no-cron pattern
// as checkAndApplyLockout and ensureDailyQuestsDeployed, run on every
// request via getCurrentProfile(). Since there's no auto-billing yet
// (Cashfree Autopay isn't live), a lapsed renewal date would otherwise sit
// on an ACTIVE profile forever with nothing to actually enforce it — this
// is what flips status to EXPIRED so the (app) layout's gate locks them
// out until they pay again, and reminds them a couple days beforehand.
//
// Once lapsed, the streak survives untouched for a 7-day grace window
// (see streakGraceDeadline) — matching the subscription-expired page's own
// promise that progress is "saved exactly as it was" for a limited time,
// not forever — then resets to 0, same as a missed-quest lockout would.
export async function checkSubscriptionStatus(profile: Profile) {
  const profileId = profile.id;

  if (profile.subscriptionStatus === "ACTIVE" && profile.subscriptionRenewsAt) {
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
    return;
  }

  const graceDeadline = streakGraceDeadline(profile);
  if (graceDeadline && profile.streak > 0 && Date.now() > graceDeadline.getTime()) {
    await prisma.profile.update({ where: { id: profileId }, data: { streak: 0 } });
  }
}
