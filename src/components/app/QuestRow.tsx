import { startQuestSession } from "@/actions/focus";
import { StartSessionButton } from "@/components/app/StartSessionButton";
import styles from "@/app/(app)/quests/quests.module.css";

export function QuestRow({
  quest,
  done,
}: {
  quest: { id: string; title: string; durationMinutes: number };
  done: boolean;
}) {
  const row = (
    <div className={styles.questRow}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={styles.questRowTitle}>{quest.title}</div>
        <div className={styles.questRowMeta} style={{ color: done ? "var(--green)" : "var(--amber)" }}>
          {done ? "✓ Completed" : `● ${quest.durationMinutes} min`}
        </div>
      </div>
    </div>
  );

  if (done) return row;
  return (
    <StartSessionButton
      action={startQuestSession.bind(null, quest.id)}
      style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}
    >
      {row}
    </StartSessionButton>
  );
}
