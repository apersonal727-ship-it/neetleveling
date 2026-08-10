"use client";

import { useState, useTransition } from "react";
import { updateCharacter } from "@/actions/character";
import styles from "../onboarding.module.css";

const AURAS = [
  { color: "red", hex: "#ff5c4d" },
  { color: "blue", hex: "#4f9dff" },
  { color: "green", hex: "#3ddc84" },
  { color: "gold", hex: "#ffc94f" },
];

const CLASSES: { name: string; icon: React.ReactNode }[] = [
  {
    name: "Guardian",
    icon: (
      <path d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-4Z" />
    ),
  },
  {
    name: "Scholar",
    icon: <path d="M12 2v20M4 7l8-5 8 5M4 17l8 5 8-5" />,
  },
  {
    name: "Monk",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18" />
      </>
    ),
  },
  {
    name: "Strategist",
    icon: (
      <path d="M12 2v6M12 22v-6M4.9 4.9l4.2 4.2M14.9 14.9l4.2 4.2M2 12h6M16 12h6M4.9 19.1l4.2-4.2M14.9 9.1l4.2-4.2" />
    ),
  },
  {
    name: "Warrior",
    icon: <path d="M14 2 4 14h7l-1 8 10-12h-7l1-8Z" />,
  },
  {
    name: "Assassin",
    icon: <path d="M17 3a2.8 2.8 0 0 1 2 4.8L7 20l-4 1 1-4L16.2 5A2.8 2.8 0 0 1 17 3Z" />,
  },
  {
    name: "Mage",
    icon: <path d="M9 3h6M10 3v6l-5 9a1.6 1.6 0 0 0 1.4 2.4h11.2A1.6 1.6 0 0 0 19 18l-5-9V3" />,
  },
  {
    name: "Healer",
    icon: <path d="M12 21S4 14.5 4 8.8A4.8 4.8 0 0 1 12 5a4.8 4.8 0 0 1 8 3.8C20 14.5 12 21 12 21Z" />,
  },
];

export default function CharacterCreationPage() {
  const [name, setName] = useState("");
  const [aura, setAura] = useState("red");
  const [hunterClass, setHunterClass] = useState("Scholar");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateCharacter(formData);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <>
      <div className={styles.bgGrid} />
      <div className={styles.app}>
        <header className={styles.header}>
          <div className={styles.stepTrack}>
            <div className={styles.stepFill} style={{ width: "50%" }} />
          </div>
          <span className={styles.stepLabel}>Step 2 of 4 · Hunter Profile</span>
        </header>

        <main className={styles.main}>
          <div className={styles.pageHead}>
            <h1>Choose your Hunter identity.</h1>
            <p>You can change your aura and class anytime in Settings.</p>
          </div>

          <form action={handleSubmit}>
            {error && (
              <div className={styles.formError} style={{ marginBottom: "24px" }}>
                <span>{error}</span>
              </div>
            )}

            <input type="hidden" name="auraColor" value={aura} />
            <input type="hidden" name="hunterClass" value={hunterClass} />

            <div className={styles.field}>
              <div className={`${styles.card}`} style={{ padding: "20px" }}>
                <span className={styles.sectionLabel} style={{ marginBottom: "12px" }}>
                  Hunter Name
                </span>
                <input
                  className={styles.fieldInput}
                  name="name"
                  type="text"
                  placeholder="e.g. ARJUN_K"
                  maxLength={16}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <section>
              <span className={styles.sectionLabel}>Aura</span>
              <div className={`${styles.card} ${styles.auraRow}`}>
                {AURAS.map((a) => (
                  <button
                    key={a.color}
                    type="button"
                    className={`${styles.auraOpt} ${aura === a.color ? styles.auraOptSelected : ""}`}
                    onClick={() => setAura(a.color)}
                  >
                    <div className={styles.auraDiamond} />
                    <svg
                      className={styles.auraFlame}
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{
                        color: a.hex,
                        filter: `drop-shadow(0 0 8px ${a.hex}b3)`,
                      }}
                    >
                      <path
                        d="M12 2C12 2 7 7.5 7 13a5 5 0 0 0 10 0c0-1.2-.4-2-1-2.8.1 1-.3 1.8-1 2.3.3-2.5-1-4-1.6-5.2C13 6 13.4 4 12 2Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="0.6"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <span className={styles.sectionLabel}>Class</span>
              <div className={`${styles.card} ${styles.classGrid}`}>
                {CLASSES.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className={`${styles.classItem} ${
                      hunterClass === c.name ? styles.classItemSelected : ""
                    }`}
                    onClick={() => setHunterClass(c.name)}
                  >
                    <div className={styles.classIcon}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        {c.icon}
                      </svg>
                    </div>
                    <span className={styles.className}>{c.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <button type="submit" className={styles.btnPrimary} disabled={!name || pending}>
              Continue to Unlock
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
        </main>
      </div>
    </>
  );
}
