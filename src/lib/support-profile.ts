import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Deliberately NOT getCurrentProfile(). That loader also runs the lockout
// check, deploys the day's quests and evaluates the subscription — all
// writes that can fail or be slow — and the report page is the one way a
// hunter can reach the admin when something else in the app is broken.
// This does the minimum: who is signed in, and which profile is theirs.
export async function getSupportProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { authUserId: user.id },
    select: { id: true },
  });
  if (!profile) redirect("/character-creation");

  return profile;
}
