"use client";

import { useState } from "react";
import styles from "@/app/(app)/wallet/wallet.module.css";

export function AchievementOverlay({
  count,
  xp,
  cashTotal,
}: {
  count: number;
  xp: number;
  cashTotal: number;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className={styles.achOverlay} onClick={() => setDismissed(true)}>
      <div className={styles.achCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.achBadgeWrap}>
          <span className={styles.achRing} />
          <span className={`${styles.achRing} ${styles.d2}`} />
          <div className={styles.achBadge}>★</div>
        </div>
        <div className={styles.achTag}>Achievement Unlocked</div>
        <div className={styles.achTitle}>Recruitment Quest Cleared</div>
        <div className={styles.achQuest}>
          Recruit {count} Hunter{count === 1 ? "" : "s"}
        </div>
        <div className={styles.achRewards}>
          <div className={`${styles.achRewardPill} ${styles.xp}`}>
            +{xp}
            <span>XP</span>
          </div>
          <div className={`${styles.achRewardPill} ${styles.cash}`}>
            ₹{cashTotal.toLocaleString("en-IN")}
            <span>Wallet</span>
          </div>
        </div>
        <button type="button" className={styles.achContinue} onClick={() => setDismissed(true)}>
          Continue
        </button>
      </div>
    </div>
  );
}
