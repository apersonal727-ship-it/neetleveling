"use client";

import { useMemo, useState, useTransition } from "react";
import { deployQuest } from "@/actions/admin";
import styles from "@/app/admin/admin.module.css";

const SUBJECTS = ["PHYSICS", "CHEMISTRY", "BIOLOGY", "DISCIPLINE", "SECRET"];
const RANKS = ["E", "D", "C", "B", "A"];

function parseDuration(str: string) {
  const h = /(\d+)\s*h/i.exec(str);
  const m = /(\d+)\s*m/i.exec(str);
  return (h ? parseInt(h[1], 10) : 0) * 60 + (m ? parseInt(m[1], 10) : 0);
}

export function DeployQuestForm({
  hunters,
}: {
  hunters: { id: string; name: string; email: string; hunterId: string }[];
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("PHYSICS");
  const [durationText, setDurationText] = useState("1h 30m");
  const [xpOverride, setXpOverride] = useState("");
  const [assignScope, setAssignScope] = useState<"ALL" | "RANK" | "SPECIFIC_HUNTER">("ALL");
  const [assignRank, setAssignRank] = useState("D");
  const [hunterSearch, setHunterSearch] = useState("");
  const [selectedHunter, setSelectedHunter] = useState<{ id: string; name: string } | null>(null);
  const [scheduledFor, setScheduledFor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const durationMinutes = parseDuration(durationText);
  const autoXp = Math.round(durationMinutes * (40 / 60));

  const matches = useMemo(() => {
    if (!hunterSearch.trim()) return [];
    const q = hunterSearch.toLowerCase();
    return hunters.filter((h) => h.name.toLowerCase().includes(q) || h.email.toLowerCase().includes(q)).slice(0, 8);
  }, [hunterSearch, hunters]);

  function handleSubmit(formData: FormData) {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (durationMinutes <= 0) {
      setError("Enter a valid duration, e.g. \"1h 30m\".");
      return;
    }
    if (assignScope === "SPECIFIC_HUNTER" && !selectedHunter) {
      setError("Search and select a hunter to assign to.");
      return;
    }

    formData.set("durationMinutes", String(durationMinutes));
    formData.set("assignScope", assignScope);
    if (assignScope === "RANK") formData.set("assignRank", assignRank);
    if (assignScope === "SPECIFIC_HUNTER" && selectedHunter) formData.set("assignedToId", selectedHunter.id);

    startTransition(async () => {
      const result = await deployQuest(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setTitle("");
        setXpOverride("");
        setSelectedHunter(null);
        setHunterSearch("");
      }
    });
  }

  return (
    <div className={styles.card} style={{ padding: "20px" }}>
      <form action={handleSubmit}>
        {error && <div className={styles.formError}>{error}</div>}

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Title</span>
          <input
            className={styles.fieldInput}
            name="title"
            type="text"
            placeholder="e.g. Organic Chemistry — Revision Block"
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
            <span className={styles.fieldLabel}>Duration</span>
            <input
              className={styles.fieldInput}
              type="text"
              placeholder="1h 30m"
              value={durationText}
              onChange={(e) => setDurationText(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Assign to</span>
          <select
            className={styles.fieldSelect}
            value={assignScope}
            onChange={(e) => setAssignScope(e.target.value as typeof assignScope)}
          >
            <option value="ALL">All Hunters</option>
            <option value="RANK">By Rank</option>
            <option value="SPECIFIC_HUNTER">Specific Hunter…</option>
          </select>
        </div>

        {assignScope === "RANK" && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Rank</span>
            <select className={styles.fieldSelect} value={assignRank} onChange={(e) => setAssignRank(e.target.value)}>
              {RANKS.map((r) => (
                <option key={r} value={r}>
                  Rank {r}
                </option>
              ))}
            </select>
          </div>
        )}

        {assignScope === "SPECIFIC_HUNTER" && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Hunter</span>
            <input
              className={styles.fieldInput}
              type="text"
              placeholder="Search by name or email…"
              autoComplete="off"
              value={hunterSearch}
              onChange={(e) => {
                setHunterSearch(e.target.value);
                setSelectedHunter(null);
              }}
            />
            {matches.length > 0 && !selectedHunter && (
              <div style={{ marginTop: "6px", border: "1px solid var(--border-strong)", borderRadius: "9px", overflow: "hidden" }}>
                {matches.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => {
                      setSelectedHunter({ id: h.id, name: h.name });
                      setHunterSearch(h.name);
                    }}
                    style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12.5px" }}
                  >
                    {h.name} <span style={{ color: "var(--slate)" }}>{h.email}</span>
                  </div>
                ))}
              </div>
            )}
            {selectedHunter && (
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12.5px", color: "var(--blue-2)", background: "rgba(79,157,255,.08)", border: "1px solid var(--border-strong)", borderRadius: "9px", padding: "9px 12px" }}>
                Assigning to <b>{selectedHunter.name}</b>
                <button type="button" onClick={() => { setSelectedHunter(null); setHunterSearch(""); }} style={{ marginLeft: "auto", color: "var(--slate)", cursor: "pointer", background: "none", border: "none" }}>
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Schedule for (optional — leave blank for today)</span>
          <input
            className={styles.fieldInput}
            type="date"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            name="scheduledFor"
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(79,157,255,.06)", border: "1px dashed var(--border-strong)", borderRadius: "9px", padding: "11px 14px", marginBottom: "20px", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px" }}>
          <span>Auto XP (40/hr) — override below if needed</span>
          <span style={{ color: "var(--blue-2)", fontWeight: 600, fontSize: "15px" }}>+{autoXp} XP</span>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>XP override</span>
          <input
            className={styles.fieldInput}
            name="xpOverride"
            type="number"
            placeholder={String(autoXp)}
            value={xpOverride}
            onChange={(e) => setXpOverride(e.target.value)}
          />
        </div>

        <button type="submit" className={styles.btnDeploy} disabled={pending}>
          {pending ? "Deploying…" : "Deploy Quest"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </div>
  );
}
