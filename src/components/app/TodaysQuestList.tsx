import { applyPracticeOverrides } from "@/lib/progressive-overload";
import { CATEGORIES } from "@/lib/quest-categories";
import { QuestRow } from "@/components/app/QuestRow";
import styles from "@/app/(app)/quests/quests.module.css";

type Quest = {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  xpOverride: number | null;
  completions: unknown[];
};

export function TodaysQuestList({
  quests,
  streak,
  subjects,
}: {
  quests: Quest[];
  streak: number;
  /** Restrict which subject groups render, e.g. the Dashboard's daily-glance
   * summary only ever shows Physics/Chemistry/Biology — Discipline quests
   * (self-assigned, not part of the daily drop) show up on Quests instead. */
  subjects?: string[];
}) {
  const bySubject = new Map<string, Quest[]>();
  for (const cat of CATEGORIES) bySubject.set(cat.subject, []);
  for (const q of quests) bySubject.get(q.subject)?.push(q);
  const visibleCategories = subjects ? CATEGORIES.filter((c) => subjects.includes(c.subject)) : CATEGORIES;

  return (
    <>
      {visibleCategories.map((cat) => {
        const subjectQuests = bySubject.get(cat.subject) ?? [];
        return (
          <div key={cat.subject} className={styles.subjectGroup}>
            <div className={styles.subjectHeading} style={{ "--c": cat.color } as React.CSSProperties}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                {cat.icon}
              </svg>
              {cat.name}
            </div>
            {subjectQuests.length === 0 ? (
              <div className={styles.subjectBox} style={{ "--c": cat.color } as React.CSSProperties}>
                <div className={styles.questRow}>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "#4a5476" }}>
                    Not assigned today
                  </span>
                </div>
              </div>
            ) : (
              <div className={styles.subjectBox} style={{ "--c": cat.color } as React.CSSProperties}>
                {subjectQuests.map((q) => (
                  <QuestRow
                    key={q.id}
                    quest={applyPracticeOverrides(q, streak)}
                    done={q.completions.length > 0}
                    streak={streak}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
