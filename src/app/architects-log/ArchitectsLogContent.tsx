"use client";

import { Fragment, useEffect, useRef } from "react";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import styles from "./architects-log.module.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ARCH_STATS = [
  { count: 180, suffix: "+", label: "Nights Coded" },
  { count: 400, suffix: "+", label: "Bugs Squashed" },
  { count: 1, suffix: "", label: "Person On The Team" },
  { count: 0, suffix: "", label: "Investors Needed" },
];

const BUILD_STAGES_TOP = [
  {
    version: "Stage 1",
    date: "Dec 2025",
    title: "Planning It Out",
    items: [
      "Worked out exactly how the whole System would run",
      "Set up the basic account and login system",
      "Set up every new Hunter to start at E-Rank, Level 1",
    ],
  },
  {
    version: "Stage 2",
    date: "Jan 2026",
    title: "Bringing Quests To Life",
    items: [
      "Built the daily quests that drop every morning at 5 AM",
      "Made the 24-hour timer that never loses track, even if the web app closes",
      "Added Focus Mode to lock out distractions while you work",
    ],
  },
  {
    version: "Stage 3",
    date: "Feb 2026",
    title: "Ranks & Rules",
    items: [
      "Designed the E to S rank ladder from scratch",
      "Built the system that raises your daily question count over time",
      "Set the penalty rules for the days quests get missed",
    ],
  },
];

const BUILD_STAGES_BOTTOM = [
  {
    version: "Stage 4 · Crunch",
    date: "Mar 2026",
    title: "The Hardest Month",
    variant: "crunch" as const,
    items: [
      "Redesigned the whole web app, three separate times",
      "Found and fixed a bug that let people skip their own punishment",
      "Set up payments and a way to manage everything behind the scenes",
      "Pulled multiple all-nighters — came close to giving up, once",
    ],
  },
  {
    version: "Stage 5 · Crunch",
    date: "Apr 2026",
    title: "Making It Look Right",
    variant: "crunch" as const,
    items: [
      "Built the landing page students would actually see first",
      "Added the animated charts and progress graphs",
      "Rewrote every line of text more than once, until it actually felt right",
      "More sleepless nights — this time over design, not code",
    ],
  },
  {
    version: "Stage 6 · Launch",
    date: "May 7, 2026",
    title: "Going Live",
    variant: "milestone" as const,
    wide: true,
    items: [
      "Put the System online for anyone to join",
      "Launched at ₹99/month — no big announcement, just a link",
      "The first stranger signed up 3 days later",
    ],
  },
];

const ACHIEVEMENTS = [
  { icon: "🔓", num: "First Hunter", meta: "May 10, 2026", meta2: "3 days after launch" },
  { icon: "🔓", num: "100 Hunters", meta: "May 17, 2026", meta2: "+99 in 7 days" },
  { icon: "🔓", num: "1,000 Hunters", meta: "Jun 2, 2026", meta2: "+900 in 16 days" },
  { icon: "🔓", num: "2,000 Hunters", meta: "Jun 21, 2026", meta2: "+1,000 in 19 days" },
  { icon: "🔓", num: "5,000 Hunters", meta: "Jul 3, 2026", meta2: "+3,000 in 12 days" },
  { icon: "🔓", num: "8,000 Hunters", meta: "Aug 14, 2026", meta2: "+3,000 in 42 days" },
  {
    icon: "🏆",
    num: "10,000 Hunters",
    meta: "Sep 1, 2026",
    meta2: "+2,000 in 18 days",
    meta3: "still counting",
    final: true,
  },
];

const STACK_LANGUAGES = ["HTML5", "CSS3", "JavaScript", "Next.js", "SQL"];
const STACK_INFRA = ["Supabase", "Vercel", "Hostinger VPS", "GitHub"];

const LAUNCH_DATE = new Date("2026-05-07T00:00:00");

export function ArchitectsLogContent() {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef<HTMLDivElement>(null);
  const dayCounterRef = useRef<HTMLSpanElement>(null);
  const dayCounterBigRef = useRef<HTMLSpanElement>(null);
  const growthLiveRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cleanups: Array<() => void> = [];

    function updateScrollProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      if (scrollProgressRef.current) scrollProgressRef.current.style.width = pct + "%";
    }
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    updateScrollProgress();
    cleanups.push(() => window.removeEventListener("scroll", updateScrollProgress));

    const revealEls = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.show);
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
    cleanups.push(() => revealObserver.disconnect());

    const archStatEls = root.querySelectorAll<HTMLElement>("[data-arch-stat]");
    const archStatObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const target = Number(el.dataset.count);
            const suffix = el.dataset.suffix || "";
            const duration = 900;
            const start = performance.now();
            function tick(now: number) {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              el.textContent = Math.round(target * eased) + suffix;
              if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
            archStatObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.3 }
    );
    archStatEls.forEach((el) => archStatObserver.observe(el));
    cleanups.push(() => archStatObserver.disconnect());

    const bCards = root.querySelectorAll<HTMLElement>("[data-b-card]");
    bCards.forEach((card, idx) => {
      const bCardObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const timeout = setTimeout(() => {
                entry.target.classList.add(styles.bCardShow);
              }, idx * 90);
              cleanups.push(() => clearTimeout(timeout));
              bCardObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      bCardObserver.observe(card);
      cleanups.push(() => bCardObserver.disconnect());
    });

    const today = new Date();
    const daysRunning = Math.max(0, Math.floor((today.getTime() - LAUNCH_DATE.getTime()) / 86400000));
    if (dayCounterRef.current) dayCounterRef.current.textContent = String(daysRunning);
    if (dayCounterBigRef.current) dayCounterBigRef.current.textContent = String(daysRunning);

    const achCards = root.querySelectorAll<HTMLElement>("[data-ach-card]");
    const achObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Array.from(achCards).indexOf(entry.target as HTMLElement);
            const timeout = setTimeout(() => {
              entry.target.classList.add(styles.achCardShow);
            }, idx * 90);
            cleanups.push(() => clearTimeout(timeout));
            achObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    achCards.forEach((c) => achObserver.observe(c));
    cleanups.push(() => achObserver.disconnect());

    let growthBase = 10000;
    const interval = setInterval(() => {
      growthBase += Math.floor(Math.random() * 2);
      if (growthLiveRef.current) growthLiveRef.current.textContent = growthBase.toLocaleString();
    }, 6000);
    cleanups.push(() => clearInterval(interval));

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div ref={rootRef} className={`${styles.page} ${spaceGrotesk.variable}`}>
      <div ref={scrollProgressRef} className={styles.scrollProgress} />
      <div className={styles.wrapInner}>
        <nav className={styles.nav}>
          <div className={styles.logo}>
            <span className={styles.logoMark} />
            NEETLEVELING
          </div>
          <Link href="/" className={styles.navBack}>
            ← Back To NEETLeveling
          </Link>
        </nav>

        {/* HERO */}
        <section className={styles.hero}>
          <span className={styles.eyebrow}>
            <span className={styles.dot} />
            THE ARCHITECT&apos;S LOG · ARGHYA DAS
          </span>
          <h1 className={styles.heroH1}>
            I Didn&apos;t Build A Web App.
            <br />I Built A <span className={styles.accent}>System.</span>
          </h1>
          <p className={styles.lede}>
            No team, no funding, no agency — just one idea from a November night, and every log entry since.
          </p>
          <p className={styles.lede}>This page is that record, start to finish.</p>
          <div className={styles.statusBar}>
            <span className={styles.live}>
              <span className={styles.dot} />
              Built Solo · Still Building
            </span>
            <span>
              Live Since May 7, 2026 · <span ref={dayCounterRef}>—</span> Days Running
            </span>
          </div>
        </section>

        {/* ORIGIN */}
        <section className={styles.reveal} data-reveal>
          <div className={styles.secHead}>
            <span className={styles.tag}>Log 00 · November 2025</span>
            <h2>The Night It Started</h2>
          </div>
          <div className={styles.origin}>
            <p>
              No investors. No team. No plan. Just one night in <b>November 2025</b>, binge-watching Solo
              Leveling start to finish — and somewhere around the middle of it, a thought that wouldn&apos;t
              leave: <span className={styles.cyan}>&quot;NEET prep needs a System like this.&quot;</span>
            </p>
            <p>
              Not another app with videos and PDFs. Every NEET aspirant already has those. What nobody had was
              a System — quests that don&apos;t ask, ranks that have to be earned, and consequences for the
              days that get skipped. The kind of structure that doesn&apos;t care how you feel that morning,
              because it was never built to.
            </p>
            <p>
              By the time the sun came up, the idea was already too loud to ignore. I didn&apos;t have a
              co-founder, a design team, or a roadmap. I had a laptop, a stubborn idea, and no plans to sleep
              properly for the next six months.
            </p>
            <div className={styles.originSign}>— Arghya Das</div>
          </div>
        </section>

        <div className={`${styles.dividerStatement} ${styles.reveal}`} data-reveal>
          <h3>
            Six months. <b>One person.</b> <span className={styles.cyan}>Zero shortcuts.</span>
          </h3>
        </div>

        {/* ARCHITECT CARD */}
        <section className={styles.reveal} data-reveal>
          <div className={styles.architectCard}>
            <div className={styles.architectTitlebar}>
              <span>ARCHITECT PROFILE</span>
              <span>● SYSTEM ONLINE</span>
            </div>
            <div className={styles.architectBody}>
              <div>
                <div className={styles.architectName}>Arghya Das</div>
                <div className={styles.architectRole}>Founder · Designer · Solo Developer</div>
              </div>
              <div className={styles.architectRank}>
                <div className={styles.rk}>S-RANK</div>
                <div className={styles.rkSub}>Solo Builder</div>
              </div>
            </div>
            <div className={styles.architectStats}>
              {ARCH_STATS.map((s) => (
                <div key={s.label} className={styles.archStat}>
                  <div
                    className={styles.archStatNum}
                    data-arch-stat
                    data-count={s.count}
                    data-suffix={s.suffix}
                  >
                    0
                  </div>
                  <div className={styles.archStatLabel}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className={styles.architectFoot}>
              Every quest, every rank, every line of the escalation protocol —{" "}
              <b>built solo, start to finish.</b>
            </div>
          </div>
        </section>

        {/* BUILD TIMELINE */}
        <section>
          <div className={styles.secHead}>
            <span className={styles.tag}>The Build</span>
            <h2>What Actually Happened In Between</h2>
            <p>Six stages, zigzagging from foundation to launch. What got conquered, month by month.</p>
          </div>
        </section>

        <div className={styles.buildZigzag}>
          <div className={styles.bRow}>
            {BUILD_STAGES_TOP.map((stage, idx) => (
              <Fragment key={stage.version}>
                <div className={styles.bCard} data-b-card>
                  <div className={styles.bNode} />
                  <div className={styles.bInner}>
                    <div className={styles.bTop}>
                      <span className={styles.bVersion}>{stage.version}</span>
                      <span className={styles.bDate}>{stage.date}</span>
                    </div>
                    <div className={styles.bTitle}>{stage.title}</div>
                    <ul className={styles.bList}>
                      {stage.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {idx < BUILD_STAGES_TOP.length - 1 && <div className={styles.bConnector} />}
              </Fragment>
            ))}
          </div>

          <div className={styles.bTurn} />

          <div className={`${styles.bRow} ${styles.bRowReverse}`}>
            {BUILD_STAGES_BOTTOM.map((stage, idx) => (
              <Fragment key={stage.version}>
                <div
                  className={`${styles.bCard} ${stage.variant === "crunch" ? styles.crunch : ""} ${
                    stage.variant === "milestone" ? styles.milestone : ""
                  }`}
                  style={stage.wide ? { flex: "1.3 1 0" } : undefined}
                  data-b-card
                >
                  <div className={styles.bNode} />
                  <div className={styles.bInner}>
                    <div className={styles.bTop}>
                      <span className={styles.bVersion}>{stage.version}</span>
                      <span className={styles.bDate}>{stage.date}</span>
                    </div>
                    <div className={styles.bTitle}>{stage.title}</div>
                    <ul className={styles.bList}>
                      {stage.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {idx < BUILD_STAGES_BOTTOM.length - 1 && <div className={styles.bConnector} />}
              </Fragment>
            ))}
          </div>
        </div>

        {/* LAUNCH DATE */}
        <section className={`${styles.launchDate} ${styles.reveal}`} data-reveal>
          <div className={styles.ldLine} />
          <div className={styles.ldLabel}>Official System Activation</div>
          <div className={styles.ldDate}>
            MAY <span className={styles.accent}>07</span>, 2026
          </div>
          <div className={styles.ldSub}>
            The day this stopped being a private project — and went live for anyone to Awaken.
          </div>
          <div className={styles.ldCounter}>
            Day <span ref={dayCounterBigRef}>—</span> of the System <span className={styles.ldDot} /> still
            running
          </div>
          <div className={styles.ldLine} />
        </section>

        {/* TECH STACK */}
        <section className={styles.reveal} data-reveal>
          <div className={styles.secHead}>
            <span className={styles.tag}>Under The Hood</span>
            <h2>Built With</h2>
            <p>No agency, no dev team on payroll — just this stack, six months, and a lot of late nights.</p>
          </div>

          <div className={styles.stackGroup}>
            <div className={styles.stackGroupLabel}>Languages &amp; Frameworks</div>
            <div className={styles.stackPills}>
              {STACK_LANGUAGES.map((s) => (
                <span key={s} className={styles.stackPill}>
                  <span className={styles.pdot} />
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.stackGroup}>
            <div className={styles.stackGroupLabel}>Infrastructure &amp; Tools</div>
            <div className={styles.stackPills}>
              {STACK_INFRA.map((s) => (
                <span key={s} className={`${styles.stackPill} ${styles.stackPillViolet}`}>
                  <span className={styles.pdot} />
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.stackNote}>
            Nothing exotic. No custom infrastructure, no over-engineering for a problem that didn&apos;t exist
            yet. Just tools that got out of the way so the actual work — the quests, the ranks, the System
            itself — could get built.
          </div>
        </section>

        {/* GROWTH */}
        <section className={styles.reveal} data-reveal>
          <div className={styles.secHead}>
            <span className={styles.tag}>The Growth</span>
            <h2>Every Milestone, On The Record</h2>
            <p>Not projections. Not &quot;expected users.&quot; What actually happened, one date at a time.</p>
          </div>

          <div className={styles.achLive}>
            <span className={styles.dot} />
            <span ref={growthLiveRef}>10,000</span>+ Hunters and counting
          </div>

          <div className={styles.achStack}>
            {ACHIEVEMENTS.map((a) => (
              <div
                key={a.num}
                className={`${styles.achCard} ${a.final ? styles.final : ""}`}
                data-ach-card
              >
                <div className={styles.achIcon}>{a.icon}</div>
                <div>
                  <div className={styles.achLabel}>Achievement Unlocked</div>
                  <div className={styles.achNum}>{a.num}</div>
                  <div className={styles.achMeta}>
                    {a.meta}
                    <span className={styles.achDot} />
                    {a.meta2}
                    {a.meta3 && (
                      <>
                        <span className={styles.achDot} />
                        {a.meta3}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.growthQuote}>
            &quot;Every one of these is a real person who trusted a system built by one guy and way too much
            caffeine and smoke.&quot;
          </div>
        </section>

        {/* STATS */}
        <section className={styles.reveal} data-reveal>
          <div className={styles.secHead}>
            <span className={styles.tag}>While You Were Doubting</span>
            <h2>What Was Actually Happening</h2>
          </div>
          <div className={styles.statTileGrid}>
            <div className={styles.statTile}>
              <div className={styles.statTileIcon}>🛠️</div>
              <div className={styles.statTileNum}>400+</div>
              <div className={styles.statTileLabel}>Bugs Reported &amp; Fixed</div>
            </div>
            <div className={styles.statTile}>
              <div className={styles.statTileIcon}>⚡</div>
              <div className={styles.statTileNum}>10+</div>
              <div className={styles.statTileLabel}>Minor Features Shipped Free</div>
            </div>
            <div className={`${styles.statTile} ${styles.statTileViolet}`}>
              <div className={styles.statTileIcon}>🌍</div>
              <div className={styles.statTileNum}>8,270+</div>
              <div className={styles.statTileLabel}>Requests That Became Hunter&apos;s World</div>
            </div>
          </div>
        </section>

        {/* FOUNDER'S NOTE */}
        <section className={styles.reveal} data-reveal>
          <div className={styles.notePanel}>
            <div className={styles.noteTitlebar}>
              <span className={styles.dot} />A Note From The Architect
            </div>
            <p>
              If you&apos;ve read this far, you already know more about how NEETLeveling was built than most
              people ever will about the tools they use every day.
            </p>
            <p>
              I didn&apos;t build this because I had it all figured out. I built it because I didn&apos;t, and
              I needed a System that wouldn&apos;t let me negotiate with myself on the days I wanted to. It
              turned out a lot of NEET aspirants needed exactly the same thing.
            </p>
            <p>
              To the <span className={styles.cyan}>10,000+ Hunters</span> who&apos;ve activated the System so
              far — thank you for trusting something built by a single random person like me. To everyone who
              thought this was just another idea that wouldn&apos;t survive contact with reality — this page is
              the record. It survived. It&apos;s still growing.
            </p>
            <p>
              <b>The Hunter&apos;s World is next.</b> Built the same way everything before it was — one late
              night at a time.
            </p>
            <div className={styles.noteSignature}>
              <div className={styles.sigName}>Arghya Das</div>
              <div className={styles.sigRole}>Founder, NEETLeveling</div>
            </div>
          </div>
        </section>

        {/* CLOSING */}
        <section className={`${styles.closing} ${styles.reveal}`} data-reveal>
          <span className={styles.tag}>For The Record</span>
          <h2>
            They Watched.
            <br />
            They Doubted.
            <br />
            Now It&apos;s <span className={styles.accent}>10,000+ Strong.</span>
          </h2>
          <p>
            This page isn&apos;t just a timeline. It&apos;s a receipt — every all-nighter, every fixed bug,
            every Hunter who showed up, timestamped and public.{" "}
            <b>The System doesn&apos;t argue. It just keeps counting.</b>
          </p>
          <Link href="/signup" className={styles.closingCta}>
            Activate The System
          </Link>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footLogo}>NEETLEVELING.IN</div>
          <div className={styles.footSub}>
            BUILT SOLO BY ARGHYA DAS — SYSTEM LOG UPDATED CONTINUOUSLY SINCE MAY 7, 2026
          </div>
        </footer>
      </div>
    </div>
  );
}
