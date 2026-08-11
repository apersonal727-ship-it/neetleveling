"use client";

import { useState, useTransition } from "react";
import { addQuestTemplate, removeQuestTemplate, toggleQuestTemplateActive } from "@/actions/admin";
import styles from "@/app/admin/admin.module.css";

const SUBJECTS = ["PHYSICS", "CHEMISTRY", "BIOLOGY", "DISCIPLINE", "SECRET"];

type Template = {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  xpOverride: number | null;
  active: boolean;
  lastDeployedAt: string | null;
};

export function QuestTemplateManager({ initialTemplates }: { initialTemplates: Template[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("PHYSICS");
  const [duration, setDuration] = useState("60");
  const [xpOverride, setXpOverride] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const durationMinutes = parseInt(duration, 10);
    if (!durationMinutes || durationMinutes <= 0) {
      setError("Enter a valid duration in minutes.");
      return;
    }
    startTransition(async () => {
      const result = await addQuestTemplate(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setTemplates((t) => [
        {
          id: crypto.randomUUID(),
          title,
          subject,
          durationMinutes,
          xpOverride: xpOverride ? parseInt(xpOverride, 10) : null,
          active: true,
          lastDeployedAt: null,
        },
        ...t,
      ]);
      setTitle("");
      setXpOverride("");
    });
  }

  function handleRemove(id: string) {
    if (!confirm("Remove this default quest? It won't be deployed again — today's already-deployed copy, if any, stays.")) return;
    setTemplates((t) => t.filter((x) => x.id !== id));
    startTransition(() => { removeQuestTemplate(id); });
  }

  function handleToggle(id: string) {
    setTemplates((t) => t.map((x) => (x.id === id ? { ...x, active: !x.active } : x)));
    startTransition(() => { toggleQuestTemplateActive(id); });
  }

  return (
    <>
      <section>
        <span className={styles.secLabel}>Add a default daily quest</span>
        <div className={styles.card} style={{ padding: "20px" }}>
          <form action={handleAdd}>
            {error && <div className={styles.formError}>{error}</div>}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Title</span>
              <input
                className={styles.fieldInput}
                name="title"
                type="text"
                placeholder="e.g. Physics — Daily Practice Set"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Category</span>
                <select className={styles.fieldSelect} name="subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Duration (min)</span>
                <input
                  className={styles.fieldInput}
                  name="durationMinutes"
                  type="number"
                  placeholder="60"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>XP override (optional)</span>
              <input
                className={styles.fieldInput}
                name="xpOverride"
                type="number"
                placeholder="Auto (40/hr)"
                value={xpOverride}
                onChange={(e) => setXpOverride(e.target.value)}
              />
            </div>
            <button type="submit" className={styles.btnDeploy} disabled={pending}>
              {pending ? "Adding…" : "Add Default Quest"}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </form>
        </div>
      </section>

      <section>
        <span className={styles.secLabel}>Default daily quests ({templates.length})</span>
        {templates.length === 0 ? (
          <div className={styles.card} style={{ padding: "20px", textAlign: "center", color: "var(--slate)", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px" }}>
            No default quests set — nothing will auto-deploy each day.
          </div>
        ) : (
          <div className={styles.card}>
            {templates.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderBottom: "1px solid var(--border)", opacity: t.active ? 1 : 0.5 }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: t.active ? "var(--green)" : "var(--slate)",
                    boxShadow: t.active ? "0 0 6px var(--green)" : "none",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{t.title}</div>
                  <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", marginTop: "3px" }}>
                    {t.subject} · {t.durationMinutes}M · +{t.xpOverride ?? Math.round(t.durationMinutes * 0.67)} XP · {t.active ? "PUSHES DAILY" : "PAUSED"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(t.id)}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "10px",
                    padding: "6px 10px",
                    borderRadius: "100px",
                    flexShrink: 0,
                    cursor: "pointer",
                    color: t.active ? "var(--amber)" : "var(--green)",
                    background: t.active ? "rgba(255,184,79,.08)" : "rgba(61,220,132,.08)",
                    border: `1px solid ${t.active ? "rgba(255,184,79,.35)" : "rgba(61,220,132,.35)"}`,
                  }}
                >
                  {t.active ? "Pause" : "Resume"}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(t.id)}
                  style={{ width: "30px", height: "30px", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--slate)", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
