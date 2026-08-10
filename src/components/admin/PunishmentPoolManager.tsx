"use client";

import { useState, useTransition } from "react";
import { addPunishmentQuest, removePunishmentQuest, setPunishmentMode } from "@/actions/admin";
import styles from "@/app/admin/admin.module.css";

type Punishment = { id: string; title: string; durationMinutes: number; timesTriggered: number };

export function PunishmentPoolManager({
  initialPool,
  initialMode,
  initialFixedId,
}: {
  initialPool: Punishment[];
  initialMode: "RANDOM" | "FIXED";
  initialFixedId: string | null;
}) {
  const [pool, setPool] = useState(initialPool);
  const [mode, setMode] = useState(initialMode);
  const [fixedId, setFixedId] = useState(initialFixedId);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("15");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    startTransition(async () => {
      const result = await addPunishmentQuest(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setPool((p) => [...p, { id: crypto.randomUUID(), title, durationMinutes: parseInt(duration, 10) || 15, timesTriggered: 0 }]);
      setTitle("");
      setDuration("15");
    });
  }

  function handleRemove(id: string) {
    if (!confirm("Remove this from the punishment pool?")) return;
    setPool((p) => p.filter((x) => x.id !== id));
    if (fixedId === id) setFixedId(null);
    startTransition(() => { removePunishmentQuest(id); });
  }

  function changeMode(next: "RANDOM" | "FIXED") {
    setMode(next);
    startTransition(() => { setPunishmentMode(next, fixedId ?? undefined); });
  }

  function pickFixed(id: string) {
    setFixedId(id);
    startTransition(() => { setPunishmentMode("FIXED", id); });
  }

  return (
    <>
      <section>
        <span className={`${styles.secLabel}`} style={{ color: "var(--blue)" }}>
          Assignment mode
        </span>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={() => changeMode("RANDOM")}
            style={{
              flex: 1,
              padding: "16px",
              borderRadius: "12px",
              border: `1px solid ${mode === "RANDOM" ? "var(--red-2)" : "var(--border-strong)"}`,
              background: mode === "RANDOM" ? "rgba(255,77,94,.06)" : "var(--panel)",
              textAlign: "left",
              cursor: "pointer",
              color: "var(--ice)",
            }}
          >
            <div style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "14px" }}>Random</div>
            <div style={{ fontSize: "11.5px", color: "var(--slate)", marginTop: "4px", lineHeight: 1.5 }}>
              A random quest from the pool is assigned on each lockout.
            </div>
          </button>
          <button
            type="button"
            onClick={() => changeMode("FIXED")}
            style={{
              flex: 1,
              padding: "16px",
              borderRadius: "12px",
              border: `1px solid ${mode === "FIXED" ? "var(--red-2)" : "var(--border-strong)"}`,
              background: mode === "FIXED" ? "rgba(255,77,94,.06)" : "var(--panel)",
              textAlign: "left",
              cursor: "pointer",
              color: "var(--ice)",
            }}
          >
            <div style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "14px" }}>Fixed</div>
            <div style={{ fontSize: "11.5px", color: "var(--slate)", marginTop: "4px", lineHeight: 1.5 }}>
              One specific quest is always assigned — pick it below.
            </div>
          </button>
        </div>

        {mode === "FIXED" && (
          <div className={styles.card} style={{ marginTop: "12px", padding: "8px" }}>
            {pool.length === 0 ? (
              <div style={{ padding: "14px", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11.5px", color: "var(--slate)" }}>
                Add a quest to the pool first.
              </div>
            ) : (
              pool.map((p) => (
                <div
                  key={p.id}
                  onClick={() => pickFixed(p.id)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 12px", borderRadius: "9px", cursor: "pointer" }}
                >
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      border: `1.5px solid ${fixedId === p.id ? "var(--red-2)" : "var(--border-strong)"}`,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {fixedId === p.id && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--red-2)" }} />}
                  </span>
                  <span style={{ fontSize: "13px" }}>{p.title}</span>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", marginLeft: "auto" }}>
                    {p.durationMinutes} min
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <section>
        <span className={styles.secLabel}>Add to pool</span>
        <div className={styles.card} style={{ padding: "20px" }}>
          <form action={handleAdd}>
            {error && <div className={styles.formError}>{error}</div>}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Title</span>
              <input
                className={styles.fieldInput}
                name="title"
                type="text"
                placeholder="e.g. 30 Burpees"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Duration (minutes)</span>
              <input
                className={styles.fieldInput}
                name="durationMinutes"
                type="number"
                placeholder="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <button type="submit" className={styles.btnDeploy} style={{ background: "linear-gradient(135deg, var(--red), #c22636)", color: "#fff0f0" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Punishment Quest
            </button>
          </form>
        </div>
      </section>

      <section>
        <span className={styles.secLabel}>Pool</span>
        <div className={styles.card}>
          {pool.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--slate)" }}>
              Pool is empty — hunters won&apos;t have a punishment quest to complete.
            </div>
          ) : (
            pool.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--red-2)", boxShadow: "0 0 6px var(--red-2)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13.5px", fontWeight: 600 }}>
                    {p.title}
                    {mode === "FIXED" && fixedId === p.id && (
                      <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "8.5px", color: "var(--red-2)", background: "rgba(255,77,94,.12)", border: "1px solid rgba(255,77,94,.4)", borderRadius: "5px", padding: "2px 6px", marginLeft: "8px" }}>
                        FIXED
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", marginTop: "3px" }}>
                    {p.durationMinutes} min · TRIGGERED {p.timesTriggered}×
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(p.id)}
                  style={{ width: "30px", height: "30px", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--slate)", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
