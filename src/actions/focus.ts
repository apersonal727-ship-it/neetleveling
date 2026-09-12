"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { maybeIncrementStreak } from "@/lib/streaks";
import { penaltyDurationMinutes } from "@/lib/penalty";
import { isPracticeQuest, practiceQuestDurationMinutes } from "@/lib/progressive-overload";
import { getLevelProgress, rankForLevel } from "@/lib/rank";
import { getOpenMandatoryQuests } from "@/lib/open-quests";

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

export async function startPunishmentSession(punishmentQuestId: string) {
  const profile = await getCurrentProfile();

  const existing = await prisma.questSession.findFirst({
    where: { profileId: profile.id, kind: "PUNISHMENT", punishmentQuestId, status: "ACTIVE" },
  });
  if (existing) redirect(`/focus-lock?sessionId=${existing.id}`);

  const lockoutEvent = await prisma.lockoutEvent.findFirst({
    where: { profileId: profile.id, resolved: false },
    orderBy: { lockedAt: "desc" },
    include: { punishments: true },
  });
  const target = lockoutEvent?.punishments.find(
    (p) => p.punishmentQuestId === punishmentQuestId && !p.completed,
  );
  if (!target) redirect("/locked");

  const session = await prisma.questSession.create({
    data: { profileId: profile.id, kind: "PUNISHMENT", punishmentQuestId },
  });

  redirect(`/focus-lock?sessionId=${session.id}`);
}

export async function startPersonalQuestSession(personalQuestId: string) {
  const profile = await getCurrentProfile();

  const existing = await prisma.questSession.findFirst({
    where: { profileId: profile.id, kind: "PERSONAL", personalQuestId, status: "ACTIVE" },
  });
  if (existing) redirect(`/focus-lock?sessionId=${existing.id}`);

  const quest = await prisma.personalQuest.findUniqueOrThrow({ where: { id: personalQuestId } });
  if (quest.profileId !== profile.id) redirect("/dashboard");

  const session = await prisma.questSession.create({
    data: { profileId: profile.id, kind: "PERSONAL", personalQuestId: quest.id },
  });

  redirect(`/focus-lock?sessionId=${session.id}`);
}

export type CompleteResult =
  | { error: string }
  | {
      success: true;
      xpAwarded: number;
      streak: number;
      leveledUp: boolean;
      newLevel: number;
      rankedUp: boolean;
      fromRank: string;
      dayCleared: boolean;
    };

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

  const durationMinutes = isPracticeQuest(session.quest.title)
    ? practiceQuestDurationMinutes(profile.streak, session.quest.subject)
    : session.quest.durationMinutes;

  const elapsedMs = Date.now() - session.startedAt.getTime();
  const requiredMs = durationMinutes * 60 * 1000;
  if (elapsedMs < requiredMs) {
    return { error: "The timer hasn't finished yet." };
  }

  const xpAwarded =
    session.quest.xpOverride ?? Math.round(session.quest.durationMinutes * 0.67);

  const beforeProgress = getLevelProgress(profile.xp);

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

  const afterProgress = getLevelProgress(updated.xp);
  const fromRank = rankForLevel(beforeProgress.level).code;
  const toRank = rankForLevel(afterProgress.level).code;

  const openQuests = await getOpenMandatoryQuests(profile.id, afterProgress.level, updated.streak);

  return {
    success: true,
    xpAwarded,
    streak: updated.streak,
    leveledUp: afterProgress.level > beforeProgress.level,
    newLevel: afterProgress.level,
    rankedUp: toRank !== fromRank,
    fromRank,
    dayCleared: openQuests.length === 0,
  };
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
  const requiredMs = penaltyDurationMinutes(profile.penaltyStreak) * 60 * 1000;
  if (elapsedMs < requiredMs) {
    return { error: "The timer hasn't finished yet." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.questSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    const lockoutEvent = await tx.lockoutEvent.findFirst({
      where: { profileId: profile.id, resolved: false },
      orderBy: { lockedAt: "desc" },
    });
    if (!lockoutEvent) return;

    await tx.lockoutPunishment.updateMany({
      where: { lockoutEventId: lockoutEvent.id, punishmentQuestId: session.punishmentQuestId!, completed: false },
      data: { completed: true, completedAt: new Date() },
    });

    const remaining = await tx.lockoutPunishment.count({
      where: { lockoutEventId: lockoutEvent.id, completed: false },
    });

    if (remaining === 0) {
      await tx.profile.update({ where: { id: profile.id }, data: { locked: false } });
      await tx.lockoutEvent.update({
        where: { id: lockoutEvent.id },
        data: { resolved: true, unlockedAt: new Date() },
      });
    }
  });

  const rank = rankForLevel(getLevelProgress(profile.xp).level).code;
  return {
    success: true,
    xpAwarded: 0,
    streak: 0,
    leveledUp: false,
    newLevel: getLevelProgress(profile.xp).level,
    rankedUp: false,
    fromRank: rank,
    dayCleared: false,
  };
}

// Personal quests are self-tracked with no XP reward (the Quests page copy
// never promises one) — completing one just logs a PersonalQuestCompletion.
export async function completePersonalQuestSession(sessionId: string): Promise<CompleteResult> {
  const profile = await getCurrentProfile();

  const session = await prisma.questSession.findUnique({
    where: { id: sessionId },
    include: { personalQuest: true },
  });

  if (
    !session ||
    session.profileId !== profile.id ||
    session.kind !== "PERSONAL" ||
    !session.personalQuest
  ) {
    return { error: "Session not found." };
  }
  if (session.status !== "ACTIVE") {
    return { error: "This quest is no longer active." };
  }

  const elapsedMs = Date.now() - session.startedAt.getTime();
  const requiredMs = session.personalQuest.durationMinutes * 60 * 1000;
  if (elapsedMs < requiredMs) {
    return { error: "The timer hasn't finished yet." };
  }

  await prisma.$transaction([
    prisma.questSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    prisma.personalQuestCompletion.create({
      data: { personalQuestId: session.personalQuest.id },
    }),
  ]);

  const level = getLevelProgress(profile.xp).level;
  const rank = rankForLevel(level).code;
  const openQuests = await getOpenMandatoryQuests(profile.id, level, profile.streak);

  return {
    success: true,
    xpAwarded: 0,
    streak: profile.streak,
    leveledUp: false,
    newLevel: level,
    rankedUp: false,
    fromRank: rank,
    dayCleared: openQuests.length === 0,
  };
}
