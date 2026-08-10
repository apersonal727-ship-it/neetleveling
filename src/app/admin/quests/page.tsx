import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminProfile } from "@/lib/current-profile";
import { DeployQuestForm } from "@/components/admin/DeployQuestForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteQuest } from "@/actions/admin";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Quest Management — NEETLeveling Admin",
};

function assignLabel(q: { assignScope: string; assignRank: string | null }) {
  if (q.assignScope === "ALL") return "ALL HUNTERS";
  if (q.assignScope === "RANK") return `RANK ${q.assignRank}+`;
  return "SPECIFIC HUNTER";
}

export default async function AdminQuestsPage() {
  await requireAdminProfile();

  const [hunters, quests] = await Promise.all([
    prisma.profile.findMany({
      select: { id: true, name: true, email: true, hunterId: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.quest.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { _count: { select: { completions: true } } },
    }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <>
      <section>
        <span className={styles.secLabel}>Deploy a quest</span>
        <DeployQuestForm hunters={hunters} />
      </section>

      <section>
        <span className={styles.secLabel}>Recent quests</span>
        {quests.length === 0 ? (
          <div className={styles.card} style={{ padding: "20px", textAlign: "center", color: "var(--slate)", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px" }}>
            No quests deployed yet.
          </div>
        ) : (
          <div className={styles.card}>
            {quests.map((q) => {
              const isScheduled = q.scheduledFor && q.scheduledFor.getTime() > Date.now();
              return (
                <div
                  key={q.id}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderBottom: "1px solid var(--border)" }}
                >
                  <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9.5px", color: "var(--blue-2)", background: "rgba(79,157,255,.1)", border: "1px solid var(--border-strong)", borderRadius: "5px", padding: "3px 7px", flexShrink: 0 }}>
                    {q.subject}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{q.title}</div>
                    <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", marginTop: "3px" }}>
                      {assignLabel(q)} · {q.durationMinutes}M · +{q.xpOverride ?? Math.round(q.durationMinutes * 0.67)} XP · {q._count.completions} DONE
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "10px",
                      padding: "3px 8px",
                      borderRadius: "100px",
                      flexShrink: 0,
                      color: isScheduled ? "var(--amber)" : "var(--green)",
                      background: isScheduled ? "rgba(255,184,79,.1)" : "rgba(61,220,132,.1)",
                      border: `1px solid ${isScheduled ? "rgba(255,184,79,.35)" : "rgba(61,220,132,.35)"}`,
                    }}
                  >
                    {isScheduled ? "SCHEDULED" : "LIVE"}
                  </span>
                  <DeleteButton
                    onDelete={deleteQuest.bind(null, q.id)}
                    confirmMessage={`Delete "${q.title}"? Hunters who haven't completed it will no longer see it.`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
