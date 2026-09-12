import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress, rankForLevel, RANK_FLAVOR, type RankCode } from "@/lib/rank";
import { prisma } from "@/lib/prisma";
import { RankUpCelebration } from "@/components/rank-up/RankUpCelebration";

export const metadata: Metadata = {
  title: "Rank Up — NEETLeveling",
};

export default async function RankUpPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const profile = await getCurrentProfile();
  const progress = getLevelProgress(profile.xp);
  const rank = rankForLevel(progress.level);

  if (!from || from === rank.code || rank.code === "E") redirect("/dashboard");

  const questsCleared = await prisma.questCompletion.count({ where: { profileId: profile.id } });

  return (
    <RankUpCelebration
      rank={rank.code as Exclude<RankCode, "E">}
      fromRank={from}
      title={rank.title}
      flavor={RANK_FLAVOR[rank.code as RankCode] ?? ""}
      hunterName={profile.name}
      level={progress.level}
      streak={profile.streak}
      questsCleared={questsCleared}
      totalXp={profile.xp}
      isFirstRankUp={rank.code === "D"}
    />
  );
}
