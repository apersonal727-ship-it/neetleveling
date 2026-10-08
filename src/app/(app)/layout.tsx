import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/current-profile";
import { prisma } from "@/lib/prisma";
import { getLevelProgress } from "@/lib/rank";
import { questDayEnd, questDayStart } from "@/lib/quest-day";
import { getOpenMandatoryQuests } from "@/lib/open-quests";
import { LOCKOUT_EXEMPT_EMAILS } from "@/lib/lockout";
import { BottomTabbar } from "@/components/app/BottomTabbar";
import { SideNav } from "@/components/app/SideNav";
import { DailyCountdown } from "@/components/app/DailyCountdown";
import { InstallPrompt } from "@/components/app/InstallPrompt";
import styles from "./app.module.css";

const TIME_WARNING_WINDOW_MS = 60 * 60 * 1000;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  // A Focus Mode session left running (tab closed mid-session, etc.) must
  // keep blocking the rest of the app exactly like being locked does below
  // — otherwise closing the tab would quietly free the hunter to browse
  // everywhere else while the timer kept counting down server-side
  // underneath. Takes priority over the locked check so an in-progress
  // punishment session routes straight back in instead of to /locked.
  const activeSession = await prisma.questSession.findFirst({
    where: { profileId: profile.id, status: "ACTIVE" },
    select: { id: true },
  });
  if (activeSession) redirect(`/focus-lock?sessionId=${activeSession.id}`);

  if (profile.locked) redirect("/locked");

  const subscriptionLapsed =
    profile.subscriptionStatus === "EXPIRED" ||
    (profile.subscriptionStatus === "CANCELED" &&
      profile.subscriptionRenewsAt !== null &&
      profile.subscriptionRenewsAt.getTime() < Date.now());
  if (subscriptionLapsed) redirect("/subscription-expired");

  const progress = getLevelProgress(profile.xp);

  const msUntilReset = questDayEnd().getTime() - Date.now();
  if (msUntilReset > 0 && msUntilReset < TIME_WARNING_WINDOW_MS && !LOCKOUT_EXEMPT_EMAILS.has(profile.email)) {
    const openQuests = await getOpenMandatoryQuests(profile.id, progress.level, profile.streak);
    if (openQuests.length > 0) redirect("/time-warning");
  }

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
            <Link href="/report-bug" className={styles.helpBtn} aria-label="Report an issue or contact us">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
                <path d="M9.5 10.5h5M9.5 13.5h3" />
              </svg>
              <span>Help</span>
            </Link>
          </div>
        </div>
        <DailyCountdown
          deadline={questDayEnd().toISOString()}
          dayStart={questDayStart().toISOString()}
        />
      </header>

      <main className={styles.main}>
        <InstallPrompt />
        {children}
      </main>

      <BottomTabbar />
    </div>
  );
}
