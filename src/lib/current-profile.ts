import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkAndApplyLockout } from "@/lib/lockout";

// Fetches the signed-in hunter's Profile and lazily evaluates whether a
// prior day's quest window closed unstarted (see checkAndApplyLockout).
// Does NOT redirect based on `locked` — callers decide what that means for
// their route (the app shell redirects to /locked, but /locked and
// /focus-lock need to keep rendering for a locked hunter).
export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let profile = await prisma.profile.findUnique({
    where: { authUserId: user.id },
  });

  if (!profile) redirect("/character-creation");

  await checkAndApplyLockout(profile.id);
  profile = await prisma.profile.findUniqueOrThrow({ where: { id: profile.id } });

  return profile;
}

export async function requireAdminProfile() {
  const profile = await getCurrentProfile();
  if (!profile.isAdmin) redirect("/dashboard");
  return profile;
}
