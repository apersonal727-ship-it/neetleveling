"use server";

import { getCurrentProfile } from "@/lib/current-profile";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type ActionResult = { error: string } | { success: true };

export async function updateHunterName(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Hunter name can't be empty." };

  const profile = await getCurrentProfile();
  await prisma.profile.update({ where: { id: profile.id }, data: { name } });
  return { success: true };
}

export async function updateAura(auraColor: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  await prisma.profile.update({ where: { id: profile.id }, data: { auraColor } });
  return { success: true };
}

export async function updateClass(hunterClass: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  await prisma.profile.update({ where: { id: profile.id }, data: { hunterClass } });
  return { success: true };
}

export async function updateNotificationPref(
  key: "questReminders" | "streakWarnings" | "penaltyAlerts",
  value: boolean,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  await prisma.profile.update({ where: { id: profile.id }, data: { [key]: value } });
  return { success: true };
}

export async function cancelSubscription(): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  await prisma.profile.update({
    where: { id: profile.id },
    data: { subscriptionStatus: "CANCELED" },
  });
  return { success: true };
}

export type DeletionResult = { error: string } | { success: true; scheduledFor: string };

export async function requestAccountDeletion(formData: FormData): Promise<DeletionResult> {
  const confirmName = String(formData.get("confirmName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const profile = await getCurrentProfile();
  if (confirmName !== profile.name) return { error: "Name doesn't match." };
  if (!password) return { error: "Enter your password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });
  if (error) return { error: "Incorrect password." };

  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + 14);

  await prisma.profile.update({
    where: { id: profile.id },
    data: { deletionScheduledFor: scheduledFor },
  });

  return { success: true, scheduledFor: scheduledFor.toISOString() };
}
