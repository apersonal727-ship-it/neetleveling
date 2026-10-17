import { StreakFire } from "@/components/app/StreakFire";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress } from "@/lib/rank";
import { prisma } from "@/lib/prisma";
import { getTodaysQuests } from "@/lib/todays-quest";
import { getPersonalQuests } from "@/lib/personal-quests";
import { getOpenMandatoryQuests } from "@/lib/open-quests";
import { questDayStart, questDayEnd } from "@/lib/quest-day";
import { parseData, verifyPass } from "@/lib/rank-up-pass";
import { StripPassToken } from "@/components/rank-up/StripPassToken";
import { ContinueButton } from "@/components/celebration/ContinueButton";
import styles from "./day-clear.module.css";

export const metadata: Metadata = {
  title: "Day Cleared — NEETLeveling",
};

export default async function DayClearPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const profile = await getCurrentProfile();
  // Only reachable with a pass issued right after the day was really cleared.
  const data = parseData(verifyPass(t, profile.id, "day"));
  if (!data) notFound();
  const progress = getLevelProgress(profile.xp);

  const openQuests = await getOpenMandatoryQuests(profile.id, progress.level, profile.streak);
  if (openQuests.length > 0) redirect("/dashboard");

  const [todaysQuests, personalQuests, xpToday] = await Promise.all([
    getTodaysQuests(profile.id, progress.level),
    getPersonalQuests(profile.id),
    prisma.questCompletion.aggregate({
      where: { profileId: profile.id, completedAt: { gte: questDayStart(), lt: questDayEnd() } },
      _sum: { xpAwarded: true },
    }),
  ]);

  const mandatoryDailyPersonal = personalQuests.filter((q) => q.mandatory && q.frequency === "DAILY");
  const checklist = [
    ...todaysQuests.map((q) => q.title),
    ...mandatoryDailyPersonal.map((q) => q.title),
  ];
  const totalCount = checklist.length;

  const remainingMs = Math.max(0, questDayEnd().getTime() - Date.now());
  const remainingH = Math.floor(remainingMs / 3600000);
  const remainingM = Math.floor((remainingMs % 3600000) / 60000);

  return (
    <>
      <StripPassToken />
      <div className={styles.bgGrid} />
      <div className={styles.app}>
        <span className={styles.tag}>
          <span className={styles.dot} /> Day Cleared
        </span>

        <div className={styles.flameWrap}>
          <StreakFire size="1em" />
          <span className={styles.streakNum}>{profile.streak}</span>
        </div>
        <div className={styles.streakLbl}>Day Streak</div>

        <h1 className={styles.title}>Every Quest Cleared.</h1>
        <p className={styles.sub}>
          Cleared with <b>{remainingH}h {remainingM}m</b> still on the clock. Streak protected — no
          lockout today.
        </p>

        <div className={styles.checklist}>
          {checklist.map((title, i) => (
            <div key={i} className={styles.checkRow}>
              <div className={styles.checkMark}>✓</div>
              <div className={styles.checkName}>{title}</div>
            </div>
          ))}
        </div>

        <div className={styles.xpRow}>
          <div className={styles.xpPill}>
            <div className={styles.num}>+{xpToday._sum.xpAwarded ?? 0}</div>
            <div className={styles.lbl}>XP Today</div>
          </div>
          <div className={styles.xpPill}>
            <div className={styles.num}>
              {totalCount} / {totalCount}
            </div>
            <div className={styles.lbl}>Quests Done</div>
          </div>
          <div className={styles.xpPill}>
            <div className={styles.num}>{profile.xp.toLocaleString("en-IN")}</div>
            <div className={styles.lbl}>Total XP</div>
          </div>
        </div>

        <ContinueButton rest={data.r} dest={data.d} className={styles.continueBtn}>
          Continue →
        </ContinueButton>
      </div>
    </>
  );
}
