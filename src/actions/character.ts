"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type ActionResult = { error: string } | { success: true };

export async function updateCharacter(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const auraColor = String(formData.get("auraColor") ?? "blue");
  const hunterClass = String(formData.get("hunterClass") ?? "Scholar");

  if (!name) return { error: "Pick a Hunter Name." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You need to be logged in to do this." };

  await prisma.profile.update({
    where: { authUserId: user.id },
    data: { name, auraColor, hunterClass },
  });

  redirect("/onboarding");
}
