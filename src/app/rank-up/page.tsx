import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress, rankForLevel, RANK_FLAVOR, type RankCode } from "@/lib/rank";
import { prisma } from "@/lib/prisma";
import styles from "./rank-up.module.css";

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

  if (!from || from === rank.code) redirect("/dashboard");

  const isMax = rank.code === "S";
  const questsCleared = await prisma.questCompletion.count({ where: { profileId: profile.id } });

  return (
    <>
      <div className={styles.bgGrid} />
      <div className={styles.app}>
        <span className={styles.tag}>
          <span className={styles.dot} /> {isMax ? "Maximum Rank" : "Rank Up"}
        </span>

        {isMax && <div className={styles.crown}>👑</div>}

        <div className={styles.transitionLine}>
          <span className={styles.old}>{from}-RANK</span>
          <span className={styles.arrow}>→</span>
          <span className={styles.new}>{rank.code}-RANK</span>
        </div>

        <div className={styles.auraWrap} style={{ "--rc": rank.color } as React.CSSProperties}>
          <div className={`${styles.auraRing}`} />
          <div className={`${styles.auraRing} ${styles.r2}`} />
          <div className={styles.rankBadge}>{rank.code}</div>
        </div>

        <div className={styles.rankTitle}>{rank.title}</div>
        <div className={styles.rankLine}>
          {profile.name.toUpperCase()} · RANK {rank.code} · LEVEL {progress.level}
        </div>
        <div className={styles.rankFlavor}>&quot;{RANK_FLAVOR[rank.code as RankCode] ?? ""}&quot;</div>

        {isMax && (
          <div className={styles.maxNote}>👑 The rarest rank in the arena. Not everyone gets here.</div>
        )}

        <div className={styles.statsRow}>
          <div className={styles.statPill}>
            <div className={styles.num}>{profile.streak}</div>
            <div className={styles.lbl}>Day Streak</div>
          </div>
          <div className={styles.statPill}>
            <div className={styles.num}>{questsCleared.toLocaleString("en-IN")}</div>
            <div className={styles.lbl}>Quests Cleared</div>
          </div>
          <div className={styles.statPill}>
            <div className={styles.num}>{profile.xp.toLocaleString("en-IN")}</div>
            <div className={styles.lbl}>Total XP</div>
          </div>
        </div>

        <a href="/dashboard" className={styles.continueBtn}>
          Continue →
        </a>
      </div>
    </>
  );
}
