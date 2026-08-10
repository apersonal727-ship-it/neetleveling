"use client";

import { useEffect, useRef } from "react";
import styles from "@/app/(app)/history/history.module.css";

export function HeatmapScroller({
  cells,
}: {
  cells: { date: string; state: "" | "l1" | "l2" | "l3" | "miss" }[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = ref.current.scrollWidth;
  }, []);

  const stateClass = {
    "": "",
    l1: styles.hcellL1,
    l2: styles.hcellL2,
    l3: styles.hcellL3,
    miss: styles.hcellMiss,
  } as const;

  return (
    <div className={styles.heatmapScroll} ref={ref}>
      <div className={styles.heatmapGrid}>
        {cells.map((cell) => (
          <div key={cell.date} className={`${styles.hcell} ${stateClass[cell.state]}`} />
        ))}
      </div>
    </div>
  );
}
