import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress, rankForLevel, RANKS, RANK_FLAVOR, cumulativeXpForLevel, type RankCode } from "@/lib/rank";
import { getHunterProgressStats } from "@/lib/stats";
import { prisma } from "@/lib/prisma";
import appStyles from "../app.module.css";
import styles from "./profile.module.css";

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
  const journeyPct = Math.round((rankIndex / (RANKS.length - 1)) * 100);
  const levelsToNext = nextRank ? Math.max(0, nextRank.minLevel - progress.level) : 0;
  const ringCircumference = 2 * Math.PI * 32;
  const ringOffset = ringCircumference * (1 - journeyPct / 100);

  const statTiles = [
    { icon: "⚡", num: profile.xp.toLocaleString("en-IN"), lbl: "Total XP" },
    { icon: "🎥", num: hunterStats.classHours.toLocaleString("en-IN"), lbl: "Class Hours" },
    { icon: "🧠", num: hunterStats.questionHours.toLocaleString("en-IN"), lbl: "Question Hours" },
    { icon: "🎯", num: hunterStats.questionsSolved.toLocaleString("en-IN"), lbl: "Questions Solved" },
    { icon: "🔥", num: profile.streak.toLocaleString("en-IN"), lbl: "Current Streak" },
    { icon: "🏆", num: profile.bestStreak.toLocaleString("en-IN"), lbl: "Best Streak" },
    { icon: "✅", num: questsCompleted.toLocaleString("en-IN"), lbl: "Quests Completed" },
    { icon: "⚠️", num: penaltiesTriggered.toLocaleString("en-IN"), lbl: "Penalties Triggered" },
  ];

  return (
    <>
      <section className={`${appStyles.card} ${styles.hero}`}>
        <div className={styles.auraWrap} style={{ "--rc": rank.color } as React.CSSProperties}>
          <div className={styles.auraRing} />
          <div className={`${styles.auraRing} ${styles.r2}`} />
          <div className={styles.profileBadge}>{rank.code}</div>
        </div>
        <div className={styles.profileName}>{profile.name}</div>
        <div className={styles.profileTitle}>◆ {rank.title} ◆</div>
        <div className={styles.profileLevel}>⚡ LV {progress.level}</div>

        <div className={styles.xpBlock}>
          <div className={styles.xpRow}>
            <span>XP to next level</span>
            <b>
              {progress.xpInLevel.toLocaleString("en-IN")} /{" "}
              {progress.xpForLevel > 0 ? progress.xpForLevel.toLocaleString("en-IN") : "—"}
            </b>
          </div>
          <div className={styles.xpTrack}>
            <div className={styles.xpFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </section>

      <section>
        <span className={styles.secTag} style={{ color: "var(--blue-2)" }}>
          <span className={styles.dot} />
          Hunter Stats
        </span>
        <div className={styles.statsGrid}>
          {statTiles.map((t) => (
            <div key={t.lbl} className={styles.statTile}>
              <span className={styles.statIcon}>{t.icon}</span>
              <div>
                <div className={styles.statNum}>{t.num}</div>
                <div className={styles.statLbl}>{t.lbl}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {nextRank && (
        <section>
          <div className={`${appStyles.card} ${styles.journeyCard}`}>
            <div className={styles.journeyRingWrap}>
              <svg className={styles.journeyRingSvg} viewBox="0 0 76 76">
                <circle className={styles.journeyTrack} cx="38" cy="38" r="32" />
                <circle
                  className={styles.journeyProgress}
                  cx="38"
                  cy="38"
                  r="32"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className={styles.journeyPct}>{journeyPct}%</div>
            </div>
            <div>
              <div className={styles.journeyTitle}>Journey to S-Rank</div>
              <div className={styles.journeySub}>
                {rankIndex} of {RANKS.length - 1} ranks cleared. <b>{levelsToNext} levels</b> to
                unlock {nextRank.code}-Rank next.
              </div>
            </div>
          </div>
        </section>
      )}

      <section>
        <span className={styles.secTag} style={{ color: "var(--violet)" }}>
          <span className={styles.dot} />
          Your Progression
        </span>
        <div className={styles.timeline}>
          {RANKS.map((r) => {
            const state = r.code === rank.code ? "current" : r.minLevel <= progress.level ? "achieved" : "locked";
            return (
              <div key={r.code} className={`${styles.tRow} ${styles[state] ?? ""}`}>
                <div className={styles.tNode}>
                  {r.code}
                  {state === "locked" && <span className={styles.tLockIcon}>🔒</span>}
                </div>
                <div className={styles.tCard}>
                  <div className={styles.tTitle}>{r.title}</div>
                  <div className={styles.tSub}>
                    {r.code === "E" ? "Everyone starts here." : RANK_FLAVOR[r.code as RankCode]}
                  </div>
                  <div className={styles.tStatus}>
                    {state === "current" ? "You Are Here" : state === "achieved" ? "Cleared" : "Locked"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
