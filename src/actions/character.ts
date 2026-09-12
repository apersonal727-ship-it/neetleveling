"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateHunterId, generateReferralCode } from "@/lib/hunter-id";

export type ActionResult = { error: string } | { success: true };

export async function updateCharacter(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const hunterClass = String(formData.get("hunterClass") ?? "Scholar");

  if (!name) return { error: "Pick a Hunter Name." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You need to be logged in to do this." };

  const existing = await prisma.profile.findUnique({ where: { authUserId: user.id } });

  if (existing) {
    await prisma.profile.update({
      where: { authUserId: user.id },
      data: { name, hunterClass },
    });
  } else {
    // Recovery path: the Supabase auth user exists but its Profile row
    // never got created (e.g. signup's prisma.profile.create failed on a
    // transient error). Without this, the hunter would be stuck here
    // forever — getCurrentProfile() keeps sending them back to
    // character-creation, and the plain .update() above would keep
    // throwing "record not found" on every retry.
    if (!user.email) return { error: "Your account has no email on file. Please contact support." };
    const [hunterId, referralCode] = await Promise.all([generateHunterId(), generateReferralCode()]);
    await prisma.profile.create({
      data: { authUserId: user.id, email: user.email, name, hunterClass, hunterId, referralCode },
    });
  }

  redirect("/onboarding");
}
