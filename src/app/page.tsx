import Link from "next/link";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { LiveActivityFeed } from "@/components/landing/LiveActivityFeed";
import styles from "./page.module.css";

const RANKS: {
  code: string;
  color: string;
  name: string;
  levels: string;
  final?: boolean;
}[] = [
  { code: "E", color: "#5d708f", name: "World's Weakest NEET Hunter", levels: "LEVEL 0 – 19" },
  { code: "D", color: "#4f9dff", name: "Wolf Slayer", levels: "LEVEL 20 – 39" },
  { code: "C", color: "#5fb2ff", name: "Demon Slayer", levels: "LEVEL 40 – 59" },
  { code: "B", color: "#7cc7ff", name: "Necromancer", levels: "LEVEL 60 – 79" },
  { code: "A", color: "#a7dcff", name: "Shadow Lord", levels: "LEVEL 80 – 99" },
  { code: "S", color: "#ffffff", name: "Shadow Monarch", levels: "LEVEL 100", final: true },
];

const RAMP = [
  { day: "Day 1", count: 10 },
  { day: "Day 2", count: 12 },
  { day: "Day 3", count: 14 },
  { day: "Day 4", count: 18 },
  { day: "Day 5", count: 20 },
  { day: "Day 7", count: 26 },
  { day: "Day 10", count: 38 },
];

const STATS = [
  { key: "INT", desc: "Physics, Chem, Bio study hours" },
  { key: "DIS", desc: "Wake-up time, no-phone hours, mocks" },
  { key: "VIT", desc: "Sleep, exercise, diet" },
  { key: "FOC", desc: "Deep-work & meditation blocks" },
  { key: "PER", desc: "Streak length, consistency" },
];

const PRICE_FEATURES = [
  "Unlimited daily quests from the System",
  "Full leveling, rank & stat system",
  "Focus Lock quest timers",
  "Penalty & punishment quest system",
  "Full quest history & analytics",
  "Referral wallet — credit toward your own bill",
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.bgGrid} />

      <header className={styles.header}>
        <nav className={`${styles.wrap} ${styles.nav}`}>
          <div className={styles.brand}>
            <FlameIcon className={styles.flame} />
            NEETLEVELING
          </div>
          <Link href="/login" className={styles.navCta}>
            Login
          </Link>
        </nav>
      </header>

      <main>
        <section className={`${styles.hero} ${styles.wrap}`}>
          <div className={styles.heroInner}>
            <div>
              <span className={styles.eyebrow}>
                <span className={styles.dotLive} /> System message detected
              </span>
              <h1>You&apos;ve Been Selected As A Hunter.</h1>
              <p
                style={{
                  fontSize: "clamp(15px, 3.7vw, 17px)",
                  color: "var(--slate)",
                  lineHeight: 1.65,
                  maxWidth: "48ch",
                }}
              >
                NEETLeveling turns your prep into daily quests with real timers, real deadlines, and a rank that
                only rises when the work is actually done. No shortcuts. No free tier. Just the grind — gamified.
              </p>
              <div className={styles.heroCtas}>
                <a href="#pricing" className={`${styles.btn} ${styles.btnPrimary}`}>
                  Begin Awakening — ₹99/mo
                </a>
                <a href="#system" className={`${styles.btn} ${styles.btnGhost}`}>
                  See how it works
                </a>
              </div>
            </div>

            <LiveActivityFeed />
          </div>
        </section>

        <section id="system" className={`${styles.section} ${styles.wrap}`}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>The System</span>
            <h2 className={styles.sectionTitle}>Every hunter starts exactly like you.</h2>
          </div>

          <div className={styles.narrative}>
            <div className={styles.sysQuote}>
              [SYSTEM]: Talent — irrelevant. Motivation — irrelevant. One variable is being tracked: did you show up
              today.
            </div>
            <p>
              Somewhere out there is a version of you that&apos;s already Rank S. NEETLeveling doesn&apos;t hand you
              that version — it just refuses to let you forget it exists, and makes it very, very hard to keep
              lying to yourself about the distance between here and there.
            </p>
            <p>
              This isn&apos;t a content app. It&apos;s not another lecture library or test series. It&apos;s the
              System — the thing standing between you and the version of yourself who actually finishes what they
              start. Every quest, every Focus Lock, every day the streak survives — that&apos;s the arc. You&apos;re
              not opening an app. You&apos;re grinding one.
            </p>
            <p className={styles.narrativeDim}>
              And one day, without noticing the exact moment it happened, you check your rank — and you&apos;re not
              E anymore.
            </p>
          </div>

          <div className={styles.notice}>
            <span className={styles.noticeTag}>⚑ One thing to be clear about</span>
            <h3>We don&apos;t teach the syllabus. We make sure the syllabus doesn&apos;t beat you.</h3>
            <p>
              NEETLeveling isn&apos;t a coaching platform or a content library — it&apos;s the discipline layer on
              top of whatever you already study. Your books, your lectures, your coaching stay exactly the same.
              What changes is you: how consistently you show up, how hard you grind, how far your rank climbs. This
              is your arc. We&apos;re just the System making sure you don&apos;t skip chapters.
            </p>
          </div>
        </section>

        <section className={`${styles.section} ${styles.wrap}`}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>Progression</span>
            <h2 className={styles.sectionTitle}>Level 0 → 100. Six ranks. One name at the end.</h2>
            <p className={styles.sectionDesc}>
              About 8 months of consistent grinding to reach Shadow Monarch — a pace that roughly matches a real
              NEET prep cycle.
            </p>
          </div>
          <div className={styles.stack}>
            {RANKS.map((rank) => (
              <div
                key={rank.code}
                className={`${styles.rankCard} ${styles.card} ${rank.final ? styles.rankCardFinal : ""}`}
              >
                <div className={styles.rankBadge} style={{ "--rc": rank.color } as React.CSSProperties}>
                  {rank.code}
                </div>
                <div>
                  <div className={styles.rankName}>{rank.name}</div>
                  <div className={styles.rankLvl}>{rank.levels}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.wrap}`}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>The Grind</span>
            <h2 className={styles.sectionTitle}>Every day, the reps go up.</h2>
            <p className={styles.sectionDesc}>
              Three baseline quests, every single day — Physics, Chemistry, Biology MCQs. The count climbs like
              progressive overload at the gym, so the volume builds instead of breaking you on day one.
            </p>
          </div>
          <div className={styles.rampScroll}>
            <div className={styles.rampRow}>
              {RAMP.map((r) => (
                <div key={r.day} className={`${styles.rampCard} ${styles.card}`}>
                  <div className={styles.rampDay}>{r.day}</div>
                  <div className={styles.rampCount}>{r.count}</div>
                  <div className={styles.rampLabel}>Qs / subject</div>
                </div>
              ))}
              <div className={`${styles.rampCard} ${styles.card} ${styles.rampPlateau}`}>
                <div className={styles.rampDay}>Day 14+</div>
                <div className={styles.rampCount}>50</div>
                <div className={styles.rampLabel}>Steady from here</div>
              </div>
            </div>
          </div>
          <p className={styles.rampNote}>
            150 questions a day, every day — the exact grind between a Rank E nobody and the Shadow Monarch. Level
            up like never before.
          </p>
        </section>

        <section className={`${styles.section} ${styles.wrap}`}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>Your stats</span>
            <h2 className={styles.sectionTitle}>Five stats. All earned, none cosmetic.</h2>
          </div>
          <div className={styles.statGrid}>
            {STATS.map((s) => (
              <div key={s.key} className={`${styles.statCard} ${styles.card}`}>
                <div className={styles.statKey}>{s.key}</div>
                <div className={styles.statDesc}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className={`${styles.section} ${styles.wrap}`}>
          <div className={styles.sectionHead} style={{ textAlign: "center", maxWidth: "none" }}>
            <span className={styles.sectionTag}>Membership</span>
            <h2 className={styles.sectionTitle}>One plan. Fully premium.</h2>
          </div>
          <div className={styles.priceCard}>
            <div className={styles.priceLabel}>Hunter Access</div>
            <div className={styles.priceAmt}>
              ₹99<span className={styles.priceAmtUnit}>/month</span>
            </div>
            <div className={styles.priceNote}>Cancel anytime. No free tier — the System doesn&apos;t do trials.</div>
            <ul className={styles.priceList}>
              {PRICE_FEATURES.map((f) => (
                <li key={f} className={styles.priceListItem}>
                  <span className={`${styles.priceCheck} mono`}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}>
              Unlock the System
            </Link>
          </div>
        </section>
      </main>

      <footer className={`${styles.wrap} ${styles.footer}`}>
        <div className={styles.brand} style={{ fontSize: "16px" }}>
          <FlameIcon className={styles.flame} />
          NEETLEVELING
        </div>
        <div className={styles.footLinks}>
          <Link href="/legal">Terms</Link>
          <Link href="/legal">Privacy</Link>
          <Link href="/legal">Refund Policy</Link>
          <a href="#">Contact</a>
        </div>
        <div className={styles.footNote}>
          NEETLeveling is an independent productivity system for NEET aspirants. Not affiliated with any exam
          board or publisher.
        </div>
      </footer>
    </div>
  );
}
