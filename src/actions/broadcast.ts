"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { rankForLevel, getLevelProgress } from "@/lib/rank";

export type Audience = "all" | "active" | "locked" | "e" | "d" | "c" | "b" | "a" | "s";

export async function getAudienceReach(audience: Audience): Promise<number> {
  await requireAdminProfile();

  if (audience === "all") return prisma.profile.count();
  if (audience === "active") return prisma.profile.count({ where: { subscriptionStatus: "ACTIVE" } });
  if (audience === "locked") return prisma.profile.count({ where: { locked: true } });

  // Rank filters require deriving level from xp per-profile — pull minimal
  // fields and filter in memory rather than a raw SQL rank expression.
  const profiles = await prisma.profile.findMany({ select: { xp: true } });
  const rankCode = audience.toUpperCase();
  return profiles.filter((p) => rankForLevel(getLevelProgress(p.xp).level).code === rankCode).length;
}

export type BroadcastResult = { error: string } | { success: true; sentCount: number };

export async function sendBroadcast(formData: FormData): Promise<BroadcastResult> {
  await requireAdminProfile();

  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const audience = String(formData.get("audience") ?? "all") as Audience;

  if (!title) return { error: "Title is required." };
  if (!message) return { error: "Message is required." };

  let profileIds: string[];
  if (audience === "all") {
    profileIds = (await prisma.profile.findMany({ select: { id: true } })).map((p) => p.id);
  } else if (audience === "active") {
    profileIds = (
      await prisma.profile.findMany({ where: { subscriptionStatus: "ACTIVE" }, select: { id: true } })
    ).map((p) => p.id);
  } else if (audience === "locked") {
    profileIds = (await prisma.profile.findMany({ where: { locked: true }, select: { id: true } })).map(
      (p) => p.id,
    );
  } else {
    const rankCode = audience.toUpperCase();
    const all = await prisma.profile.findMany({ select: { id: true, xp: true } });
    profileIds = all
      .filter((p) => rankForLevel(getLevelProgress(p.xp).level).code === rankCode)
      .map((p) => p.id);
  }

  await prisma.$transaction([
    ...profileIds.map((profileId) =>
      prisma.notification.create({
        data: { profileId, type: "SYSTEM", title, message },
      }),
    ),
    prisma.broadcast.create({
      data: { title, message, audience, sentCount: profileIds.length },
    }),
  ]);

  revalidatePath("/admin/broadcast");
  return { success: true, sentCount: profileIds.length };
}
