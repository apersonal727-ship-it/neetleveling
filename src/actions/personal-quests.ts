"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";

export type PersonalQuestResult = { error: string } | { success: true };

export async function addPersonalQuest(formData: FormData): Promise<PersonalQuestResult> {
  const profile = await getCurrentProfile();

  const title = String(formData.get("title") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes"));
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const mandatory = formData.get("mandatory") === "mandatory";
  const frequency = formData.get("frequency") === "daily" ? "DAILY" : "ONCE";

  if (!title) return { error: "Give the quest a name." };
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return { error: "Enter a valid duration in minutes." };
  }

  await prisma.personalQuest.create({
    data: {
      profileId: profile.id,
      title,
      durationMinutes: Math.round(durationMinutes),
      subject,
      mandatory,
      frequency,
    },
  });

  revalidatePath("/quests");
  return { success: true };
}

export async function deletePersonalQuest(personalQuestId: string): Promise<PersonalQuestResult> {
  const profile = await getCurrentProfile();

  const quest = await prisma.personalQuest.findUnique({ where: { id: personalQuestId } });
  if (!quest || quest.profileId !== profile.id) return { error: "Quest not found." };

  await prisma.$transaction([
    prisma.questSession.deleteMany({ where: { personalQuestId } }),
    prisma.personalQuestCompletion.deleteMany({ where: { personalQuestId } }),
    prisma.personalQuest.delete({ where: { id: personalQuestId } }),
  ]);

  revalidatePath("/quests");
  return { success: true };
}
