"use client";

import { useRef, useState } from "react";
import styles from "./ShareCardButton.module.css";

export function ShareCardButton({
  name,
  rankCode,
  rankTitle,
  level,
  xp,
  streak,
  questsCompleted,
  questionsSolved,
  targetExamYear,
}: {
  name: string;
  rankCode: string;
  rankTitle: string;
  level: number;
  xp: number;
  streak: number;
  questsCompleted: number;
  questionsSolved: number;
  targetExamYear: string | null;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#05060c",
        scale: 2,
        useCORS: true,
      });

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;

      const filename = `${name.toLowerCase().replace(/\s+/g, "-")}-hunter-profile.png`;
      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "My Hunter Profile — NEETLeveling",
            text: `Rank ${rankCode} · Level ${level} · ${streak}-day streak. Turning NEET prep into a System.`,
          });
        } catch {
          // user canceled the native share sheet — no action needed
        }
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={styles.shareTrigger} onClick={handleShare} disabled={busy}>
        {busy ? "⏳ Generating…" : "📤 Share"}
      </button>

      <div className={styles.shareCardWrap} aria-hidden="true">
        <div className={styles.shareCard} ref={cardRef}>
          <div className={styles.scLogo}>
            <span className={styles.scLogoMark} />
            <span className={styles.scLogoText}>NEETLEVELING</span>
          </div>
          <div className={styles.scBadge}>{rankCode}</div>
          <div className={styles.scName}>{name.toUpperCase()}</div>
          <div className={styles.scTitle}>{rankTitle}</div>
          <div className={styles.scLevel}>⚡ LV {level}</div>
          <div className={styles.scStats}>
            <div className={styles.scStat}>
              <div className={styles.scStatNum}>{xp.toLocaleString("en-IN")}</div>
              <div className={styles.scStatLbl}>Total XP</div>
            </div>
            <div className={styles.scStat}>
              <div className={styles.scStatNum}>{streak.toLocaleString("en-IN")}</div>
              <div className={styles.scStatLbl}>Day Streak</div>
            </div>
            <div className={styles.scStat}>
              <div className={styles.scStatNum}>{questsCompleted.toLocaleString("en-IN")}</div>
              <div className={styles.scStatLbl}>Quests Cleared</div>
            </div>
            <div className={styles.scStat}>
              <div className={styles.scStatNum}>{questionsSolved.toLocaleString("en-IN")}</div>
              <div className={styles.scStatLbl}>Questions Solved</div>
            </div>
          </div>
          <div className={styles.scFooter}>
            {targetExamYear ? `Target: ${targetExamYear} · ` : ""}
            <b>neetleveling.in</b>
          </div>
        </div>
      </div>
    </>
  );
}
