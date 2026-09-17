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
      <div className={styles.controlsRow}>
        <input
          className={styles.searchBox}
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.hunterTable}>
        <div className={styles.tableHead}>
          <div>Hunter</div>
          <div>Level</div>
          <div>Streak</div>
          <div>Status</div>
          <div>Wallet</div>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12.5px", color: "var(--slate)" }}>
            No hunters found
          </div>
        ) : (
          filtered.map((h) => {
            const progress = getLevelProgress(h.xp);
            const rank = rankForLevel(progress.level);
            return (
              <div key={h.id} className={styles.hunterRow} onClick={() => openDetail(h.id)}>
                <div className={styles.hunterId}>
                  <div className={styles.hunterAvatar}>{h.name[0]}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className={styles.hunterName}>{h.name}</div>
                    <div className={styles.hunterEmail}>{h.email}</div>
                  </div>
                </div>
                <div className={styles.colRank} style={{ color: rank.color }}>
                  {rank.code}-Rank · LVL {progress.level}
                </div>
                <div className={styles.colStreak}>{h.streak > 0 ? <b>🔥 {h.streak}d</b> : "—"}</div>
                <div>
                  <span className={`${styles.statusTag} ${h.locked ? styles.locked : styles.active}`}>
                    {h.locked ? "Locked" : "Active"}
                  </span>
                </div>
                <div className={styles.colStreak}>₹{h.walletCredit}</div>
              </div>
            );
          })
        )}
      </div>

      {selected && (
        <div
          className={styles.drawerOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          <div className={styles.drawerPanel}>
            <div className={styles.drawerClose} onClick={() => setSelectedId(null)}>
              ← Close
            </div>

            {(() => {
              const progress = getLevelProgress(selected.xp);
              const rank = rankForLevel(progress.level);
              return (
                <div className={styles.hunterHeader}>
                  <div
                    className={styles.hunterAvatarLg}
                    style={{ color: rank.color, border: `1px solid ${rank.color}`, background: "rgba(79,216,255,0.1)" }}
                  >
                    {rank.code}
                  </div>
                  <div>
                    <div className={styles.hunterHeaderName}>{selected.name}</div>
                    <div className={styles.hunterHeaderEmail}>
                      {selected.email} · {rank.title}
                    </div>
                    <span className={`${styles.statusTag} ${selected.locked ? styles.locked : styles.active}`} style={{ marginTop: "6px" }}>
                      {selected.locked ? "Locked" : "Active"}
                    </span>
                  </div>
                </div>
              );
            })()}

            {(() => {
              const progress = getLevelProgress(selected.xp);
              const chips = [
                { v: progress.level, l: "Level" },
                { v: selected.streak, l: "Streak" },
                { v: selected.xp.toLocaleString("en-IN"), l: "Total XP" },
                { v: selected.questCount, l: "Quests Done" },
                { v: `₹${selected.walletCredit}`, l: "Wallet" },
              ];
              return (
                <div className={styles.statsRow} style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "var(--sp-5)" }}>
                  {chips.map((c) => (
                    <div key={c.l} className={styles.statCard} style={{ textAlign: "center" }}>
                      <div className={styles.statNum} style={{ fontSize: "17px" }}>{c.v}</div>
                      <div className={styles.statLbl}>{c.l}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <span className={styles.secLabel}>
              <span className={styles.dot} />Actions
            </span>
            <div className={styles.actionGrid}>
              <button type="button" onClick={() => setPanel(panel === "xp" ? "none" : "xp")} className={styles.actionBtn}>
                Adjust XP / Level
              </button>
              <button type="button" onClick={loadHistory} className={styles.actionBtn}>
                View Quest History
              </button>
              <button type="button" onClick={doToggleLock} className={`${styles.actionBtn} ${styles.warn}`}>
                {selected.locked ? "Force Unlock Account" : "Manually Lock Account"}
              </button>
              <button type="button" onClick={doResetStreak} className={`${styles.actionBtn} ${styles.warn}`}>
                Reset Streak
              </button>
            </div>

            {note && (
              <div style={{ marginTop: "12px", padding: "10px 13px", background: "rgba(255,77,94,.08)", border: "1px solid rgba(255,77,94,.35)", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11.5px", color: "#ffb3ba" }}>
                {note}
              </div>
            )}

            {panel === "xp" && (
              <div style={{ marginTop: "12px" }}>
                <div className={styles.panelBox} style={{ padding: "16px" }}>
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
                <div className={styles.panelBox} style={{ padding: "16px" }}>
                  {history.length === 0 ? (
                    <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11.5px", color: "var(--slate)" }}>
                      No completions yet.
                    </div>
                  ) : (
                    history.map((h) => (
                      <div key={h.id} className={styles.rowDashed} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                        <span style={{ color: "var(--ice)", fontFamily: "var(--font-body), sans-serif", fontSize: "12.5px" }}>{h.title}</span>
                        <span style={{ color: "var(--blue)", flexShrink: 0 }}>+{h.xpAwarded}</span>
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
