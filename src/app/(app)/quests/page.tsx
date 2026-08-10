import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/current-profile";
import { getLevelProgress, rankForLevel } from "@/lib/rank";
import { prisma } from "@/lib/prisma";
import { startQuestSession } from "@/actions/focus";
import appStyles from "../app.module.css";
import styles from "./quests.module.css";

export const metadata: Metadata = {
  title: "Quests — NEETLeveling",
};

const CATEGORIES = [
  {
    subject: "PHYSICS" as const,
    name: "Physics",
    color: "#8fd6ff",
    icon: (
      <>
        <circle cx="12" cy="12" r="2.5" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)" />
      </>
    ),
  },
  {
    subject: "CHEMISTRY" as const,
    name: "Chemistry",
    color: "#ffb84f",
    icon: <path d="M9 3h6M10 3v6l-5 9a1.6 1.6 0 0 0 1.4 2.4h11.2A1.6 1.6 0 0 0 19 18l-5-9V3" />,
  },
  {
    subject: "BIOLOGY" as const,
    name: "Biology",
    color: "#3ddc84",
    icon: <path d="M12 21S4 14.5 4 8.8A4.8 4.8 0 0 1 12 5a4.8 4.8 0 0 1 8 3.8C20 14.5 12 21 12 21Z" />,
  },
  {
    subject: "DISCIPLINE" as const,
    name: "Discipline",
    color: "#8fd6ff",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
  },
];

export default async function QuestsPage() {
  const profile = await getCurrentProfile();
  const progress = getLevelProgress(profile.xp);
  const rank = rankForLevel(progress.level).code;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const todaysQuests = await prisma.quest.findMany({
    where: {
      OR: [
        { assignScope: "ALL" },
        { assignScope: "RANK", assignRank: rank },
        { assignScope: "SPECIFIC_HUNTER", assignedToId: profile.id },
      ],
      scheduledFor: null,
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
    include: { completions: { where: { profileId: profile.id } } },
  });

  const bySubject = new Map<string, (typeof todaysQuests)[number]>();
  for (const q of todaysQuests) if (!bySubject.has(q.subject)) bySubject.set(q.subject, q);

  return (
    <>
      <div className={appStyles.pageHead}>
        <h1>Quests</h1>
        <p>Clear today&apos;s set to keep the streak alive.</p>
      </div>

      <section>
        <span className={appStyles.secLabel}>Today&apos;s set</span>
        <div className={styles.catGrid}>
          {CATEGORIES.map((cat) => {
            const quest = bySubject.get(cat.subject);
            const done = quest && quest.completions.length > 0;
            const statusClass = done
              ? styles.catStatusDone
              : quest
                ? styles.catStatusPending
                : styles.catStatusLocked;
            const statusText = done
              ? "✓ Completed"
              : quest
                ? `● ${quest.durationMinutes} min assigned`
                : "Not assigned today";

            const card = (
              <div className={`${appStyles.card} ${styles.catCard}`}>
                <div className={styles.catIcon} style={{ "--c": cat.color } as React.CSSProperties}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    {cat.icon}
                  </svg>
                </div>
                <div className={styles.catName}>{cat.name}</div>
                <div className={`${styles.catStatus} ${statusClass}`}>{statusText}</div>
              </div>
            );

            if (quest && !done) {
              return (
                <form key={cat.subject} action={startQuestSession.bind(null, quest.id)}>
                  <button type="submit" style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}>
                    {card}
                  </button>
                </form>
              );
            }
            return <div key={cat.subject}>{card}</div>;
          })}
        </div>
      </section>

      <section>
        <span className={appStyles.secLabel}>Beyond the set</span>
        <div className={`${appStyles.card} ${styles.wideCard}`}>
          <div className={styles.wideIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M12 17h.01M12 3a5 5 0 0 0-5 5c0 2 1.5 2.7 2.5 3.6.7.6 1 1.2 1 1.9" />
            </svg>
          </div>
          <div className={styles.wideBody}>
            <div className={styles.wideTitle}>Secret Quest</div>
            <div className={styles.wideSub}>Appears without warning. Higher reward, no set schedule.</div>
          </div>
        </div>

        <div style={{ height: "12px" }} />

        <div className={`${appStyles.card} ${styles.wideCard}`}>
          <div className={`${styles.wideIcon} ${styles.wideIconPq}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 6h16M4 12h10M4 18h16" />
            </svg>
          </div>
          <div className={styles.wideBody}>
            <div className={styles.wideTitle}>Personal Quests</div>
            <div className={styles.wideSub}>Self-tracked goals, no penalty if missed — coming soon.</div>
          </div>
        </div>
      </section>
    </>
  );
}
