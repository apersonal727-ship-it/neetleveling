import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkAndApplyLockout } from "@/lib/lockout";
import { ensureDailyQuestsDeployed } from "@/lib/quest-deploy";
import { checkSubscriptionStatus } from "@/lib/subscription";

// Fetches the signed-in hunter's Profile and lazily evaluates whether a
// prior day's quest window closed unstarted (see checkAndApplyLockout).
// Does NOT redirect based on `locked` — callers decide what that means for
// their route (the app shell redirects to /locked, but /locked and
// /focus-lock need to keep rendering for a locked hunter).
//
// Wrapped in React's cache() — most pages call this from both their layout
// and the page itself, and without dedup each of the "check once, then act"
// lazy checks below can run concurrently within the same request and race
// (e.g. two calls both see today's batch as "not yet deployed" and each
// deploy their own copy before the other's write is visible). cache()
// makes every call in one request share a single in-flight execution, so
// the checks only actually run once — this also cuts DB round trips
// further on top of the batching below.
export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profile] = await Promise.all([
    prisma.profile.findUnique({ where: { authUserId: user.id } }),
    ensureDailyQuestsDeployed(),
  ]);

  if (!profile) redirect("/character-creation");

  await Promise.all([checkAndApplyLockout(profile), checkSubscriptionStatus(profile)]);

  return prisma.profile.findUniqueOrThrow({ where: { id: profile.id } });
});

export async function requireAdminProfile() {
  const profile = await getCurrentProfile();
  if (!profile.isAdmin) redirect("/dashboard");
  return profile;
}
