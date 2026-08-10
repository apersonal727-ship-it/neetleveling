"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { maybeIncrementStreak } from "@/lib/streaks";

export async function startQuestSession(questId: string) {
  const profile = await getCurrentProfile();

  const existing = await prisma.questSession.findFirst({
    where: { profileId: profile.id, questId, status: "ACTIVE" },
  });
  if (existing) redirect(`/focus-lock?sessionId=${existing.id}`);

  const quest = await prisma.quest.findUniqueOrThrow({ where: { id: questId } });
  const session = await prisma.questSession.create({
    data: { profileId: profile.id, kind: "QUEST", questId: quest.id },
  });

  redirect(`/focus-lock?sessionId=${session.id}`);
}

export async function startPunishmentSession() {
  const profile = await getCurrentProfile();

  const existing = await prisma.questSession.findFirst({
    where: { profileId: profile.id, kind: "PUNISHMENT", status: "ACTIVE" },
  });
  if (existing) redirect(`/focus-lock?sessionId=${existing.id}`);

  const lockoutEvent = await prisma.lockoutEvent.findFirst({
    where: { profileId: profile.id, resolved: false },
    orderBy: { lockedAt: "desc" },
  });
  if (!lockoutEvent?.punishmentQuestId) redirect("/locked");

  const session = await prisma.questSession.create({
    data: {
      profileId: profile.id,
      kind: "PUNISHMENT",
      punishmentQuestId: lockoutEvent.punishmentQuestId,
    },
  });

  redirect(`/focus-lock?sessionId=${session.id}`);
}

export type CompleteResult =
  | { error: string }
  | { success: true; xpAwarded: number; streak: number };

export async function completeQuestSession(sessionId: string): Promise<CompleteResult> {
  const profile = await getCurrentProfile();

  const session = await prisma.questSession.findUnique({
    where: { id: sessionId },
    include: { quest: true },
  });

  if (!session || session.profileId !== profile.id || session.kind !== "QUEST" || !session.quest) {
    return { error: "Session not found." };
  }
  if (session.status !== "ACTIVE") {
    return { error: "This quest is no longer active." };
  }

  const elapsedMs = Date.now() - session.startedAt.getTime();
  const requiredMs = session.quest.durationMinutes * 60 * 1000;
  if (elapsedMs < requiredMs) {
    return { error: "The timer hasn't finished yet." };
  }

  const xpAwarded =
    session.quest.xpOverride ?? Math.round(session.quest.durationMinutes * 0.67);

  await prisma.$transaction([
    prisma.questSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    prisma.questCompletion.create({
      data: { profileId: profile.id, questId: session.quest.id, xpAwarded },
    }),
    prisma.profile.update({
      where: { id: profile.id },
      data: { xp: { increment: xpAwarded } },
    }),
  ]);

  await maybeIncrementStreak(profile.id);
  const updated = await prisma.profile.findUniqueOrThrow({ where: { id: profile.id } });

  return { success: true, xpAwarded, streak: updated.streak };
}

export async function completePunishmentSession(sessionId: string): Promise<CompleteResult> {
  const profile = await getCurrentProfile();

  const session = await prisma.questSession.findUnique({
    where: { id: sessionId },
    include: { punishmentQuest: true },
  });

  if (
    !session ||
    session.profileId !== profile.id ||
    session.kind !== "PUNISHMENT" ||
    !session.punishmentQuest
  ) {
    return { error: "Session not found." };
  }
  if (session.status !== "ACTIVE") {
    return { error: "This punishment quest is no longer active." };
  }

  const elapsedMs = Date.now() - session.startedAt.getTime();
  const requiredMs = session.punishmentQuest.durationMinutes * 60 * 1000;
  if (elapsedMs < requiredMs) {
    return { error: "The timer hasn't finished yet." };
  }

  await prisma.$transaction([
    prisma.questSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    prisma.profile.update({
      where: { id: profile.id },
      data: { locked: false },
    }),
    prisma.lockoutEvent.updateMany({
      where: { profileId: profile.id, resolved: false },
      data: { resolved: true, unlockedAt: new Date() },
    }),
  ]);

  return { success: true, xpAwarded: 0, streak: 0 };
}
