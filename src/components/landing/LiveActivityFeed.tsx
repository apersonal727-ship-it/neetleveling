"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/page.module.css";

type FeedLine = {
  id: string;
  time: string;
  text: string;
};

const ACTIONS = [
  () => `reached Rank C — Demon Slayer`,
  () => `completed a 2h Focus Lock — Physics`,
  () => `leveled up to Lv. ${Math.floor(Math.random() * 90) + 5}`,
  () => `hit a 14-day streak`,
  () => `unlocked Rank D — Wolf Slayer`,
  () => `earned +80 XP — Biology quest`,
  () => `applied wallet credit to their bill`,
];

const MAX_LINES = 4;

export function LiveActivityFeed() {
  const [count, setCount] = useState(0);
  const [lines, setLines] = useState<FeedLine[]>([]);
  const usedIds = useRef(new Set<number>());
  const target = useRef(0);

  function nextHunterId() {
    if (usedIds.current.size > 8000) usedIds.current.clear();
    let id: number;
    do {
      id = Math.floor(1000 + Math.random() * 9000);
    } while (usedIds.current.has(id));
    usedIds.current.add(id);
    return `Hunter_${id}`;
  }

  function addLine() {
    const name = nextHunterId();
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)]();
    const time = new Date().toTimeString().slice(0, 5);
    setLines((prev) =>
      [
        { id: crypto.randomUUID(), time, text: `${name} ${action}` },
        ...prev,
      ].slice(0, MAX_LINES),
    );
  }

  useEffect(() => {
    target.current = Math.floor(2420 + Math.random() * 380);
    const dur = 1200;
    const start = performance.now();
    let raf = 0;

    function tick(now: number) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target.current));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        startDrift();
      }
    }
    raf = requestAnimationFrame(tick);

    let driftInterval: ReturnType<typeof setInterval> | undefined;
    function startDrift() {
      const BASE = target.current;
      const BAND = 140;
      driftInterval = setInterval(
        () => {
          setCount((c) => {
            const step = Math.floor(Math.random() * 5) + 1;
            const goUp =
              c < BASE - BAND * 0.6
                ? true
                : c > BASE + BAND * 0.6
                  ? false
                  : Math.random() < 0.5;
            const next = goUp ? c + step : c - step;
            return Math.max(BASE - BAND, Math.min(BASE + BAND, next));
          });
        },
        2500 + Math.random() * 3000,
      );
    }

    for (let i = 0; i < 3; i++) addLine();
    const logInterval = setInterval(addLine, 3200);

    return () => {
      cancelAnimationFrame(raf);
      if (driftInterval) clearInterval(driftInterval);
      clearInterval(logInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.feedCard}>
      <div className={styles.feedTop}>
        <span className={styles.feedLabel}>Live activity</span>
        <span className={styles.eyebrow} style={{ padding: "5px 11px" }}>
          <span className={styles.dotLive} /> Online
        </span>
      </div>
      <div className={styles.feedCount}>
        <span className={`${styles.feedCountNum} mono`}>
          {count.toLocaleString("en-IN")}
        </span>
        <span className={styles.feedCountLbl}>
          Hunters leveling up right now
        </span>
      </div>
      <div className={styles.feedLog}>
        {lines.map((line) => (
          <div key={line.id} className={styles.feedLogLine}>
            <span className={styles.feedLogTime}>{line.time}</span>
            <span>{line.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
