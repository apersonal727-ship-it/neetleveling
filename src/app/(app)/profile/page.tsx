import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress, rankForLevel, RANKS, RANK_FLAVOR, type RankCode } from "@/lib/rank";
import { getHunterProgressStats } from "@/lib/stats";
import { prisma } from "@/lib/prisma";
import { ProfileView, type ProfileViewData } from "@/components/profile/ProfileView";

export const metadata: Metadata = {
  title: "Profile — NEETLeveling",
};

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  const progress = getLevelProgress(profile.xp);
  const rank = rankForLevel(progress.level);
  const pct = progress.xpForLevel > 0 ? (progress.xpInLevel / progress.xpForLevel) * 100 : 100;

  const [hunterStats, questsCompleted, penaltiesTriggered] = await Promise.all([
    getHunterProgressStats(profile.id),
    prisma.questCompletion.count({ where: { profileId: profile.id } }),
    prisma.lockoutEvent.count({ where: { profileId: profile.id } }),
  ]);

  const rankIndex = RANKS.findIndex((r) => r.code === rank.code);
  const nextRank = RANKS[rankIndex + 1];

  const data: ProfileViewData = {
    name: profile.name,
    rankCode: rank.code,
    rankTitle: rank.title,
    targetExamYear: profile.targetExamYear,
    level: progress.level,
    xpInLevel: progress.xpInLevel,
    xpForLevel: progress.xpForLevel,
    xpPct: pct,
    info: {
      location: profile.location,
      coaching: profile.coaching,
      attemptStatus: profile.attemptStatus,
      since: profile.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }),
    },
    stats: [
      { key: "xp", icon: "xp", value: profile.xp, label: "Total XP" },
      { key: "class", icon: "class", value: hunterStats.classHours, label: "Class Hours" },
      { key: "question", icon: "question", value: hunterStats.questionHours, label: "Question Hours" },
      { key: "solved", icon: "solved", value: hunterStats.questionsSolved, label: "Questions Solved" },
      { key: "streak", icon: "streak", value: profile.streak, label: "Current Streak", lit: profile.streak > 0 },
      { key: "best", icon: "best", value: profile.bestStreak, label: "Best Streak" },
      { key: "quests", icon: "quests", value: questsCompleted, label: "Quests Completed" },
      { key: "penalty", icon: "penalty", value: penaltiesTriggered, label: "Penalties Triggered" },
    ],
    journey: {
      pct: Math.round((rankIndex / (RANKS.length - 1)) * 100),
      clearedRanks: rankIndex,
      totalRanks: RANKS.length,
      levelsToNext: nextRank ? Math.max(0, nextRank.minLevel - progress.level) : 0,
      nextRankCode: nextRank?.code ?? null,
    },
    timeline: RANKS.map((r) => ({
      code: r.code,
      title: r.title,
      sub: r.code === "E" ? "Everyone starts here." : (RANK_FLAVOR[r.code as RankCode] ?? ""),
      state: r.code === rank.code ? "current" : r.minLevel <= progress.level ? "achieved" : "locked",
    })),
    fillPct: (rankIndex / RANKS.length) * 100,
    share: {
      name: profile.name,
      rankCode: rank.code,
      rankTitle: rank.title,
      level: progress.level,
      xp: profile.xp,
      streak: profile.streak,
      questsCompleted,
      questionsSolved: hunterStats.questionsSolved,
      targetExamYear: profile.targetExamYear,
    },
  };

  return <ProfileView data={data} />;
}
