"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";

export async function markNotificationRead(id: string) {
  const profile = await getCurrentProfile();
  await prisma.notification.updateMany({
    where: { id, profileId: profile.id },
    data: { read: true },
  });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const profile = await getCurrentProfile();
  await prisma.notification.updateMany({
    where: { profileId: profile.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
}
