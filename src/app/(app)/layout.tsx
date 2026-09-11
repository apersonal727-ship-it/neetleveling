import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress } from "@/lib/rank";
import { questDayEnd } from "@/lib/quest-day";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { BottomTabbar } from "@/components/app/BottomTabbar";
import { SideNav } from "@/components/app/SideNav";
import { DailyCountdown } from "@/components/app/DailyCountdown";
import { questDayStart } from "@/lib/quest-day";
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

  return (
    <div className={styles.app}>
      <div className="systemBackdrop" />
      <SideNav />
      <header className={styles.header}>
        <div className={styles.topRow}>
          <span className={styles.lvlTag}>
            LVL <b>{progress.level}</b>
          </span>
          <div className={styles.headerRight}>
            <div className={styles.userChip}>
              {profile.name}
              <FlameIcon className={styles.flame} />
            </div>
          </div>
        </div>
        <DailyCountdown
          deadline={questDayEnd().toISOString()}
          dayStart={questDayStart().toISOString()}
        />
      </header>

      <main className={styles.main}>{children}</main>

      <BottomTabbar />
    </div>
  );
}
