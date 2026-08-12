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
// Runs on every request, so the lazy checks below are deliberately batched:
// each accepts the already-fetched profile instead of re-querying it, and
// independent checks run via Promise.all instead of sequentially — cuts
// this from ~7 sequential round trips to ~3, which matters a lot given the
// DB is in a different region than most requests.
export async function getCurrentProfile() {
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
}

export async function requireAdminProfile() {
  const profile = await getCurrentProfile();
  if (!profile.isAdmin) redirect("/dashboard");
  return profile;
}
