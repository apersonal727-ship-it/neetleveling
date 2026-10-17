import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { RANKS, RANK_FLAVOR, type RankCode } from "@/lib/rank";
import { prisma } from "@/lib/prisma";
import { isRankUnlocked, isRankUpCode, parseData, verifyPass } from "@/lib/rank-up-pass";
import { RankUpCelebration } from "@/components/rank-up/RankUpCelebration";
import { StripPassToken } from "@/components/rank-up/StripPassToken";

export const metadata: Metadata = {
  title: "Rank Up — NEETLeveling",
};

export default async function RankUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ rank: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { rank } = await params;
  const { t } = await searchParams;
  const code = String(rank).toUpperCase();
  if (!isRankUpCode(code)) notFound();

  const profile = await getCurrentProfile();
  // Not reached yet, or no valid pass for this hunter + rank: the page simply doesn't exist.
  if (!isRankUnlocked(profile.xp, code)) notFound();
  const data = parseData(verifyPass(t, profile.id, `rank:${code}`));
  if (!data) notFound();

  const idx = RANKS.findIndex((r) => r.code === code);
  const info = RANKS[idx];
  const questsCleared = await prisma.questCompletion.count({ where: { profileId: profile.id } });

  return (
    <>
      <StripPassToken />
      <RankUpCelebration
        rank={code}
        fromRank={RANKS[idx - 1].code}
        title={info.title}
        flavor={RANK_FLAVOR[code as RankCode] ?? ""}
        hunterName={profile.name}
        level={info.minLevel}
        streak={profile.streak}
        questsCleared={questsCleared}
        totalXp={profile.xp}
        isFirstRankUp={code === "D"}
        rest={data.r}
        dest={data.d}
      />
    </>
  );
}
