import { StreakFire } from "@/components/app/StreakFire";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress, RANK_FLAVOR, type RankCode } from "@/lib/rank";
import { prisma } from "@/lib/prisma";
import styles from "./awakened.module.css";

export const metadata: Metadata = {
  title: "System Activated — NEETLeveling",
};

export default async function AwakenedPage() {
  const profile = await getCurrentProfile();

  // Only a genuinely brand-new hunter (never earned any XP) sees this —
  // anyone re-subscribing after a lapse gets sent straight to /dashboard.
  if (profile.xp !== 0) redirect("/dashboard");

  const progress = getLevelProgress(profile.xp);
  const questsCompleted = await prisma.questCompletion.count({ where: { profileId: profile.id } });

  return (
    <>
      <div className="systemBackdrop" />
      <div className={styles.body}>
        <div className={styles.wrap}>
          <div className={styles.awakenTag}>
            <span className={styles.dot} />
            System Activated
          </div>

          <div className={styles.genesisLine}>
            Hunter <b>{profile.name}</b> registered
          </div>

          <div className={styles.badgeWrap}>
            <div className={styles.awakenRing} />
            <div className={`${styles.awakenRing} ${styles.r2}`} />
            <div className={styles.rankBadge}>E</div>
          </div>

          <div className={styles.rankTitle}>{progress.rankTitle}</div>
          <div className={styles.rankLine}>
            {profile.name.toUpperCase()} · RANK {progress.rank} · LEVEL {progress.level}
          </div>
          <div className={styles.rankFlavor}>
            &quot;{RANK_FLAVOR["E" as RankCode] ?? "Everyone starts here."}&quot;
          </div>

          <div className={styles.journeyNote}>🌱 Every Monarch started exactly here.</div>

          <div className={styles.targetRow}>
            <div className={styles.targetPill}>
              <div className={styles.num}>{profile.targetExamYear ?? "—"}</div>
              <div className={styles.lbl}>Target Exam</div>
            </div>
            <div className={styles.targetPill}>
              <div className={styles.num}>
                <StreakFire lit={profile.streak > 0} />
                {profile.streak}
              </div>
              <div className={styles.lbl}>Day Streak</div>
            </div>
            <div className={styles.targetPill}>
              <div className={styles.num}>{questsCompleted}</div>
              <div className={styles.lbl}>Quests Cleared</div>
            </div>
          </div>

          <a href="/dashboard" className={styles.continueBtn}>
            Enter The System →
          </a>
        </div>
      </div>
    </>
  );
}
