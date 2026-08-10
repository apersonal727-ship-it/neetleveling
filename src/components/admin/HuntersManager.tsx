"use client";

import { useMemo, useState, useTransition } from "react";
import { getLevelProgress, rankForLevel, cumulativeXpForLevel } from "@/lib/rank";
import { adjustHunterXp, resetHunterStreak, toggleHunterLock, getHunterQuestHistory } from "@/actions/admin";
import styles from "@/app/admin/admin.module.css";

type Hunter = {
  id: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  locked: boolean;
  questCount: number;
  walletCredit: number;
};

type HistoryEntry = { id: string; title: string; xpAwarded: number };

export function HuntersManager({ hunters: initial }: { hunters: Hunter[] }) {
  const [hunters, setHunters] = useState(initial);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<"none" | "xp" | "history">("none");
  const [xpLevelInput, setXpLevelInput] = useState("");
  const [xpTotalInput, setXpTotalInput] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return hunters;
    return hunters.filter((h) => h.name.toLowerCase().includes(q) || h.email.toLowerCase().includes(q));
  }, [search, hunters]);

  const selected = hunters.find((h) => h.id === selectedId) ?? null;

  function openDetail(id: string) {
    setSelectedId(id);
    setPanel("none");
    setNote(null);
    const h = hunters.find((x) => x.id === id);
    if (h) {
      const progress = getLevelProgress(h.xp);
      setXpLevelInput(String(progress.level));
      setXpTotalInput(String(h.xp));
    }
  }

  function saveXp() {
    if (!selected) return;
    const newXp = parseInt(xpTotalInput, 10);
    const newLevel = parseInt(xpLevelInput, 10);
    let finalXp = selected.xp;
    if (!isNaN(newXp) && newXp !== selected.xp) {
      finalXp = newXp;
    } else if (!isNaN(newLevel)) {
      finalXp = cumulativeXpForLevel(newLevel);
    }
    setHunters((prev) => prev.map((h) => (h.id === selected.id ? { ...h, xp: finalXp } : h)));
    setPanel("none");
    startTransition(() => { adjustHunterXp(selected.id, finalXp); });
  }

  function loadHistory() {
    if (!selected) return;
    setPanel("history");
    startTransition(async () => {
      const rows = await getHunterQuestHistory(selected.id);
      setHistory(rows.map((r) => ({ id: r.id, title: r.quest.title, xpAwarded: r.xpAwarded })));
    });
  }

  function doResetStreak() {
    if (!selected) return;
    setHunters((prev) => prev.map((h) => (h.id === selected.id ? { ...h, streak: 0 } : h)));
    setNote("Streak manually reset to 0.");
    startTransition(() => { resetHunterStreak(selected.id); });
  }

  function doToggleLock() {
    if (!selected) return;
    const nowLocked = !selected.locked;
    setHunters((prev) => prev.map((h) => (h.id === selected.id ? { ...h, locked: nowLocked } : h)));
    setNote(
      nowLocked
        ? "Account locked. A punishment quest has been assigned, same as an automatic lockout."
        : "Account unlocked. Any pending punishment quest is cleared.",
    );
    startTransition(() => { toggleHunterLock(selected.id); });
  }

  return (
    <>
      <section>
        <span className={styles.secLabel}>Search hunters</span>
        <div style={{ position: "relative" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--slate)" }}>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            className={styles.fieldInput}
            style={{ paddingLeft: "42px" }}
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      <section>
        <span className={styles.secLabel}>
          All hunters ({filtered.length})
        </span>
        <div className={styles.card}>
          {filtered.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12.5px", color: "var(--slate)" }}>
              No hunters found
            </div>
          ) : (
            filtered.map((h) => {
              const progress = getLevelProgress(h.xp);
              const rank = rankForLevel(progress.level);
              return (
                <div
                  key={h.id}
                  onClick={() => openDetail(h.id)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                >
                  <div style={{ width: "36px", height: "36px", borderRadius: "9px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "14px", border: `1.5px solid ${rank.color}`, color: rank.color }}>
                    {rank.code}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{h.name}</div>
                    <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", marginTop: "3px" }}>
                      LVL {progress.level} · {h.streak}D STREAK · {h.email}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "9.5px",
                      padding: "3px 8px",
                      borderRadius: "100px",
                      flexShrink: 0,
                      color: h.locked ? "var(--red)" : "var(--green)",
                      background: h.locked ? "rgba(255,77,94,.1)" : "rgba(61,220,132,.1)",
                      border: `1px solid ${h.locked ? "rgba(255,77,94,.35)" : "rgba(61,220,132,.35)"}`,
                    }}
                  >
                    {h.locked ? "LOCKED" : "ACTIVE"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {selected && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(3,4,8,.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          <div style={{ width: "100%", maxWidth: "680px", maxHeight: "88vh", overflowY: "auto", background: "var(--panel-2)", border: "1px solid var(--border-strong)", borderBottom: "none", borderRadius: "20px 20px 0 0", padding: "20px 20px 40px" }}>
            <div style={{ width: "36px", height: "4px", borderRadius: "100px", background: "var(--border-strong)", margin: "0 auto 16px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              {(() => {
                const progress = getLevelProgress(selected.xp);
                const rank = rankForLevel(progress.level);
                return (
                  <>
                    <div style={{ width: "50px", height: "50px", borderRadius: "12px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "20px", border: `1.5px solid ${rank.color}`, color: rank.color, boxShadow: `0 0 16px -4px ${rank.color}` }}>
                      {rank.code}
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "18px" }}>{selected.name}</div>
                      <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--slate)", marginTop: "3px" }}>
                        {selected.email} · {rank.title}
                      </div>
                    </div>
                    <button type="button" onClick={() => setSelectedId(null)} style={{ marginLeft: "auto", width: "32px", height: "32px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.05)", color: "var(--slate)", border: "none", cursor: "pointer", flexShrink: 0 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                );
              })()}
            </div>

            {(() => {
              const progress = getLevelProgress(selected.xp);
              const chips = [
                { v: progress.level, l: "Level" },
                { v: selected.streak, l: "Streak" },
                { v: selected.xp.toLocaleString("en-IN"), l: "Total XP" },
                { v: selected.questCount, l: "Quests done" },
                { v: `₹${selected.walletCredit}`, l: "Wallet credit" },
              ];
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "20px" }}>
                  {chips.map((c) => (
                    <div key={c.l} style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontWeight: 700, fontSize: "16px" }}>{c.v}</div>
                      <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "8.5px", color: "var(--slate)", letterSpacing: "0.04em", textTransform: "uppercase", marginTop: "3px" }}>{c.l}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <span className={styles.secLabel}>Actions</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button type="button" onClick={() => setPanel(panel === "xp" ? "none" : "xp")} style={actionBtnStyle()}>
                Adjust XP / Level
              </button>
              <button type="button" onClick={loadHistory} style={actionBtnStyle()}>
                View quest history
              </button>
              <button type="button" onClick={doToggleLock} style={actionBtnStyle("warn")}>
                {selected.locked ? "Force unlock account" : "Manually lock account"}
              </button>
              <button type="button" onClick={doResetStreak} style={actionBtnStyle("warn")}>
                Reset streak
              </button>
            </div>

            {note && (
              <div style={{ marginTop: "12px", padding: "10px 13px", borderRadius: "9px", background: "rgba(255,77,94,.08)", border: "1px solid rgba(255,77,94,.35)", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11.5px", color: "#ffb3ba" }}>
                {note}
              </div>
            )}

            {panel === "xp" && (
              <div style={{ marginTop: "12px" }}>
                <div className={styles.card} style={{ padding: "16px" }}>
                  <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <span className={styles.fieldLabel}>Level</span>
                      <input className={styles.fieldInput} type="number" value={xpLevelInput} onChange={(e) => setXpLevelInput(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span className={styles.fieldLabel}>Total XP</span>
                      <input className={styles.fieldInput} type="number" value={xpTotalInput} onChange={(e) => setXpTotalInput(e.target.value)} />
                    </div>
                  </div>
                  <button type="button" onClick={saveXp} className={styles.btnDeploy} style={{ height: "38px", fontSize: "13px" }}>
                    Save
                  </button>
                </div>
              </div>
            )}

            {panel === "history" && (
              <div style={{ marginTop: "12px" }}>
                <div className={styles.card} style={{ padding: "16px" }}>
                  {history.length === 0 ? (
                    <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11.5px", color: "var(--slate)" }}>
                      No completions yet.
                    </div>
                  ) : (
                    history.map((h) => (
                      <div key={h.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px" }}>
                        <span style={{ color: "var(--ice)", fontFamily: "var(--font-inter), sans-serif", fontSize: "12.5px" }}>{h.title}</span>
                        <span style={{ color: "var(--blue-2)", flexShrink: 0 }}>+{h.xpAwarded}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function actionBtnStyle(variant?: "warn"): React.CSSProperties {
  return {
    padding: "12px 10px",
    borderRadius: "10px",
    border: `1px solid ${variant === "warn" ? "rgba(255,184,79,.4)" : "var(--border-strong)"}`,
    fontFamily: "var(--font-rajdhani), sans-serif",
    fontWeight: 600,
    fontSize: "12.5px",
    textAlign: "center",
    background: variant === "warn" ? "rgba(255,184,79,.06)" : "rgba(79,157,255,.06)",
    color: variant === "warn" ? "var(--amber)" : "var(--ice)",
    cursor: "pointer",
  };
}
