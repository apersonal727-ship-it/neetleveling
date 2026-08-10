import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress } from "@/lib/rank";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { BottomTabbar } from "@/components/app/BottomTabbar";
import styles from "./app.module.css";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (profile.locked) redirect("/locked");

  const subscriptionLapsed =
    profile.subscriptionStatus === "EXPIRED" ||
    (profile.subscriptionStatus === "CANCELED" &&
      profile.subscriptionRenewsAt !== null &&
      profile.subscriptionRenewsAt.getTime() < Date.now());
  if (subscriptionLapsed) redirect("/subscription-expired");

  const progress = getLevelProgress(profile.xp);
  const pct = progress.xpForLevel > 0 ? (progress.xpInLevel / progress.xpForLevel) * 100 : 100;

  return (
    <div className={styles.app}>
      <div className={styles.bgGrid} />
      <header className={styles.header}>
        <div className={styles.topRow}>
          <span className={styles.lvlTag}>
            LVL <b>{progress.level}</b>
          </span>
          <div className={styles.userChip}>
            {profile.name}
            <FlameIcon className={styles.flame} />
          </div>
        </div>
        <div className={styles.xpTrack}>
          <div className={styles.xpFill} style={{ width: `${pct}%` }} />
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <BottomTabbar />
    </div>
  );
}
