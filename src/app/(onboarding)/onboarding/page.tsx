"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../onboarding.module.css";

const SLIDES = [
  {
    danger: false,
    eyebrow: "Quests have a timer",
    title: "Every quest runs on a real clock.",
    body: "Start a quest and a Focus Lock timer begins. It runs for the quest's full duration — no pausing, no early exit.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
  },
  {
    danger: true,
    eyebrow: "Miss it, get locked",
    title: "Skip a quest's window and you're locked out.",
    body: "A punishment quest is the only way back in — same Start-and-wait mechanic, every time.",
    icon: (
      <>
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
  },
  {
    danger: false,
    eyebrow: "Progression is real",
    title: "Level 0 to 100. Six ranks. No shortcuts.",
    body: "XP comes only from completed quests. About 8 months of consistency stands between you and Shadow Monarch.",
    icon: <path d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-4Z" />,
  },
  {
    danger: false,
    eyebrow: "Last thing",
    title: "You know exactly what you're signing up for.",
    body: "No free tier, no shortcuts around the timer. Just leveling up with a real System that doesn't negotiate.",
    icon: <path d="M20 6 9 17l-5-5" />,
  },
];

export default function OnboardingPage() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();
  const touchStartX = useRef<number | null>(null);

  function goToCheckout() {
    router.push("/checkout");
  }

  function next() {
    if (current < SLIDES.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      goToCheckout();
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40 && current < SLIDES.length - 1) setCurrent((c) => c + 1);
    else if (dx > 40 && current > 0) setCurrent((c) => c - 1);
    touchStartX.current = null;
  }

  return (
    <div className={styles.appFixed}>
      <div className={styles.topRow}>
        <div className={styles.stepTrack}>
          <div className={styles.stepFill} style={{ width: "75%" }} />
        </div>
        <div className={styles.row2}>
          <span className={styles.stepLabel}>Step 3 of 4 · How It Works</span>
          <button type="button" className={styles.skipBtn} onClick={goToCheckout}>
            Skip
          </button>
        </div>
      </div>

      <div className={styles.dots}>
        {SLIDES.map((_, i) => (
          <span key={i} className={`${styles.dot} ${i === current ? styles.dotActive : ""}`} />
        ))}
      </div>

      <div className={styles.slides} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {SLIDES.map((slide, i) => (
          <div
            key={slide.title}
            className={`${styles.slide} ${
              i === current ? styles.slideActive : i < current ? styles.slideExitLeft : ""
            }`}
          >
            <div className={`${styles.iconRing} ${slide.danger ? styles.iconRingDanger : ""}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                {slide.icon}
              </svg>
            </div>
            <span className={`${styles.slideEyebrow} ${slide.danger ? styles.slideEyebrowDanger : ""}`}>
              {slide.eyebrow}
            </span>
            <h1>{slide.title}</h1>
            <p>{slide.body}</p>
          </div>
        ))}
      </div>

      <div className={styles.bottom}>
        <button type="button" className={styles.btnPrimary} onClick={next}>
          <span>{current === SLIDES.length - 1 ? "I'm ready" : "Next"}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
