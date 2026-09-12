import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { questSubjectLabel } from "@/lib/todays-quest";
import { penaltyReps, penaltyDurationMinutes } from "@/lib/penalty";
import { isPracticeQuest, practiceQuestDurationMinutes } from "@/lib/progressive-overload";
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
    include: { quest: true, punishmentQuest: true, personalQuest: true },
  });

  if (!session || session.profileId !== profile.id) redirect("/dashboard");
  if (session.status !== "ACTIVE") {
    redirect(session.kind === "PUNISHMENT" ? "/locked" : "/dashboard");
  }

  const isPunishment = session.kind === "PUNISHMENT";
  const isPersonal = session.kind === "PERSONAL";
  const title = isPunishment
    ? `${penaltyReps(profile.penaltyStreak)} ${session.punishmentQuest!.title}`
    : isPersonal
      ? session.personalQuest!.title
      : session.quest!.title;
  const durationMinutes = isPunishment
    ? penaltyDurationMinutes(profile.penaltyStreak)
    : isPersonal
      ? session.personalQuest!.durationMinutes
      : isPracticeQuest(session.quest!.title)
        ? practiceQuestDurationMinutes(profile.streak, session.quest!.subject)
        : session.quest!.durationMinutes;
  const category = isPunishment
    ? "Punishment Quest"
    : isPersonal
      ? "Personal Quest"
      : questSubjectLabel(session.quest!.subject);
  const xpAwarded =
    isPunishment || isPersonal
      ? 0
      : (session.quest!.xpOverride ?? Math.round(session.quest!.durationMinutes * 0.67));

  return (
    <FocusLockView
      sessionId={session.id}
      kind={session.kind}
      title={title}
      category={category}
      subject={isPunishment || isPersonal ? null : session.quest!.subject}
      durationSeconds={durationMinutes * 60}
      startedAt={session.startedAt.toISOString()}
      xpAwarded={xpAwarded}
      streak={profile.streak}
    />
  );
}
