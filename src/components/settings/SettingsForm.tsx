"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  updateHunterName,
  updateClass,
  updateTargetExamYear,
  updateNotificationPref,
  cancelSubscription,
} from "@/actions/settings";
import { signOut } from "@/actions/auth";
import appStyles from "@/app/(app)/app.module.css";
import onboardingStyles from "@/app/(onboarding)/onboarding.module.css";
import styles from "@/app/(app)/settings/settings.module.css";

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

export function SettingsForm({
  profile,
}: {
  profile: {
    name: string;
    email: string;
    hunterClass: string;
    targetExamYear: string | null;
    questReminders: boolean;
    streakWarnings: boolean;
    penaltyAlerts: boolean;
    timerWarnings: boolean;
    walletUpdates: boolean;
    subscriptionStatus: string;
    subscriptionRenewsAt: Date | null;
  };
}) {
  const [name, setName] = useState(profile.name);
  const [hunterClass, setHunterClass] = useState(profile.hunterClass);
  const [targetExamYear, setTargetExamYear] = useState(profile.targetExamYear ?? "");
  const [prefs, setPrefs] = useState({
    streakWarnings: profile.streakWarnings,
    penaltyAlerts: profile.penaltyAlerts,
    timerWarnings: profile.timerWarnings,
    walletUpdates: profile.walletUpdates,
  });
  const [savingName, startSavingName] = useTransition();
  const [nameSaved, setNameSaved] = useState(false);
  const [savingExamYear, startSavingExamYear] = useTransition();
  const [examYearSaved, setExamYearSaved] = useState(false);
  const [canceling, startCanceling] = useTransition();
  const [canceled, setCanceled] = useState(profile.subscriptionStatus === "CANCELED");

  function saveName() {
    const fd = new FormData();
    fd.set("name", name);
    startSavingName(async () => {
      await updateHunterName(fd);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 1500);
    });
  }

  function saveExamYear() {
    const fd = new FormData();
    fd.set("targetExamYear", targetExamYear);
    startSavingExamYear(async () => {
      await updateTargetExamYear(fd);
      setExamYearSaved(true);
      setTimeout(() => setExamYearSaved(false), 1500);
    });
  }

  function pickClass(cls: string) {
    setHunterClass(cls);
    updateClass(cls);
  }

  function togglePref(key: keyof typeof prefs) {
    const next = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: next }));
    updateNotificationPref(key, next);
  }

  function handleCancel() {
    if (!confirm("Cancel your subscription? Access continues until your current cycle ends.")) {
      return;
    }
    startCanceling(async () => {
      await cancelSubscription();
      setCanceled(true);
    });
  }

  return (
    <>
      <div className={appStyles.pageHead}>
        <span className={appStyles.pageEyebrow}>
          <span className={appStyles.dot} />
          Account
        </span>
        <h1>Settings</h1>
      </div>

      <section>
        <Link href="/profile" className={`${appStyles.card} ${styles.rowLink}`}>
          <div className={styles.rlTitle}>View Hunter Profile</div>
          <div className={styles.rlArrow}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </div>
        </Link>
      </section>

      <section>
        <span className={appStyles.secLabel}>Profile</span>
        <div className={`${appStyles.card} ${styles.fieldCard}`}>
          <span className={styles.fieldLabel}>Hunter Name</span>
          <div className={styles.fieldRow}>
            <input
              className={styles.fieldInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={16}
            />
            <button type="button" className={styles.fieldBtn} onClick={saveName} disabled={savingName || !name}>
              {savingName ? "Saving…" : nameSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
        <div className={`${appStyles.card} ${styles.fieldCard}`} style={{ marginTop: "8px" }}>
          <span className={styles.fieldLabel}>Email</span>
          <div className={styles.fieldRow}>
            <input className={styles.fieldInput} value={profile.email} disabled style={{ opacity: 0.6 }} />
          </div>
        </div>
        <div className={`${appStyles.card} ${styles.fieldCard}`} style={{ marginTop: "8px" }}>
          <span className={styles.fieldLabel}>Target Exam Year</span>
          <div className={styles.fieldRow}>
            <input
              className={styles.fieldInput}
              value={targetExamYear}
              onChange={(e) => setTargetExamYear(e.target.value)}
              placeholder="e.g. NEET UG 2027"
              maxLength={24}
            />
            <button
              type="button"
              className={styles.fieldBtn}
              onClick={saveExamYear}
              disabled={savingExamYear}
            >
              {savingExamYear ? "Saving…" : examYearSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </section>

      <section>
        <span className={appStyles.secLabel}>Class</span>
        <div className={onboardingStyles.classList}>
          {CLASSES.map((c) => (
            <button
              key={c.name}
              type="button"
              className={`${onboardingStyles.classCard} ${
                hunterClass === c.name ? onboardingStyles.classCardSelected : ""
              }`}
              onClick={() => pickClass(c.name)}
            >
              <div className={onboardingStyles.classIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  {c.icon}
                </svg>
              </div>
              <div className={onboardingStyles.classInfo}>
                <div className={onboardingStyles.className}>{c.name}</div>
                <div className={onboardingStyles.classDesc}>{c.desc}</div>
              </div>
              <div className={onboardingStyles.classCheck} />
            </button>
          ))}
        </div>
      </section>

      <section>
        <span className={appStyles.secLabel}>Notifications</span>
        <div className={appStyles.card}>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Daily Quest Drop (5 AM)</div>
              <div className={styles.toggleSub}>🔒 Required — this is how quests reach you.</div>
            </div>
            <button type="button" className={`${styles.switch} ${styles.switchOn}`} disabled style={{ opacity: 0.6, cursor: "default" }} />
          </div>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Timer Running Out Warning</div>
              <div className={styles.toggleSub}>Nudge in the last hour before reset</div>
            </div>
            <button
              type="button"
              className={`${styles.switch} ${prefs.timerWarnings ? styles.switchOn : ""}`}
              onClick={() => togglePref("timerWarnings")}
            />
          </div>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Streak Reminder</div>
              <div className={styles.toggleSub}>Alert when a streak is at risk</div>
            </div>
            <button
              type="button"
              className={`${styles.switch} ${prefs.streakWarnings ? styles.switchOn : ""}`}
              onClick={() => togglePref("streakWarnings")}
            />
          </div>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Referral &amp; Wallet Updates</div>
              <div className={styles.toggleSub}>When a referral credits your wallet</div>
            </div>
            <button
              type="button"
              className={`${styles.switch} ${prefs.walletUpdates ? styles.switchOn : ""}`}
              onClick={() => togglePref("walletUpdates")}
            />
          </div>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Penalty alerts</div>
              <div className={styles.toggleSub}>Notify the moment a lock triggers</div>
            </div>
            <button
              type="button"
              className={`${styles.switch} ${prefs.penaltyAlerts ? styles.switchOn : ""}`}
              onClick={() => togglePref("penaltyAlerts")}
            />
          </div>
        </div>
      </section>

      <section>
        <span className={appStyles.secLabel}>Subscription</span>
        <div className={appStyles.card}>
          <div className={styles.rowLink}>
            <div>
              <div className={styles.rlTitle}>Hunter Access</div>
              <div className={styles.rlSub}>
                ₹99/mo
                {profile.subscriptionRenewsAt &&
                  ` · renews ${profile.subscriptionRenewsAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
              </div>
            </div>
            <span className={styles.planBadge}>{canceled ? "CANCELED" : "ACTIVE"}</span>
          </div>
          <Link href="/billing" className={styles.rowLink}>
            <div className={styles.rlTitle}>Manage billing</div>
            <div className={styles.rlArrow}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </Link>
          {!canceled && (
            <button
              type="button"
              className={styles.rowLink}
              style={{ width: "100%", textAlign: "left", border: "none", background: "none", cursor: "pointer" }}
              onClick={handleCancel}
              disabled={canceling}
            >
              <div className={styles.rlTitle}>{canceling ? "Canceling…" : "Cancel subscription"}</div>
              <div className={styles.rlArrow}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </div>
            </button>
          )}
        </div>
      </section>

      <section>
        <span className={appStyles.secLabel}>Support</span>
        <div className={appStyles.card}>
          <Link href="/report-bug" className={styles.rowLink}>
            <div className={styles.rlTitle}>Report an issue</div>
            <div className={styles.rlArrow}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </Link>
        </div>
      </section>

      <section>
        <span className={appStyles.secLabel}>Account</span>
        <div className={appStyles.card}>
          <Link href="/change-password" className={styles.rowLink}>
            <div className={styles.rlTitle}>Change password</div>
            <div className={styles.rlArrow}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </Link>
          <div className={styles.rowLink}>
            <div className={styles.rlTitle}>Language — English</div>
          </div>
          <button
            type="button"
            className={`${styles.rowLink} ${styles.rlDanger}`}
            style={{ width: "100%", textAlign: "left", border: "none", background: "none", cursor: "pointer" }}
            onClick={() => signOut()}
          >
            <div className={styles.rlTitle}>Log out</div>
            <div className={styles.rlArrow}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </button>
          <Link href="/delete-account" className={`${styles.rowLink} ${styles.rlDanger}`}>
            <div className={styles.rlTitle}>Delete account</div>
            <div className={styles.rlArrow}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}
