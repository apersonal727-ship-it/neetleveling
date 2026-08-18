import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { questSubjectLabel } from "@/lib/todays-quest";
import { penaltyReps, penaltyDurationMinutes } from "@/lib/penalty";
import { FocusLockView } from "@/components/focus-lock/FocusLockView";

export const metadata: Metadata = {
  title: "Focus Lock — NEETLeveling",
};

export default async function FocusLockPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const { sessionId } = await searchParams;
  const profile = await getCurrentProfile();

  if (!sessionId) redirect("/dashboard");

  const session = await prisma.questSession.findUnique({
    where: { id: sessionId },
    include: { quest: true, punishmentQuest: true },
  });

  if (!session || session.profileId !== profile.id) redirect("/dashboard");
  if (session.status !== "ACTIVE") {
    redirect(session.kind === "PUNISHMENT" ? "/locked" : "/dashboard");
  }

  const isPunishment = session.kind === "PUNISHMENT";
  const title = isPunishment
    ? `${penaltyReps(profile.penaltyStreak)} ${session.punishmentQuest!.title}`
    : session.quest!.title;
  const durationMinutes = isPunishment
    ? penaltyDurationMinutes(profile.penaltyStreak)
    : session.quest!.durationMinutes;
  const category = isPunishment ? "Punishment Quest" : questSubjectLabel(session.quest!.subject);
  const xpAwarded = isPunishment
    ? 0
    : (session.quest!.xpOverride ?? Math.round(session.quest!.durationMinutes * 0.67));

  return (
    <FocusLockView
      sessionId={session.id}
      isPunishment={isPunishment}
      title={title}
      category={category}
      durationSeconds={durationMinutes * 60}
      startedAt={session.startedAt.toISOString()}
      xpAwarded={xpAwarded}
      streak={profile.streak}
    />
  );
}
