"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { openRankUp } from "@/actions/rank-up";
import { StreakFire } from "@/components/app/StreakFire";
import { ShareCardButton } from "@/components/profile/ShareCardButton";
import { RANK_THEME } from "@/components/rank-up/RankUpCelebration";
import styles from "./ProfileView.module.css";

export type ProfileViewData = {
  name: string;
  rankCode: string;
  rankTitle: string;
  targetExamYear: string | null;
  level: number;
  xpInLevel: number;
  xpForLevel: number;
  xpPct: number;
  info: { location: string | null; coaching: string | null; attemptStatus: string | null; since: string };
  stats: { key: string; icon: "xp" | "class" | "question" | "solved" | "streak" | "best" | "quests" | "penalty"; value: number; label: string; lit?: boolean }[];
  journey: { pct: number; clearedRanks: number; totalRanks: number; levelsToNext: number; nextRankCode: string | null };
  timeline: { code: string; title: string; sub: string; state: "achieved" | "current" | "locked"; clickable: boolean }[];
  fillPct: number;
  share: {
    name: string;
    rankCode: string;
    rankTitle: string;
    level: number;
    xp: number;
    streak: number;
    questsCompleted: number;
    questionsSolved: number;
    targetExamYear: string | null;
  };
};

const STAT_ICON: Record<string, string> = {
  xp: "⚡",
  class: "🎥",
  question: "🧠",
  solved: "🎯",
  best: "🏆",
  quests: "✅",
  penalty: "⚠️",
};
const RING = 2 * Math.PI * 32;

// Rank E has no Rank Up screen (everyone starts there), so it gets a quiet slate theme.
const E_THEME = {
  rc: "#8b93ad",
  rcBright: "#b4bdd6",
  fill1: "rgba(139,147,173,0.14)",
  fill2: "rgba(139,147,173,0.04)",
  shadow1: "rgba(139,147,173,0.3)",
  shadow2: "rgba(139,147,173,0.12)",
  shadow3: "rgba(139,147,173,0.06)",
};

const WRAP = 172;

export function ProfileView({
  data,
  openRank = openRankUp,
}: {
  data: ProfileViewData;
  // Defaults to the real server action; only the QA preview swaps it.
  openRank?: (code: string) => Promise<{ href: string } | { error: string }>;
}) {
  const router = useRouter();
  const [opening, startOpening] = useTransition();
  const root = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const [xpW, setXpW] = useState(0);
  const [particles, setParticles] = useState<{ left: number; drift: number; dur: number; delay: number; op: number }[]>([]);

  // Ambient particles are random, so they're created after mount (never during
  // server render) to keep hydration clean.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only randomness
    setParticles(
      Array.from({ length: 18 }, () => ({
        left: 30 + Math.random() * 40,
        drift: Math.random() * 60 - 30,
        dur: 3 + Math.random() * 3,
        delay: Math.random() * 4,
        op: 0.3 + Math.random() * 0.5,
      })),
    );
    const t = setTimeout(() => setXpW(data.xpPct), 400);
    return () => clearTimeout(t);
  }, [data.xpPct]);

  // Reveal-on-scroll, count-up numbers, journey ring and staggered timeline —
  // same behaviour as the mockup's script.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observers: IntersectionObserver[] = [];

    const reveal = new IntersectionObserver(
      (items) =>
        items.forEach((i) => {
          if (i.isIntersecting) {
            i.target.classList.add(styles.show);
            reveal.unobserve(i.target);
          }
        }),
      { threshold: 0.12 },
    );
    el.querySelectorAll<HTMLElement>("[data-reveal]").forEach((n) => reveal.observe(n));
    observers.push(reveal);

    el.querySelectorAll<HTMLElement>("[data-count]").forEach((n) => {
      const target = Number(n.dataset.count);
      const io = new IntersectionObserver(
        (items) =>
          items.forEach((i) => {
            if (!i.isIntersecting) return;
            const start = performance.now();
            const tick = (now: number) => {
              const p = Math.min((now - start) / 900, 1);
              n.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString("en-IN");
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            io.unobserve(n);
          }),
        { threshold: 0.3 },
      );
      io.observe(n);
      observers.push(io);
    });

    const ring = ringRef.current;
    if (ring) {
      const io = new IntersectionObserver(
        (items) =>
          items.forEach((i) => {
            if (i.isIntersecting) {
              setTimeout(() => (ring.style.strokeDashoffset = String(RING * (1 - data.journey.pct / 100))), 300);
              io.unobserve(i.target);
            }
          }),
        { threshold: 0.3 },
      );
      io.observe(ring);
      observers.push(io);
    }

    const rows = Array.from(el.querySelectorAll<HTMLElement>("[data-trow]"));
    const tl = new IntersectionObserver(
      (items) =>
        items.forEach((i) => {
          if (i.isIntersecting) {
            const idx = rows.indexOf(i.target as HTMLElement);
            setTimeout(() => i.target.classList.add(styles.show), idx * 110);
            tl.unobserve(i.target);
          }
        }),
      { threshold: 0.2 },
    );
    rows.forEach((r) => tl.observe(r));
    observers.push(tl);

    return () => observers.forEach((o) => o.disconnect());
  }, [data.journey.pct]);

  // Unlocked ranks (D and above) reopen their Rank Up screen; the server issues
  // a one-time pass and refuses ranks the hunter hasn't reached.
  function visitRank(code: string) {
    if (opening) return;
    startOpening(async () => {
      const res = await openRank(code);
      if ("href" in res) router.push(res.href);
    });
  }

  const { info, journey } = data;
  const rank = data.rankCode;
  const theme = rank === "E" ? E_THEME : RANK_THEME[rank as keyof typeof RANK_THEME];
  const themeVars = {
    "--rc": theme.rc,
    "--rc-bright": theme.rcBright,
    "--rc-fill1": theme.fill1,
    "--rc-fill2": theme.fill2,
    "--rc-shadow1": theme.shadow1,
    "--rc-shadow2": theme.shadow2,
    "--rc-shadow3": theme.shadow3,
  } as React.CSSProperties;
  const badgeAnim =
    rank === "C" ? styles.animC : rank === "B" ? styles.animB : rank === "S" ? styles.animS : rank === "E" ? "" : styles.animDA;

  return (
    <div className={styles.page} ref={root}>
      <div className={styles.grid} />
      <div className={styles.inner}>
        <div className={styles.topbar}>
          <Link href="/settings" className={styles.back}>
            ← Back
          </Link>
          <ShareCardButton {...data.share} />
        </div>

        {/* PROFILE HERO — aura + particles */}
        <div className={styles.hero} style={themeVars}>
          <div className={styles.particleField}>
            {particles.map((p, i) => (
              <div
                key={i}
                className={styles.particle}
                style={
                  {
                    left: `${p.left}%`,
                    "--drift": `${p.drift}px`,
                    animationDuration: `${p.dur}s`,
                    animationDelay: `${p.delay}s`,
                    opacity: p.op,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>

          {/* Each rank keeps the look it has on its Rank Up screen, looping calmly. */}
          <div className={styles.auraWrap}>
            {rank === "D" && (
              <>
                {Array.from({ length: 9 }).map((_, i) => (
                  <span
                    key={i}
                    className={styles.riseChevron}
                    style={{
                      left: `${14 + ((i * 37) % 72)}%`,
                      animationDelay: `${i * 0.28}s`,
                      animationDuration: `${2.2 + (i % 3) * 0.4}s`,
                    }}
                  />
                ))}
                {/* Outer ring: 8 chevrons on a circle, like Rank B's sparks, lifting in turn. */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i / 8) * 2 * Math.PI - Math.PI / 2;
                  const r = WRAP / 2 - 4;
                  return (
                    <span
                      key={`o${i}`}
                      className={styles.ringChevron}
                      style={{
                        left: WRAP / 2 + r * Math.cos(angle),
                        top: WRAP / 2 + r * Math.sin(angle),
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  );
                })}
              </>
            )}
            {rank === "C" && (
              <>
                <span className={styles.pingRing} />
                <span className={`${styles.pingRing} ${styles.pr2}`} />
              </>
            )}
            {rank === "B" &&
              Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * 2 * Math.PI;
                const r = WRAP / 2 - 5;
                return (
                  <span
                    key={i}
                    className={styles.sparkPiece}
                    style={{
                      left: WRAP / 2 + r * Math.cos(angle),
                      top: WRAP / 2 + r * Math.sin(angle),
                      animationDuration: `${1.4 + (i % 4) * 0.2}s`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                );
              })}
            {rank === "A" && (
              <>
                <div className={`${styles.auraRing} ${styles.r1}`} />
                <div className={`${styles.auraRing} ${styles.r2}`} />
                <div className={styles.auraGlow} />
              </>
            )}
            {rank === "S" && (
              <>
                <span className={styles.rays} />
                <span className={`${styles.shock} ${styles.s1}`} />
                <span className={`${styles.shock} ${styles.s2}`} />
              </>
            )}
            <div className={`${styles.badge} ${badgeAnim}`}>{data.rankCode}</div>
          </div>

          <div className={styles.name}>{data.name.toUpperCase()}</div>
          <div className={styles.title}>
            <span className={styles.sparkle}>◆</span>
            {data.rankTitle}
            <span className={styles.sparkle}>◆</span>
          </div>
          {data.targetExamYear && <div className={styles.target}>Target: {data.targetExamYear}</div>}
          <div className={styles.level}>⚡ LV {data.level}</div>

          <div className={styles.xpBlock}>
            <div className={styles.xpRow}>
              <span>XP To Next Level</span>
              <b>
                {data.xpInLevel.toLocaleString("en-IN")} /{" "}
                {data.xpForLevel > 0 ? data.xpForLevel.toLocaleString("en-IN") : "—"}
              </b>
            </div>
            <div className={styles.xpTrack}>
              <div className={styles.xpFill} style={{ width: `${xpW}%` }} />
            </div>
          </div>
        </div>

        {/* HUNTER INFO */}
        <div className={`${styles.secTag} ${styles.reveal}`} data-reveal>
          <span className={styles.dot} />
          Hunter Info
        </div>
        <div className={`${styles.infoBox} ${styles.reveal}`} data-reveal>
          <div className={styles.infoRow}>
            <div className={styles.infoK}>
              <span className={styles.infoIc}>📍</span>Location
            </div>
            <div className={styles.infoV}>{info.location ?? "—"}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoK}>
              <span className={styles.infoIc}>🏫</span>Coaching / Batch
            </div>
            <div className={styles.infoV}>{info.coaching ?? "—"}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoK}>
              <span className={styles.infoIc}>📘</span>Attempt Status
            </div>
            {info.attemptStatus ? (
              <div className={`${styles.infoV} ${styles.tag}`}>{info.attemptStatus}</div>
            ) : (
              <div className={styles.infoV}>—</div>
            )}
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoK}>
              <span className={styles.infoIc}>🗓</span>Hunter Since
            </div>
            <div className={styles.infoV}>{info.since}</div>
          </div>
        </div>

        {/* STATS */}
        <div className={`${styles.secTag} ${styles.cyan} ${styles.reveal}`} data-reveal>
          <span className={styles.dot} />
          Hunter Stats
        </div>
        <div className={`${styles.stats} ${styles.reveal}`} data-reveal>
          {data.stats.map((s) => (
            <div key={s.key} className={styles.tile}>
              <div className={styles.tileIc}>
                {s.icon === "streak" ? <StreakFire lit={s.lit} size="1em" /> : STAT_ICON[s.icon]}
              </div>
              <div>
                <div className={styles.tileNum} data-count={s.value}>
                  0
                </div>
                <div className={styles.tileLbl}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* JOURNEY TO S-RANK */}
        {journey.nextRankCode && (
          <div className={`${styles.journey} ${styles.reveal}`} data-reveal>
            <div className={styles.ringWrap}>
              <svg className={styles.ringSvg} viewBox="0 0 76 76">
                <circle className={styles.ringTrack} cx="38" cy="38" r="32" />
                <circle
                  ref={ringRef}
                  className={styles.ringProgress}
                  cx="38"
                  cy="38"
                  r="32"
                  strokeDasharray={RING}
                  strokeDashoffset={RING}
                />
              </svg>
              <div className={styles.ringPct}>{journey.pct}%</div>
            </div>
            <div className={styles.journeyText}>
              <div className={styles.journeyTitle}>Journey To S-Rank</div>
              <div className={styles.journeySub}>
                {journey.clearedRanks} of {journey.totalRanks} ranks cleared. <b>{journey.levelsToNext} levels</b> to
                unlock {journey.nextRankCode}-Rank next.
              </div>
            </div>
          </div>
        )}

        {/* RANK TIMELINE */}
        <div className={styles.secTag}>
          <span className={styles.dot} />
          Your Progression
        </div>
        <div className={styles.timeline} style={{ "--fill": `${data.fillPct}%` } as React.CSSProperties}>
          {data.timeline.map((r) => (
            <div
              key={r.code}
              data-trow
              className={`${styles.tRow} ${styles[`tier${r.code}` as keyof typeof styles]} ${styles[r.state]}`}
            >
              <div className={styles.tNode}>
                {r.code}
                {r.state === "locked" && <span className={styles.tLock}>🔒</span>}
              </div>
              <div
                className={`${styles.tCard} ${r.clickable ? styles.clickable : ""}`}
                {...(r.clickable
                  ? {
                      role: "button",
                      tabIndex: 0,
                      "aria-label": `Open the ${r.code}-Rank screen`,
                      onClick: () => visitRank(r.code),
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          visitRank(r.code);
                        }
                      },
                    }
                  : {})}
              >
                <div className={styles.tTitle}>{r.title}</div>
                <div className={styles.tSub}>{r.sub}</div>
                <div className={styles.tStatus}>
                  {r.state === "current" ? "You Are Here" : r.state === "achieved" ? "Cleared" : "Locked"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
