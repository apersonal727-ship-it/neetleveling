"use client";

import { useState, useTransition } from "react";
import { updateCharacter } from "@/actions/character";
import styles from "../../app/(onboarding)/onboarding.module.css";

const CLASSES: { name: string; desc: string; icon: React.ReactNode }[] = [
  {
    name: "Guardian",
    desc: "Protects the streak above all. Never misses a day.",
    icon: <path d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-4Z" />,
  },
  {
    name: "Scholar",
    desc: "Reads deep, not fast. Every concept, fully understood.",
    icon: <path d="M12 2v20M4 7l8-5 8 5M4 17l8 5 8-5" />,
  },
  {
    name: "Monk",
    desc: "Discipline over motivation. Shows up whether it feels right or not.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18" />
      </>
    ),
  },
  {
    name: "Strategist",
    desc: "Plans every session in advance. Never studies without a target.",
    icon: <path d="M12 2v6M12 22v-6M4.9 4.9l4.2 4.2M14.9 14.9l4.2 4.2M2 12h6M16 12h6M4.9 19.1l4.2-4.2M14.9 9.1l4.2-4.2" />,
  },
  {
    name: "Warrior",
    desc: "Grinds for hours without breaking. Built for endurance, not speed.",
    icon: <path d="M14 2 4 14h7l-1 8 10-12h-7l1-8Z" />,
  },
  {
    name: "Assassin",
    desc: "Strikes weak subjects first. Precise, fast, no wasted motion.",
    icon: <path d="M17 3a2.8 2.8 0 0 1 2 4.8L7 20l-4 1 1-4L16.2 5A2.8 2.8 0 0 1 17 3Z" />,
  },
  {
    name: "Mage",
    desc: "Finds the shortcut through hard topics. Efficient over exhaustive.",
    icon: <path d="M9 3h6M10 3v6l-5 9a1.6 1.6 0 0 0 1.4 2.4h11.2A1.6 1.6 0 0 0 19 18l-5-9V3" />,
  },
  {
    name: "Healer",
    desc: "Recovers fast from bad days. Never lets one miss become two.",
    icon: <path d="M12 21S4 14.5 4 8.8A4.8 4.8 0 0 1 12 5a4.8 4.8 0 0 1 8 3.8C20 14.5 12 21 12 21Z" />,
  },
];

export function CharacterCreationWizard({
  initialName,
  initialClass,
  needsName,
}: {
  initialName: string;
  initialClass: string;
  needsName: boolean;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [hunterClass, setHunterClass] = useState(initialClass);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const totalSteps = 2;
  const canAdvance = !needsName || name.trim().length > 0;

  function handleSubmit() {
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("hunterClass", hunterClass);
    startTransition(async () => {
      const result = await updateCharacter(fd);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <>
      <div className="systemBackdrop" />
      <div className={styles.app}>
        <main className={styles.main} style={{ paddingTop: "var(--sp-6)" }}>
          <div className={styles.stepDots}>
            <span className={`${styles.stepDot} ${step === 0 ? styles.stepDotActive : styles.stepDotDone}`} />
            <span className={`${styles.stepLine} ${step > 0 ? styles.stepLineDone : ""}`} />
            <span className={`${styles.stepDot} ${step === 1 ? styles.stepDotActive : ""}`} />
          </div>

          <div className={styles.panel}>
            {step === 0 && (
              <>
                <span className={styles.panelEyebrow}>
                  <span className={styles.dot} /> Step 1 of {totalSteps}
                </span>
                <h1 className={styles.panelTitle}>Choose your Class.</h1>
                <p className={styles.panelSub}>
                  How do you actually study? This is flavor, not a handicap — every class runs the
                  same quests. You can change it anytime in Settings.
                </p>

                {needsName && (
                  <div className={styles.field} style={{ marginTop: "var(--sp-6)" }}>
                    <div className={styles.card} style={{ padding: "20px" }}>
                      <span className={styles.sectionLabel} style={{ marginBottom: "12px" }}>
                        Hunter Name
                      </span>
                      <input
                        className={styles.fieldInput}
                        type="text"
                        placeholder="e.g. ARJUN_K"
                        maxLength={16}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className={styles.classList} style={{ marginTop: needsName ? 0 : "var(--sp-6)" }}>
                  {CLASSES.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      className={`${styles.classCard} ${hunterClass === c.name ? styles.classCardSelected : ""}`}
                      onClick={() => setHunterClass(c.name)}
                    >
                      <div className={styles.classIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                          {c.icon}
                        </svg>
                      </div>
                      <div className={styles.classInfo}>
                        <div className={styles.className}>{c.name}</div>
                        <div className={styles.classDesc}>{c.desc}</div>
                      </div>
                      <div className={styles.classCheck} />
                    </button>
                  ))}
                </div>

                <div className={styles.stepNav}>
                  <button
                    type="button"
                    className={styles.btnNext}
                    disabled={!canAdvance}
                    onClick={() => setStep(1)}
                  >
                    Continue →
                  </button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <span className={styles.panelEyebrow}>
                  <span className={styles.dot} /> Step 2 of {totalSteps}
                </span>
                <h1 className={styles.panelTitle}>Confirm your Hunter.</h1>
                <p className={styles.panelSub}>
                  This is how you&apos;ll appear in the System.
                </p>

                {error && (
                  <div className={styles.formError} style={{ marginTop: "var(--sp-5)" }}>
                    <span>{error}</span>
                  </div>
                )}

                <div className={styles.summaryBox}>
                  <div className={styles.summaryBoxRow}>
                    <div className={styles.summaryK}>Hunter Name</div>
                    <div className={styles.summaryV}>{name || "—"}</div>
                  </div>
                  <div className={styles.summaryBoxRow}>
                    <div className={styles.summaryK}>Class</div>
                    <div className={styles.summaryV}>{hunterClass}</div>
                  </div>
                  <div className={styles.summaryBoxRow}>
                    <div className={styles.summaryK}>Starting Rank</div>
                    <div className={styles.summaryV} style={{ color: "var(--blue-2)" }}>
                      E-Rank · Level 1
                    </div>
                  </div>
                </div>

                <div className={styles.summaryNote}>
                  Next: unlock full access for ₹99/month. No free tier.
                </div>

                <div className={styles.stepNav}>
                  <button type="button" className={styles.btnBack} onClick={() => setStep(0)}>
                    ← Back
                  </button>
                  <button type="button" className={styles.btnNext} onClick={handleSubmit} disabled={pending}>
                    {pending ? "Activating…" : "Activate The System →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
