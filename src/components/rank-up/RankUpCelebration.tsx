"use client";

import { useEffect, useRef, useState } from "react";
import type { RankCode } from "@/lib/rank";
import styles from "@/app/rank-up/rank-up.module.css";

// One-off celebration theming, distinct from — and never applied to — the
// ordinary rank badge color used everywhere else (dashboard, profile always
// stay a steady cyan/blue regardless of rank, matching the mockups). This
// map exists solely for this one screen's fireworks.
const THEME: Record<
  Exclude<RankCode, "E">,
  {
    rc: string;
    rcBright: string;
    tagBg: string;
    fill1: string;
    fill2: string;
    shadow1: string;
    shadow2: string;
    shadow3: string;
    gridTint: string;
    glowTint: string;
    flashTint: string;
    confetti: string[];
    confettiCount: number;
  }
> = {
  D: {
    rc: "#4ade80",
    rcBright: "#7ee8a5",
    tagBg: "rgba(74,222,128,0.08)",
    fill1: "rgba(74,222,128,0.16)",
    fill2: "rgba(74,222,128,0.04)",
    shadow1: "rgba(74,222,128,0.4)",
    shadow2: "rgba(74,222,128,0.2)",
    shadow3: "rgba(74,222,128,0.1)",
    gridTint: "rgba(74,222,128,0.06)",
    glowTint: "rgba(74,222,128,0.14)",
    flashTint: "rgba(74,222,128,0.5)",
    confetti: ["#4ade80", "#7ee8a5", "#2d8a55"],
    confettiCount: 32,
  },
  C: {
    rc: "#4fd8ff",
    rcBright: "#8fe8ff",
    tagBg: "rgba(79,216,255,0.08)",
    fill1: "rgba(79,216,255,0.16)",
    fill2: "rgba(139,92,246,0.08)",
    shadow1: "rgba(79,216,255,0.5)",
    shadow2: "rgba(79,216,255,0.2)",
    shadow3: "rgba(79,216,255,0.1)",
    gridTint: "rgba(79,216,255,0.07)",
    glowTint: "rgba(79,216,255,0.14)",
    flashTint: "rgba(79,216,255,0.5)",
    confetti: ["#4fd8ff", "#f5c542", "#8b5cf6", "#4ade80"],
    confettiCount: 60,
  },
  B: {
    rc: "#f59e4a",
    rcBright: "#ffc98a",
    tagBg: "rgba(245,158,74,0.08)",
    fill1: "rgba(245,158,74,0.18)",
    fill2: "rgba(245,158,74,0.05)",
    shadow1: "rgba(245,158,74,0.55)",
    shadow2: "rgba(245,158,74,0.22)",
    shadow3: "rgba(245,158,74,0.1)",
    gridTint: "rgba(245,158,74,0.07)",
    glowTint: "rgba(245,158,74,0.14)",
    flashTint: "rgba(245,158,74,0.4)",
    confetti: [],
    confettiCount: 0,
  },
  A: {
    rc: "#8b5cf6",
    rcBright: "#b794f6",
    tagBg: "rgba(139,92,246,0.1)",
    fill1: "rgba(139,92,246,0.2)",
    fill2: "rgba(139,92,246,0.06)",
    shadow1: "rgba(139,92,246,0.5)",
    shadow2: "rgba(139,92,246,0.25)",
    shadow3: "rgba(139,92,246,0.1)",
    gridTint: "rgba(139,92,246,0.08)",
    glowTint: "rgba(139,92,246,0.18)",
    flashTint: "rgba(139,92,246,0.5)",
    confetti: ["#8b5cf6", "#b794f6", "#4fd8ff"],
    confettiCount: 55,
  },
  S: {
    rc: "#f5c542",
    rcBright: "#ffe08a",
    tagBg: "rgba(245,197,66,0.12)",
    fill1: "rgba(245,197,66,0.24)",
    fill2: "rgba(245,197,66,0.06)",
    shadow1: "rgba(245,197,66,0.6)",
    shadow2: "rgba(245,197,66,0.3)",
    shadow3: "rgba(245,197,66,0.12)",
    gridTint: "rgba(245,197,66,0.08)",
    glowTint: "rgba(245,197,66,0.22)",
    flashTint: "rgba(245,197,66,0.6)",
    confetti: ["#f5c542", "#ffe08a", "#4fd8ff", "#8b5cf6", "#ffffff"],
    confettiCount: 90,
  },
};

const BADGE_SIZE: Record<Exclude<RankCode, "E">, { wrap: number; badge: number; font: number }> = {
  D: { wrap: 150, badge: 118, font: 56 },
  C: { wrap: 132, badge: 132, font: 58 },
  B: { wrap: 220, badge: 144, font: 62 },
  A: { wrap: 200, badge: 128, font: 56 },
  S: { wrap: 240, badge: 150, font: 66 },
};

export function RankUpCelebration({
  rank,
  fromRank,
  title,
  flavor,
  hunterName,
  level,
  streak,
  questsCleared,
  totalXp,
  isFirstRankUp,
}: {
  rank: Exclude<RankCode, "E">;
  fromRank: string;
  title: string;
  flavor: string;
  hunterName: string;
  level: number;
  streak: number;
  questsCleared: number;
  totalXp: number;
  isFirstRankUp: boolean;
}) {
  const particleLayerRef = useRef<HTMLDivElement>(null);
  const [effectsMounted, setEffectsMounted] = useState(false);
  const theme = THEME[rank];
  const size = BADGE_SIZE[rank];
  const isMax = rank === "S";

  useEffect(() => {
    setEffectsMounted(true);
    const layer = particleLayerRef.current;
    if (!layer) return;

    if (rank === "B") {
      for (let i = 0; i < 26; i++) {
        const ember = document.createElement("div");
        ember.className = styles.emberPiece;
        ember.style.left = `${20 + Math.random() * 60}%`;
        ember.style.setProperty("--drift", `${Math.random() * 80 - 40}px`);
        ember.style.setProperty("--rc", theme.rc);
        ember.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
        ember.style.animationDelay = `${Math.random() * 3}s`;
        ember.style.opacity = `${0.4 + Math.random() * 0.5}`;
        layer.appendChild(ember);
      }
      return () => {
        layer.innerHTML = "";
      };
    }

    const pieces: HTMLDivElement[] = [];
    for (let i = 0; i < theme.confettiCount; i++) {
      const piece = document.createElement("div");
      piece.className = rank === "D" ? styles.sproutPiece : styles.confettiPiece;
      piece.style.left = `${Math.random() * 100}%`;
      if (rank === "D") {
        piece.style.setProperty("--rc", theme.rc);
      } else {
        piece.style.background = theme.confetti[Math.floor(Math.random() * theme.confetti.length)];
        if (Math.random() > 0.5) piece.style.borderRadius = "50%";
      }
      piece.style.animationDelay = `${Math.random() * 0.6}s`;
      piece.style.animationDuration = `${2 + Math.random() * 1.5}s`;
      piece.style.opacity = `${0.5 + Math.random() * 0.4}`;
      layer.appendChild(piece);
      pieces.push(piece);
    }
    const clearTimer = setTimeout(() => {
      pieces.forEach((p) => p.remove());
    }, 4600);
    return () => {
      clearTimeout(clearTimer);
      layer.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rank]);

  const rcVars = {
    "--rc": theme.rc,
    "--rc-bright": theme.rcBright,
    "--rc-fill1": theme.fill1,
    "--rc-fill2": theme.fill2,
    "--rc-shadow1": theme.shadow1,
    "--rc-shadow2": theme.shadow2,
    "--rc-shadow3": theme.shadow3,
    "--tag-bg": theme.tagBg,
    "--grid-tint": theme.gridTint,
    "--glow-tint": theme.glowTint,
    "--flash-tint": theme.flashTint,
  } as React.CSSProperties;

  return (
    <div style={rcVars}>
      <div className={styles.bgGrid} />
      <div className={styles.glowBg} />
      {effectsMounted && <div className={styles.flashLayer} />}
      <div className={styles.particleLayer} ref={particleLayerRef} />

      <div className={styles.wrap}>
        <span className={styles.tag}>
          <span className={styles.dot} /> {isMax ? "Maximum Rank" : "Rank Up"}
        </span>
        {isMax && <div className={styles.crown}>👑</div>}

        <div className={styles.transitionLine}>
          <span className={styles.old}>{fromRank}-RANK</span>
          <span className={styles.arrow}>→</span>
          <span className={styles.new}>{rank}-RANK</span>
        </div>

        <div className={styles.badgeWrap} style={{ width: size.wrap, height: size.wrap }}>
          {rank === "D" && (
            <>
              <span className={styles.growthRing} />
              <span className={`${styles.growthRing} ${styles.r2 ?? ""}`} style={{ animationDelay: "0.65s" }} />
            </>
          )}
          {rank === "C" && (
            <>
              <span className={styles.pingRing} />
              <span className={styles.pingRing} style={{ animationDelay: "2.2s" }} />
            </>
          )}
          {rank === "B" &&
            Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * 2 * Math.PI;
              const r = size.wrap / 2 - 5;
              const x = size.wrap / 2 + r * Math.cos(angle);
              const y = size.wrap / 2 + r * Math.sin(angle);
              return (
                <span
                  key={i}
                  className={styles.sparkPiece}
                  style={{
                    left: x,
                    top: y,
                    transform: "translate(-50%,-50%)",
                    animationDuration: `${1.4 + (i % 4) * 0.2}s`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              );
            })}
          {rank === "A" && (
            <>
              <span className={`${styles.auraRing} ${styles.r1 ?? ""}`} />
              <span className={`${styles.auraRing} ${styles.r2 ?? ""}`} />
              <span className={styles.auraGlow} />
            </>
          )}
          {rank === "S" && (
            <>
              <span className={styles.rays} />
              <span className={`${styles.shock} ${styles.s1 ?? ""}`} />
              <span className={`${styles.shock} ${styles.s2 ?? ""}`} />
            </>
          )}
          <div
            className={`${styles.rankBadge} ${
              rank === "C" ? styles.badgeBreathe : rank === "B" ? styles.badgeFlicker : rank === "S" ? styles.badgeRadiate : ""
            }`}
            style={{ width: size.badge, height: size.badge, fontSize: size.font }}
          >
            {rank}
          </div>
        </div>

        <div className={styles.rankTitle}>{title}</div>
        <div className={styles.rankLine}>
          {hunterName.toUpperCase()} · RANK {rank} · LEVEL {level}
        </div>
        <div className={styles.rankFlavor}>&quot;{flavor}&quot;</div>
        {isFirstRankUp && (
          <div className={styles.firstNote}>🌱 Your first rank cleared. Everyone remembers this one.</div>
        )}
        {isMax && (
          <div className={styles.maxNote}>👑 The rarest rank in the arena. Not everyone gets here.</div>
        )}

        <div className={styles.statsRow}>
          <div className={styles.statPill}>
            <div className={styles.num}>{streak}</div>
            <div className={styles.lbl}>Day Streak</div>
          </div>
          <div className={styles.statPill}>
            <div className={styles.num}>{questsCleared.toLocaleString("en-IN")}</div>
            <div className={styles.lbl}>Quests Cleared</div>
          </div>
          <div className={styles.statPill}>
            <div className={styles.num}>{totalXp.toLocaleString("en-IN")}</div>
            <div className={styles.lbl}>Total XP</div>
          </div>
        </div>

        <a href="/profile" className={styles.continueBtn}>
          Continue →
        </a>
      </div>
    </div>
  );
}
