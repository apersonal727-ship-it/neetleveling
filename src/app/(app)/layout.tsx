import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress } from "@/lib/rank";
import { questDayEnd } from "@/lib/quest-day";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { BottomTabbar } from "@/components/app/BottomTabbar";
import { DailyCountdown } from "@/components/app/DailyCountdown";
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
          <div className={styles.headerRight}>
            {profile.isAdmin && (
              <Link href="/admin/quests" className={styles.adminBadge} title="Admin panel" aria-label="Admin panel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6z" />
                </svg>
              </Link>
            )}
            <div className={styles.userChip}>
              {profile.name}
              <FlameIcon className={styles.flame} />
            </div>
          </div>
        </div>
        <DailyCountdown deadline={questDayEnd().toISOString()} />
        <div className={styles.xpTrack}>
          <div className={styles.xpFill} style={{ width: `${pct}%` }} />
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <BottomTabbar />
    </div>
  );
}
