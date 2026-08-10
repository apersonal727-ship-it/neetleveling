import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress, rankForLevel, RANKS } from "@/lib/rank";
import { getBadges, type Badge } from "@/lib/achievements";
import appStyles from "../app.module.css";
import styles from "./achievements.module.css";

export const metadata: Metadata = {
  title: "Achievements — NEETLeveling",
};

const ICONS: Record<Badge["icon"], React.ReactNode> = {
  flame: (
    <path d="M12 2C12 2 7 7.5 7 13a5 5 0 0 0 10 0c0-1.2-.4-2-1-2.8.1 1-.3 1.8-1 2.3.3-2.5-1-4-1.6-5.2C13 6 13.4 4 12 2Z" />
  ),
  shield: <path d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-4Z" />,
  scroll: (
    <path d="M9 3h6M10 3v6l-5 9a1.6 1.6 0 0 0 1.4 2.4h11.2A1.6 1.6 0 0 0 19 18l-5-9V3" />
  ),
  network: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 10.5 15.4 6.5M8.6 13.5l6.8 4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  warning: (
    <>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </>
  ),
};

export default async function AchievementsPage() {
  const profile = await getCurrentProfile();
  const level = getLevelProgress(profile.xp).level;
  const currentRank = rankForLevel(level);
  const badges = await getBadges(profile.id);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  const equippedTitle = profile.equippedTitle ?? currentRank.title;
  const nonERanks = RANKS.filter((r) => r.code !== "E");

  return (
    <>
      <div className={appStyles.pageHead}>
        <h1>Achievements</h1>
        <p>Earned, not given.</p>
      </div>

      <section>
        <span className={appStyles.secLabel}>Badges</span>
        <div className={styles.progressStrip}>
          <b>{unlockedCount}</b> of {badges.length} unlocked
        </div>
        <div className={appStyles.card} style={{ padding: "16px" }}>
          <div className={styles.badgeGrid}>
            {badges.map((badge) => (
              <div
                key={badge.key}
                className={`${styles.badgeCard} ${!badge.unlocked ? styles.badgeCardLocked : ""}`}
              >
                <div className={styles.badgeIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    {ICONS[badge.icon]}
                  </svg>
                  {!badge.unlocked && (
                    <span className={styles.lockPin}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="4" y="10" width="16" height="10" rx="2" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className={styles.badgeName}>{badge.name}</div>
                {badge.progress && <div className={styles.badgeProgress}>{badge.progress}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <span className={appStyles.secLabel}>Titles</span>
        <div className={`${appStyles.card} ${styles.titleList}`}>
          {nonERanks.map((rank) => {
            const unlocked = level >= rank.minLevel;
            const isEquipped = unlocked && equippedTitle === rank.title;
            return (
              <div key={rank.code} className={styles.titleItem}>
                <span
                  className={`${styles.titleDot} ${unlocked ? styles.titleDotUnlocked : styles.titleDotLocked}`}
                />
                <div className={styles.titleBody}>
                  <div className={`${styles.titleName} ${!unlocked ? styles.titleNameLocked : ""}`}>
                    {rank.title}
                  </div>
                  <div className={styles.titleReq}>
                    {unlocked
                      ? `Unlocked at Rank ${rank.code}`
                      : `Unlocks at Rank ${rank.code} — Level ${rank.minLevel}`}
                  </div>
                </div>
                {isEquipped && <span className={styles.titleCheck}>EQUIPPED</span>}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
