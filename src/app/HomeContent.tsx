"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import styles from "./page.module.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const FEED_NAMES = [
  "Aditya", "Priya", "Rohan", "Ananya", "Vikram", "Sneha", "Karthik", "Meera",
  "Arjun", "Divya", "Rahul", "Pooja", "Siddharth", "Neha", "Yash", "Riya",
  "Aman", "Kavya", "Rohit", "Sanya", "Ishaan", "Tanvi", "Devansh", "Simran",
  "Aryan", "Nisha", "Harsh", "Priyanka", "Varun", "Anjali", "Kunal", "Shreya",
];
const FEED_CITIES = [
  "Kota", "Patna", "Lucknow", "Indore", "Pune", "Guwahati", "Ranchi", "Bhopal",
  "Nagpur", "Jaipur", "Kolkata", "Surat", "Delhi", "Chandigarh", "Bhubaneswar",
  "Coimbatore", "Nashik", "Varanasi", "Amritsar", "Raipur",
];
const FEED_TIMES = ["Just now", "2m ago", "6m ago", "14m ago", "23m ago", "41m ago", "1h ago"];

const QUEST_STEPS = [
  {
    num: "01 // QUEST",
    title: "Daily Quests Drop Every Morning",
    paras: [
      "Every Hunter in the arena gets the same mandatory quests, dropped straight from the System at 5 AM sharp.",
      "No picking and choosing — built for the ones grinding into the night too.",
    ],
  },
  {
    num: "02 // FOCUS",
    title: "Start A Quest. Enter Focus Mode.",
    paras: [
      "One tap locks distractions out until the work is done.",
      "No pausing, no early exit — the timer decides when you're free.",
    ],
  },
  {
    num: "03 // LEVEL UP",
    title: "Complete. Build Streak. Gain Progress.",
    paras: [
      "Every completed day moves your rank forward.",
      "Add your own quests on top — revision, drills, whatever your prep needs.",
    ],
  },
];

const PENALTY_PROTOCOLS = [
  {
    tag: "Protocol 01",
    name: "Push-Up Protocol",
    cx: 16,
    cy: 8,
    path: "M16 11 L8 22 M16 11 L24 22 M10 16 L22 16",
  },
  {
    tag: "Protocol 02",
    name: "Sit-Up Circuit",
    cx: 10,
    cy: 10,
    path: "M10 13 Q 16 20 24 24 M6 24 L24 24",
  },
  {
    tag: "Protocol 03",
    name: "Squat Sequence",
    cx: 16,
    cy: 6,
    path: "M16 9 L16 16 M16 16 L10 26 M16 16 L22 26 M8 26 L24 26",
  },
];

const PF_STEPS = [
  { n: 1, label: "24H Timer\nHits Zero", variant: "bad" as const },
  { n: 2, label: "Quests Still\nOpen", variant: "bad" as const },
  { n: 3, label: "System\nLocked", variant: "bad" as const },
  { n: 4, label: "All 3 Protocols\nActivated", variant: "bad" as const },
  { n: 5, label: "Access\nRegained", variant: "ok" as const },
];

const RANKS = [
  { badge: "E", title: "World's Weakest NEET Hunter", sub: "Everyone starts here." },
  { badge: "D", title: "Distraction Slayer", sub: "Consistency begins to compound." },
  { badge: "C", title: "Procrastination Slayer", sub: "Showing up becomes routine." },
  { badge: "B", title: "Discipline Master", sub: "You no longer negotiate with the habit." },
  { badge: "A", title: "Consistency Lord", sub: "Discipline starts running on its own." },
  { badge: "S", title: "NEET Monarch", sub: "Elite-level consistency.", final: true },
];

const STATUS_TILES = [
  { icon: "⚡", val: "4,820", label: "Total XP" },
  { icon: "🎥", val: "142", label: "Class Hours" },
  { icon: "🧠", val: "96", label: "Question Hours" },
  { icon: "🎯", val: "3,214", label: "Questions Solved" },
];

const PRICE_FEATURES = [
  "System Quests",
  "Personal Quests",
  "Adaptive Workload",
  "Focus Mode",
  "Streak Tracking",
  "Consequence System",
  "Rank & Level Progression",
  "Hunter Stats",
];

const PRICE_HIGHLIGHTS = [
  {
    title: "48-Hour System Fixes",
    desc: "Something broken or not working? Report it from your dashboard. It'll be fixed within 48 hours.",
  },
  {
    title: "Free Minor Upgrades",
    desc: "Missing a feature or need a small tweak? Drop it in Feature Requests. If it improves the System, it'll be added free for every Hunter.",
  },
  {
    title: "Early Beta Access",
    desc: "Major features take time to build. Get early beta access, try what's coming, and help improve it before the final release — including The Hunter's World.",
  },
];

const UPCOMING_FEATURES = [
  { title: "Hunter Profiles", desc: "Public profiles showing another Hunter's rank, level, XP, streak, and prep stats." },
  { title: "Follow & Following", desc: "Follow other Hunters and keep track of the ones you follow. No friend requests." },
  { title: "Hunter Chat", desc: "A social feed to share updates, discuss prep, and celebrate progress with other Hunters." },
  { title: "Global Rankings", desc: "A leaderboard showing where you stand worldwide on System progression." },
  { title: "Hunter-to-Hunter Messaging", desc: "Simple direct messages between Hunters. No groups, no clutter." },
  { title: "Backlog Slayer", desc: "A systematic approach to absolutely slay your backlogs — down to the last task." },
];

const FAQS = [
  {
    q: "Is NEETLeveling a study app?",
    a: (
      <>
        No. It doesn&apos;t replace your lectures, notes, or question banks. It sits on top of whatever you
        already study from and turns it into a daily quest system — the System tracks the habit, <b>not the syllabus</b>.
      </>
    ),
  },
  {
    q: "How do daily quests actually work?",
    a: (
      <>
        Quests drop at <b>5 AM sharp</b> every day. You get a rolling 24-hour window to clear them. Starting a
        quest locks you into Focus Mode until the timer ends — no checkboxes, no proof uploads, just the clock.
      </>
    ),
  },
  {
    q: "What happens if I don't finish in time?",
    a: (
      <>
        If the 24-hour timer hits zero with quests still open, the System locks and activates{" "}
        <b>all three penalty protocols</b> — Push-Ups, Sit-Ups, Squats. Clear them all to get back in. Repeat
        lockouts escalate the rep count, capped at 50.
      </>
    ),
  },
  {
    q: "Does the question load keep increasing forever?",
    a: (
      <>
        No — it climbs daily, then locks for good. Physics and Chemistry cap at <b>50 questions/day</b> each;
        Biology cap at <b>100/day</b> since it alone carries half the exam paper. Total load caps permanently at
        200Q/day.
      </>
    ),
  },
  {
    q: "Do I need my own study material?",
    a: (
      <>
        Yes. Bring your own books, question banks, or lectures — the System doesn&apos;t provide content. It
        provides the structure that makes sure you actually use what you already have.
      </>
    ),
  },
  {
    q: "Why is the price changing to ₹129 from Nov 1?",
    a: (
      <>
        ₹129/month becomes the <b>one and only price</b> starting Nov 1, 2026 — not a second bill on top of ₹99.
        It&apos;s the same one plan, full System access, with <span className={styles.cyan}>The Hunter&apos;s World</span> included.
        ₹99/month is available only until the switch.
      </>
    ),
  },
  {
    q: 'What is "The Hunter\'s World"?',
    a: (
      <>
        The System&apos;s next chapter — Hunter Profiles, Follow &amp; Following, Hunter Chat, Global Rankings,
        direct messaging, and a live activity feed. Currently in development, targeting Nov 1, 2026.
      </>
    ),
  },
  {
    q: "Can I cancel anytime, and get a refund?",
    a: (
      <>
        You can cancel anytime from your dashboard — no long-term lock-in. But <b>no refunds</b> on payments
        already made. Cancel, and you keep full access for the rest of your current cycle; you just won&apos;t be
        billed for the next one.
      </>
    ),
  },
];

export function HomeContent() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cleanups: Array<() => void> = [];
    const timeouts: number[] = [];
    const track = (fn: () => void) => cleanups.push(fn);

    // ---- live activity feed ----
    function genFeedEvent() {
      const name = FEED_NAMES[Math.floor(Math.random() * FEED_NAMES.length)];
      const city = FEED_CITIES[Math.floor(Math.random() * FEED_CITIES.length)];
      return {
        type: "join",
        html: `<b>Hunter ${name}</b> from ${city} just <span class="${styles.hl}">joined the System</span>`,
      };
    }

    const feedList = root.querySelector<HTMLDivElement>("#feedList");
    function addFeedRow(initial: boolean) {
      if (!feedList) return;
      const ev = genFeedEvent();
      const row = document.createElement("div");
      row.className = `${styles.feedRow} ${styles.typeJoin}`;
      const t = initial ? FEED_TIMES[Math.floor(Math.random() * FEED_TIMES.length)] : "Just now";
      row.innerHTML = `<span class="${styles.fdot}"></span><span class="${styles.ftext}">${ev.html}</span><span class="${styles.ftime}">${t}</span>`;
      feedList.prepend(row);
      while (feedList.children.length > 8) {
        feedList.removeChild(feedList.lastChild as ChildNode);
      }
    }
    if (feedList) {
      for (let i = 0; i < 8; i++) addFeedRow(true);
      let feedTimeoutId: number;
      const scheduleFeed = () => {
        addFeedRow(false);
        feedTimeoutId = window.setTimeout(scheduleFeed, 2200 + Math.random() * 2600);
      };
      feedTimeoutId = window.setTimeout(scheduleFeed, 1800);
      track(() => window.clearTimeout(feedTimeoutId));
    }

    // ---- typewriter system window ----
    const typewriterLines = [
      "[ HUNTER PROFILE ]\n\n",
      "> Target: NEET UG 2027\n",
      "> Rank: ",
      "rank:E-RANK — WORLD'S WEAKEST NEET HUNTER",
      "\n",
      "> Level: 01\n",
      "> Status: ",
      "ok:SYSTEM ACTIVE",
      "\n\n",
      "Your preparation is now a daily progression system.\n",
      "Quests. Deadlines. Focus sessions. Streaks.\n",
      "Every completed day moves you forward.\n\n",
      "System initialization complete.",
    ];
    const twEl = root.querySelector<HTMLDivElement>("#typewriter");
    if (twEl) {
      const full = typewriterLines.join("");
      const render = (str: string) =>
        str
          .replace(
            /rank:E-RANK — WORLD'S WEAKEST NEET HUNTER/g,
            `<b>E-RANK — WORLD'S WEAKEST NEET HUNTER</b>`
          )
          .replace(/ok:SYSTEM ACTIVE/g, `<span class="${styles.ok}">SYSTEM ACTIVE</span>`)
          .replace(/\n/g, "<br>");
      let i = 0;
      let typeTimeoutId: number;
      const type = () => {
        if (i > full.length) {
          twEl.innerHTML = render(full) + `<span class="${styles.cursor}"></span>`;
          return;
        }
        twEl.innerHTML = render(full.slice(0, i)) + `<span class="${styles.cursor}"></span>`;
        i += 2;
        typeTimeoutId = window.setTimeout(type, 14);
      };
      type();
      track(() => window.clearTimeout(typeTimeoutId));
    }

    // ---- live counter tick ----
    const counterEl = root.querySelector<HTMLSpanElement>("#feedCounter");
    if (counterEl) {
      let base = 11270;
      const counterInterval = window.setInterval(() => {
        base += Math.floor(Math.random() * 3);
        counterEl.textContent = base.toLocaleString();
      }, 4200);
      track(() => window.clearInterval(counterInterval));
    }

    // ---- upcoming feature-request counter ----
    const upcomingEl = root.querySelector<HTMLSpanElement>("#upcomingCounter");
    if (upcomingEl) {
      let base = 8270;
      const upcomingInterval = window.setInterval(() => {
        base += Math.floor(Math.random() * 2);
        upcomingEl.textContent = base.toLocaleString();
      }, 5000);
      track(() => window.clearInterval(upcomingInterval));
    }

    // ---- countdown clock ----
    const clockEl = root.querySelector<HTMLDivElement>("#clockDisplay");
    if (clockEl) {
      let secs = 23 * 3600 + 47 * 60 + 12;
      const clockInterval = window.setInterval(() => {
        secs = secs <= 0 ? 24 * 3600 : secs - 1;
        const h = String(Math.floor(secs / 3600)).padStart(2, "0");
        const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
        const s = String(secs % 60).padStart(2, "0");
        clockEl.textContent = `${h}:${m}:${s}`;
      }, 1000);
      track(() => window.clearInterval(clockInterval));
    }

    // ---- status window stat reveal ----
    const statBlock = root.querySelector<HTMLDivElement>("#statBlock");
    if (statBlock) {
      const statVals = statBlock.querySelectorAll<HTMLDivElement>(`.${styles.statVal}`);
      const statObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              statVals.forEach((v, idx) => {
                const tid = window.setTimeout(() => {
                  v.textContent = v.dataset.val ?? "";
                  v.classList.add(styles.show);
                }, idx * 120);
                timeouts.push(tid);
              });
              statObserver.disconnect();
            }
          });
        },
        { threshold: 0.3 }
      );
      statObserver.observe(statBlock);
      track(() => statObserver.disconnect());
    }

    // ---- shared smooth-path helper ----
    type Pt = { x: number; y: number };
    function smoothPath(pts: Pt[]) {
      let d = `M ${pts[0].x},${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const mx = (pts[i - 1].x + pts[i].x) / 2;
        const my = (pts[i - 1].y + pts[i].y) / 2;
        d += ` Q ${pts[i - 1].x},${pts[i - 1].y} ${mx},${my}`;
      }
      const last = pts[pts.length - 1];
      d += ` L ${last.x},${last.y}`;
      return d;
    }
    const svgNS = "http://www.w3.org/2000/svg";

    // ---- ascend (daily quest load) chart ----
    const ascendSvgEl = root.querySelector<SVGSVGElement>("#ascendSvg");
    if (ascendSvgEl) {
      const W = 680,
        H = 160,
        padX = 6,
        padTop = 10,
        padBottom = 10;
      const totalDays = 14;
      const RAW = [10];
      for (let d = 2; d <= totalDays; d++) RAW.push(RAW[d - 2] + d);

      function capAt(cap: number) {
        let subjCapDay = totalDays;
        const capped = RAW.map((v, i) => {
          if (v >= cap && subjCapDay === totalDays) subjCapDay = i + 1;
          return Math.min(v, cap);
        });
        return { values: capped, capDay: subjCapDay };
      }
      const phyChem = capAt(50);
      const bio = capAt(100);
      const capDay = Math.max(phyChem.capDay, bio.capDay);

      type AscendPoint = Pt & { q: number; d: number; phy: number; chem: number; bio: number; capped: boolean };
      const points: AscendPoint[] = [];
      for (let d = 1; d <= totalDays; d++) {
        const p = phyChem.values[d - 1],
          c = phyChem.values[d - 1],
          b = bio.values[d - 1];
        const q = p + c + b;
        const x = padX + (d - 1) * ((W - padX * 2) / (totalDays - 1));
        const y = H - padBottom - (q / 200) * (H - padTop - padBottom);
        points.push({ x, y, q, d, phy: p, chem: c, bio: b, capped: d >= capDay });
      }

      const linePath = smoothPath(points);
      const areaPath = `${linePath} L ${points[points.length - 1].x},${H - padBottom} L ${points[0].x},${H - padBottom} Z`;

      const lineEl = root.querySelector<SVGPathElement>("#ascendLine");
      const areaEl = root.querySelector<SVGPathElement>("#ascendArea");
      lineEl?.setAttribute("d", linePath);
      areaEl?.setAttribute("d", areaPath);

      const dotsGroup = root.querySelector<SVGGElement>("#ascendDots");
      if (dotsGroup) {
        dotsGroup.replaceChildren();
        points.forEach((p, idx) => {
          const isFirstCap = p.d === capDay;
          const circle = document.createElementNS(svgNS, "circle");
          circle.setAttribute("cx", String(p.x));
          circle.setAttribute("cy", String(p.y));
          circle.setAttribute("r", p.capped ? "5" : "3");
          circle.setAttribute(
            "class",
            `${styles.ascendDot}${p.capped ? ` ${styles.end}` : ""}${isFirstCap ? ` ${styles.pulse}` : ""}`
          );
          circle.style.opacity = "0";
          circle.style.transition = "opacity 0.4s ease";
          circle.dataset.delay = String(idx * 60);
          circle.dataset.idx = String(idx);
          dotsGroup.appendChild(circle);

          const hit = document.createElementNS(svgNS, "circle");
          hit.setAttribute("cx", String(p.x));
          hit.setAttribute("cy", String(p.y));
          hit.setAttribute("r", "16");
          hit.setAttribute("class", styles.ascendHit);
          hit.dataset.idx = String(idx);
          dotsGroup.appendChild(hit);
        });

        const ascendChart = root.querySelector<HTMLDivElement>(`.${styles.ascendChart}`);
        const ascendTip = root.querySelector<HTMLDivElement>("#ascendTip");
        const ascendGuide = root.querySelector<SVGLineElement>("#ascendGuide");
        const allDots = dotsGroup.querySelectorAll<SVGCircleElement>(`.${styles.ascendDot}`);

        function showPoint(idx: number) {
          const p = points[idx];
          const isEnd = p.capped;
          if (!ascendTip || !ascendGuide || !ascendChart) return;

          ascendTip.innerHTML = isEnd
            ? `<b>200Q/day</b>Day ${capDay}+ · Locked, permanent`
            : `<b>${p.q}Q/day</b>Day ${p.d} · ${p.phy} Phy · ${p.chem} Chem · ${p.bio} Bio`;
          ascendTip.classList.toggle(styles.endTip, isEnd);

          const leftPct = (p.x / W) * 100;
          const topPct = (p.y / H) * 100;
          ascendTip.style.left = leftPct + "%";
          ascendTip.style.top = `calc(${topPct}% - 10px)`;
          ascendTip.style.transform = "translate(-50%,-100%)";
          ascendTip.classList.add(styles.show);

          requestAnimationFrame(() => {
            const chartRect = ascendChart.getBoundingClientRect();
            const tipRect = ascendTip.getBoundingClientRect();
            const margin = 10;
            let shift = 0;
            if (tipRect.left < chartRect.left + margin) {
              shift = chartRect.left + margin - tipRect.left;
            } else if (tipRect.right > chartRect.right - margin) {
              shift = chartRect.right - margin - tipRect.right;
            }
            if (shift !== 0) {
              ascendTip.style.transform = `translate(calc(-50% + ${shift}px),-100%)`;
            }
          });

          ascendGuide.setAttribute("x1", String(p.x));
          ascendGuide.setAttribute("x2", String(p.x));
          ascendGuide.setAttribute("y2", String(p.y));
          ascendGuide.classList.toggle(styles.end, isEnd);
          ascendGuide.style.opacity = "1";

          allDots.forEach((d) => {
            const active = Number(d.dataset.idx) === idx;
            d.setAttribute("r", active ? (isEnd ? "7" : "5") : d.classList.contains(styles.end) ? "5" : "3");
          });
        }

        function hidePoint() {
          if (!ascendTip || !ascendGuide) return;
          ascendTip.classList.remove(styles.show);
          ascendGuide.style.opacity = "0";
          allDots.forEach((d) => {
            d.setAttribute("r", d.classList.contains(styles.end) ? "5" : "3");
          });
        }

        let ascendLocked: number | null = null;
        dotsGroup.querySelectorAll<SVGCircleElement>(`.${styles.ascendHit}`).forEach((hit) => {
          const idx = Number(hit.dataset.idx);
          const onEnter = () => showPoint(idx);
          const onLeave = () => {
            if (ascendLocked === null) hidePoint();
          };
          const onClick = (e: Event) => {
            e.stopPropagation();
            if (ascendLocked === idx) {
              ascendLocked = null;
              hidePoint();
            } else {
              ascendLocked = idx;
              showPoint(idx);
            }
          };
          hit.addEventListener("pointerenter", onEnter);
          hit.addEventListener("pointerleave", onLeave);
          hit.addEventListener("click", onClick);
          track(() => {
            hit.removeEventListener("pointerenter", onEnter);
            hit.removeEventListener("pointerleave", onLeave);
            hit.removeEventListener("click", onClick);
          });
        });
        const docClick = () => {
          if (ascendLocked !== null) {
            ascendLocked = null;
            hidePoint();
          }
        };
        document.addEventListener("click", docClick);
        track(() => document.removeEventListener("click", docClick));

        const ascendPanel = root.querySelector<HTMLDivElement>(`.${styles.ascendPanel}`);
        if (ascendPanel && lineEl && areaEl) {
          const ascendObserver = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  const len = lineEl.getTotalLength();
                  lineEl.style.strokeDasharray = String(len);
                  lineEl.style.strokeDashoffset = String(len);
                  areaEl.style.strokeDasharray = String(len);
                  areaEl.style.strokeDashoffset = String(len);
                  requestAnimationFrame(() => {
                    lineEl.style.strokeDashoffset = "0";
                    areaEl.style.strokeDashoffset = "0";
                    areaEl.style.opacity = "1";
                  });
                  dotsGroup.querySelectorAll<SVGCircleElement>("circle").forEach((c) => {
                    const tid = window.setTimeout(() => {
                      c.style.opacity = "1";
                    }, 400 + Number(c.dataset.delay ?? 0));
                    timeouts.push(tid);
                  });
                  ascendObserver.disconnect();
                }
              });
            },
            { threshold: 0.3 }
          );
          ascendObserver.observe(ascendPanel);
          track(() => ascendObserver.disconnect());
        }
      }
    }

    // ---- escalation (penalty repeat lockout) chart ----
    const escSvgEl = root.querySelector<SVGSVGElement>("#escSvg");
    if (escSvgEl) {
      const EW = 680,
        EH = 130,
        epadX = 6,
        epadTop = 12,
        epadBottom = 10;
      const ESC_REPS = [10, 15, 20, 25, 30, 35, 40, 45, 50];
      const escPoints = ESC_REPS.map((reps, i) => {
        const x = epadX + i * ((EW - epadX * 2) / (ESC_REPS.length - 1));
        const y = EH - epadBottom - (reps / 50) * (EH - epadTop - epadBottom);
        return { x, y, reps, fail: i + 1 };
      });
      const escLinePath = smoothPath(escPoints);
      const escAreaPath = `${escLinePath} L ${escPoints[escPoints.length - 1].x},${EH - epadBottom} L ${escPoints[0].x},${EH - epadBottom} Z`;

      const escLineEl = root.querySelector<SVGPathElement>("#escLine");
      const escAreaEl = root.querySelector<SVGPathElement>("#escArea");
      escLineEl?.setAttribute("d", escLinePath);
      escAreaEl?.setAttribute("d", escAreaPath);

      const escDotsGroup = root.querySelector<SVGGElement>("#escDots");
      if (escDotsGroup) {
        escDotsGroup.replaceChildren();
        escPoints.forEach((p, idx) => {
          const isCap = p.reps === 50;
          const circle = document.createElementNS(svgNS, "circle");
          circle.setAttribute("cx", String(p.x));
          circle.setAttribute("cy", String(p.y));
          circle.setAttribute("r", isCap ? "5" : "3");
          circle.setAttribute("class", `${styles.escDot}${isCap ? ` ${styles.cap}` : ""}`);
          circle.style.opacity = "0";
          circle.style.transition = "opacity 0.4s ease";
          circle.dataset.delay = String(idx * 60);
          circle.dataset.idx = String(idx);
          escDotsGroup.appendChild(circle);

          const hit = document.createElementNS(svgNS, "circle");
          hit.setAttribute("cx", String(p.x));
          hit.setAttribute("cy", String(p.y));
          hit.setAttribute("r", "16");
          hit.setAttribute("class", styles.escHit);
          hit.dataset.idx = String(idx);
          escDotsGroup.appendChild(hit);
        });

        const escChartWrap = root.querySelector<HTMLDivElement>(`.${styles.escChartWrap}`);
        const escTip = root.querySelector<HTMLDivElement>("#escTip");
        const escGuide = root.querySelector<SVGLineElement>("#escGuide");
        const escAllDots = escDotsGroup.querySelectorAll<SVGCircleElement>(`.${styles.escDot}`);

        function showEscPoint(idx: number) {
          const p = escPoints[idx];
          const isCap = p.reps === 50;
          if (!escTip || !escGuide || !escChartWrap) return;
          escTip.innerHTML = isCap
            ? `<b>50 reps</b>Fail #${p.fail}+ · capped, forever`
            : `<b>${p.reps} reps</b>Fail #${p.fail}`;

          const leftPct = (p.x / EW) * 100;
          const topPct = (p.y / EH) * 100;
          escTip.style.left = leftPct + "%";
          escTip.style.top = `calc(${topPct}% - 10px)`;
          escTip.style.transform = "translate(-50%,-100%)";
          escTip.classList.add(styles.show);

          requestAnimationFrame(() => {
            const wrapRect = escChartWrap.getBoundingClientRect();
            const tipRect = escTip.getBoundingClientRect();
            const margin = 10;
            let shift = 0;
            if (tipRect.left < wrapRect.left + margin) {
              shift = wrapRect.left + margin - tipRect.left;
            } else if (tipRect.right > wrapRect.right - margin) {
              shift = wrapRect.right - margin - tipRect.right;
            }
            if (shift !== 0) {
              escTip.style.transform = `translate(calc(-50% + ${shift}px),-100%)`;
            }
          });

          escGuide.setAttribute("x1", String(p.x));
          escGuide.setAttribute("x2", String(p.x));
          escGuide.setAttribute("y2", String(p.y));
          escGuide.style.opacity = "1";

          escAllDots.forEach((d) => {
            const active = Number(d.dataset.idx) === idx;
            d.setAttribute("r", active ? (isCap ? "7" : "5") : d.classList.contains(styles.cap) ? "5" : "3");
          });
        }
        function hideEscPoint() {
          if (!escTip || !escGuide) return;
          escTip.classList.remove(styles.show);
          escGuide.style.opacity = "0";
          escAllDots.forEach((d) => {
            d.setAttribute("r", d.classList.contains(styles.cap) ? "5" : "3");
          });
        }

        let escLocked: number | null = null;
        escDotsGroup.querySelectorAll<SVGCircleElement>(`.${styles.escHit}`).forEach((hit) => {
          const idx = Number(hit.dataset.idx);
          const onEnter = () => showEscPoint(idx);
          const onLeave = () => {
            if (escLocked === null) hideEscPoint();
          };
          const onClick = (e: Event) => {
            e.stopPropagation();
            if (escLocked === idx) {
              escLocked = null;
              hideEscPoint();
            } else {
              escLocked = idx;
              showEscPoint(idx);
            }
          };
          hit.addEventListener("pointerenter", onEnter);
          hit.addEventListener("pointerleave", onLeave);
          hit.addEventListener("click", onClick);
          track(() => {
            hit.removeEventListener("pointerenter", onEnter);
            hit.removeEventListener("pointerleave", onLeave);
            hit.removeEventListener("click", onClick);
          });
        });
        const escDocClick = () => {
          if (escLocked !== null) {
            escLocked = null;
            hideEscPoint();
          }
        };
        document.addEventListener("click", escDocClick);
        track(() => document.removeEventListener("click", escDocClick));

        const escPanel = root.querySelector<HTMLDivElement>(`.${styles.escPanel}`);
        if (escPanel && escLineEl && escAreaEl) {
          const escObserver = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  const len = escLineEl.getTotalLength();
                  escLineEl.style.strokeDasharray = String(len);
                  escLineEl.style.strokeDashoffset = String(len);
                  escAreaEl.style.strokeDasharray = String(len);
                  escAreaEl.style.transition = "opacity 1.4s ease 0.3s";
                  escAreaEl.style.opacity = "0";
                  escLineEl.style.transition = "stroke-dashoffset 1.4s cubic-bezier(.16,.84,.44,1)";
                  escAreaEl.style.strokeDashoffset = String(len);
                  requestAnimationFrame(() => {
                    escLineEl.style.strokeDashoffset = "0";
                    escAreaEl.style.strokeDashoffset = "0";
                    escAreaEl.style.opacity = "1";
                  });
                  escDotsGroup.querySelectorAll<SVGCircleElement>(`.${styles.escDot}`).forEach((c) => {
                    const tid = window.setTimeout(() => {
                      c.style.opacity = "1";
                    }, 350 + Number(c.dataset.delay ?? 0));
                    timeouts.push(tid);
                  });
                  escObserver.disconnect();
                }
              });
            },
            { threshold: 0.3 }
          );
          escObserver.observe(escPanel);
          track(() => escObserver.disconnect());
        }
      }
    }

    return () => {
      cleanups.forEach((fn) => fn());
      timeouts.forEach((tid) => window.clearTimeout(tid));
    };
  }, []);

  return (
    <div ref={rootRef} className={`${styles.page} ${spaceGrotesk.variable}`}>
      <div className={styles.wrapInner}>
        <nav className={styles.nav}>
          <div className={styles.logo}>
            <span className={styles.logoMark} />
            NEETLEVELING
          </div>
          <button type="button" className={styles.navCta} onClick={() => scrollToId("pricing")}>
            <span className={styles.navCtaFull}>Activate System — ₹99/mo</span>
            <span className={styles.navCtaShort}>Activate — ₹99</span>
          </button>
        </nav>

        {/* HERO */}
        <section className={`${styles.section} ${styles.hero}`}>
          <span className={styles.eyebrow}>
            <span className={styles.dot} />
            NEET UG 2027 · PERSONAL STUDY SYSTEM
          </span>
          <h1>
            You Don&apos;t Need
            <br />
            More Motivation.
            <br />
            You Need A <span className={styles.accent}>System.</span>
          </h1>
          <p className={styles.lede}>
            NEETLeveling turns your NEET preparation into a progression system — daily quests, focused study
            sessions, streaks, levels, ranks, and consequences for unfinished work.
          </p>

          <div className={styles.heroBoxes}>
            <div className={styles.systemWindow}>
              <div className={styles.titlebar}>
                <span>SYSTEM // INITIALIZED</span>
                <span className={styles.live}>● SYSTEM ONLINE</span>
              </div>
              <div className={styles.body} id="typewriter" />
            </div>

            <div className={styles.feedWrap}>
              <div className={styles.feedTopbar}>
                <span>Active System Stats</span>
                <span className={styles.pill}>
                  <span className={styles.dot} />
                  LIVE
                </span>
              </div>
              <div className={styles.feedStat}>
                <div className={styles.feedStatNum}>
                  <span id="feedCounter">11,270</span>+
                </div>
                <div className={styles.feedStatLabel}>Hunters have already entered the System</div>
                <div className={styles.feedStatRate}>
                  ≈ 2–8 new Hunters are joining the System every hour.
                  <br />
                  What are you waiting for? ⚔️🔥
                </div>
              </div>
              <div className={styles.feedList} id="feedList" />
            </div>
          </div>

          <div className={styles.heroCtas}>
            <button type="button" className={styles.btnPrimary} onClick={() => scrollToId("pricing")}>
              Activate Your System
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => scrollToId("how")}>
              See How It Works
            </button>
          </div>
          <div className={styles.heroFoot}>Built for NEET aspirants preparing on their own.</div>
          <Link href="/architects-log" className={styles.heroLogLink}>
            Read The Architect&apos;s Log →
          </Link>
        </section>

        {/* NOT A STUDY APP */}
        <section className={styles.section}>
          <div className={styles.secHead}>
            <span className={styles.tag}>Positioning</span>
            <h2>
              Your Study Material Already Exists.
              <br />
              Now You Need A <span className={styles.cyan}>System</span> To Use It.
            </h2>
            <p>
              NEETLeveling doesn&apos;t replace your lectures, books, notes, or question banks. It sits on top of
              your existing preparation and turns what you need to study into a structured daily progression
              system.
            </p>
          </div>
          <div className={styles.split}>
            <div className={styles.no}>
              <h3>What You Already Have</h3>
              <ul>
                <li>Lectures</li>
                <li>Notes</li>
                <li>Question Banks</li>
                <li>Test Series</li>
                <li>Study Material</li>
              </ul>
            </div>
            <div className={styles.yes}>
              <h3>What The System Adds</h3>
              <ul>
                <li>Daily Quests</li>
                <li>Hard Deadlines</li>
                <li>Focus Mode</li>
                <li>Streak Tracking</li>
                <li>Progression &amp; Ranks</li>
                <li>Accountability</li>
              </ul>
            </div>
          </div>
          <div className={styles.splitVerdict}>
            Content tells you what to study.
            <span>The System makes sure you show up.</span>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className={styles.section}>
          <div className={styles.secHead}>
            <span className={styles.tag}>The Protocol</span>
            <h2>How The System Works</h2>
            <p>Every day starts with a new set of quests. Complete them, protect your streak, and level up.</p>
          </div>

          <div className={styles.questGrid}>
            {QUEST_STEPS.map((s) => (
              <div key={s.num} className={styles.qcard}>
                <div className={styles.num}>{s.num}</div>
                <h4>{s.title}</h4>
                {s.paras.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.clockStrip}>
            <div className={styles.time} id="clockDisplay">
              23:47:12
            </div>
            <div className={styles.label}>
              Your daily completion window. Every quest has one — finish before the System closes the cycle.
            </div>
          </div>

          <div className={styles.overload}>
            <div className={styles.secHead} style={{ marginBottom: 0 }}>
              <span className={styles.tag}>Leveling Protocol</span>
              <h2>Your System Levels With You.</h2>
              <p>
                Start manageable. Build consistency. Increase the challenge. Your daily workload adapts as your
                completion history improves — so you build the ability to handle more, instead of being
                overwhelmed on day one.
              </p>
            </div>

            <div className={styles.ascendPanel}>
              <div className={styles.ascendTop}>
                <span className={styles.ascendEyebrow}>Daily Quest Load</span>
                <span className={styles.ascendStreak}>↑ Load adapts with progress</span>
              </div>
              <div className={styles.ascendChart}>
                <svg className={styles.ascendSvg} id="ascendSvg" viewBox="0 0 680 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4fd8ff" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#4fd8ff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path className={styles.ascendArea} id="ascendArea" d="" />
                  <path className={styles.ascendLine} id="ascendLine" d="" />
                  <line className={styles.ascendGuide} id="ascendGuide" x1="0" y1="0" x2="0" y2="160" />
                  <g id="ascendDots" />
                </svg>
                <div className={styles.ascendTip} id="ascendTip" />
              </div>
              <div className={styles.ascendCallouts}>
                <div className={styles.acItem}>
                  <div className={styles.acNum}>30Q</div>
                  <div className={styles.acLabel}>Day 1</div>
                </div>
                <div className={`${styles.acItem} ${styles.end}`}>
                  <div className={styles.acNum}>200Q</div>
                  <div className={styles.acLabel}>Locked · Day 13+</div>
                </div>
              </div>
              <div className={styles.ascendNote}>
                <p>
                  Physics and Chemistry freeze at 50/day once you&apos;re consistent — Biology keeps climbing on
                  the same curve, since it alone carries half the exam paper, until it caps at 100.
                </p>
                <p>
                  <b>The System remembers your streak, not just today.</b>
                </p>
              </div>
              <div className={styles.ascendHint}>↳ Tap or hover any point on the curve to see that day&apos;s load</div>
            </div>
          </div>
        </section>

        {/* PENALTY */}
        <section className={styles.section}>
          <div className={styles.secHead}>
            <span className={styles.tag}>Failure State</span>
            <h2>When The 24-Hour Timer Hits Zero, Penalty Protocol Activates</h2>
            <p className={styles.penaltyIntro} style={{ maxWidth: 640, margin: "14px auto 0" }}>
              Every Hunter runs on one clock — 24 hours from 5 AM, covering every quest dropped that day. Let it
              run out with anything still open, and the System doesn&apos;t pick one punishment.{" "}
              <b>It activates all three, together.</b>
            </p>
          </div>

          <div className={styles.pqGrid}>
            {PENALTY_PROTOCOLS.map((p) => (
              <div key={p.tag} className={styles.pqCard}>
                <span className={styles.pqTag}>{p.tag}</span>
                <svg className={styles.pqIcon} viewBox="0 0 32 32">
                  <circle cx={p.cx} cy={p.cy} r="3" />
                  <path d={p.path} />
                </svg>
                <div className={styles.pqName}>{p.name}</div>
                <div className={styles.pqSpec}>
                  Base load: <b>10 reps</b>
                  <br />
                  Escalates +5 per repeat lockout
                </div>
              </div>
            ))}
          </div>
          <div className={styles.pqRandom}>
            All three activate together — the instant the 24-hour timer expires with quests still open. Clear
            every one to regain access.
          </div>

          <div className={styles.pfTrack}>
            {PF_STEPS.map((s) => (
              <div key={s.n} className={`${styles.pfStep} ${styles[s.variant]}`}>
                <div className={styles.pfNode}>{s.n}</div>
                <div className={styles.pfLabel}>
                  {s.label.split("\n").map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.secHead} style={{ marginTop: 56, marginBottom: 0 }}>
            <span className={styles.tag}>Escalation</span>
            <h2 style={{ fontSize: "clamp(22px,3vw,30px)" }}>Misses Have Consequences.</h2>
            <p>
              One missed cycle is recoverable. Repeated misses increase the consequence. The System remembers the
              pattern — not just the latest one.
            </p>
          </div>
          <div className={styles.escPanel}>
            <div className={styles.escTop}>
              <span className={styles.escEyebrow}>Repeat Lockout Escalation</span>
              <span className={styles.escCapTag}>Caps at 50 — forever</span>
            </div>
            <div className={styles.escChartWrap}>
              <svg className={styles.escSvg} id="escSvg" viewBox="0 0 680 130" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="escGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff4d5e" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#ff4d5e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className={styles.escArea} id="escArea" d="" />
                <path className={styles.escLine} id="escLine" d="" />
                <line className={styles.escGuide} id="escGuide" x1="0" y1="0" x2="0" y2="130" />
                <g id="escDots" />
              </svg>
              <div className={styles.escTip} id="escTip" />
            </div>
            <div className={styles.escNote}>
              First lockout costs 10 reps per protocol. Every repeat after that adds 5 more — until it caps at 50
              and never grows past it. <b>Consistency is rewarded. Repeated misses get harder to ignore.</b>
            </div>
          </div>
        </section>

        {/* RANKS */}
        <section className={styles.section}>
          <div className={styles.secHead}>
            <span className={styles.tag}>Progression</span>
            <h2>
              Start At E-Rank.
              <br />
              Earn Your Way To S-Rank.
            </h2>
            <p>
              Your rank reflects your consistency over time — not your potential, not your intentions. Your
              completed work. The System doesn&apos;t skip levels. Neither do you.
            </p>
          </div>
          <div className={styles.rankLine}>
            {RANKS.map((r) => (
              <div key={r.badge} className={`${styles.rankRow} ${r.final ? styles.final : ""}`}>
                <div className={styles.rankBadge}>{r.badge}</div>
                <div>
                  <div className={styles.rankTitle}>{r.title}</div>
                  <div className={styles.rankSub}>{r.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* STATUS WINDOW */}
        <section className={`${styles.section} ${styles.statusSection}`}>
          <div className={styles.secHead}>
            <span className={styles.tag}>Your Profile</span>
            <h2>See Exactly How Far You&apos;ve Come.</h2>
            <p>
              Your preparation isn&apos;t just a calendar. It&apos;s a live progression profile that updates as
              you complete quests, build streaks, recover from misses, and level up.
            </p>
          </div>
          <div className={styles.statusCard}>
            <div className={styles.titlebar}>
              <span>HUNTER STATS ⚡️</span>
              <span style={{ color: "var(--cyan)" }}>● SYSTEM ONLINE</span>
            </div>
            <div className={styles.statusHead}>
              <div>
                <div className={styles.name}>[ Hunter ]</div>
                <div className={styles.job}>Target: NEET UG 2027</div>
              </div>
              <div className={styles.lvl}>
                <div className={styles.num}>LV 34</div>
                <div className={styles.rk}>RANK C — PROCRASTINATION SLAYER</div>
              </div>
            </div>
            <div id="statBlock">
              <div className={styles.statTileGrid}>
                {STATUS_TILES.map((t) => (
                  <div key={t.label} className={styles.statTile}>
                    <span className={styles.statIcon}>{t.icon}</span>
                    <div>
                      <div className={styles.statVal} data-val={t.val}>
                        0
                      </div>
                      <div className={styles.statLbl}>{t.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.statusFoot}>
              <span>
                Current streak: <b>34 days</b>
              </span>
              <span>
                Quests completed: <b>287</b>
              </span>
              <span>
                System level: <b>34</b>
              </span>
              <span>
                Next rank: <b>16 levels to B</b>
              </span>
            </div>
            <div className={styles.statusPenalty}>
              <span className={styles.spDot} />
              <span>
                Penalties triggered: <b>1 time</b>
              </span>
              <span className={styles.spDivider}>·</span>
              <span>
                Next lockout costs: <b>15 reps</b>
              </span>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className={styles.section}>
          <div className={styles.secHead}>
            <span className={styles.tag}>Access</span>
            <h2>
              One Plan.
              <br />
              Full System.
            </h2>
          </div>
          <div className={styles.pricingGrid}>
            <div className={styles.priceCard}>
              <div className={styles.plan}>
                <span className={styles.priceLiveDot} />
                Active Now
              </div>
              <div className={styles.amount}>
                ₹99<span>/month</span>
              </div>
              <div className={styles.priceTagline}>One plan. Full System access.</div>
              <ul>
                {PRICE_FEATURES.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className={styles.priceHighlights}>
                {PRICE_HIGHLIGHTS.map((h, i) => (
                  <div key={h.title} className={styles.phItem}>
                    <span className={styles.phNum}>{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className={styles.phTitle}>{h.title}</div>
                      <div className={styles.phDesc}>{h.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className={styles.btnPrimary} style={{ width: "100%" }}>
                Activate The System
              </button>
              <div className={styles.priceFine}>
                No complicated plans. No content library you don&apos;t need. Just the System.
              </div>
            </div>

            <div className={styles.upcomingCard}>
              <div className={styles.plan}>
                <span className={styles.upcomingLiveDot} />
                Here&apos;s What&apos;s Upcoming
              </div>
              <div className={styles.upcomingTitle}>
                <span className={styles.accent}>
                  <span id="upcomingCounter">8,270</span>+
                </span>{" "}
                Hunters Asked.
                <br />
                The System Listened.
              </div>
              <div className={styles.upcomingTagline}>
                Out of thousands of <b>feature requests</b>, these are the ones the majority asked to see next.
              </div>
              <div className={styles.upcomingList}>
                {UPCOMING_FEATURES.map((f, i) => (
                  <div key={f.title} className={styles.ufItem}>
                    <span className={styles.ufNum}>{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className={styles.ufTitle}>{f.title}</div>
                      <div className={styles.ufDesc}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.upcomingFoot}>
                <div className={styles.ufStatus}>
                  <span className={styles.ufStatusDot} />
                  Currently in development
                </div>
                <div className={styles.ufMeta}>
                  <span>
                    Launches <b>Nov 1, 2026</b>
                  </span>
                  <span className={styles.ufDivider} />
                  <span>
                    <b>₹129</b>/month
                  </span>
                </div>
                <div className={styles.ufPerday}>That&apos;s basically, ₹4.30 a day. Less than your evening chai.</div>
                <div className={styles.ufVote}>
                  Priced at what the majority of Hunters voted they&apos;d happily pay for it — not a number we
                  picked ourselves.
                </div>
                <div className={styles.ufCodename}>
                  System Codename: <b>The Hunter&apos;s World</b>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.priceTransition}>
            <div className={styles.ptBadge}>Quick Clarification</div>
            <h3>
              A Lot Of You Asked
              <br />
              About This.
            </h3>
            <p className={styles.ptSub}>No, ₹129 isn&apos;t a second bill alongside ₹99.</p>

            <div className={styles.ptFlow}>
              <div className={`${styles.ptFlowItem} ${styles.old}`}>
                <div className={styles.ptFlowAmount}>₹99</div>
                <div className={styles.ptFlowLabel}>Current Price</div>
              </div>
              <div className={styles.ptFlowArrow}>→</div>
              <div className={`${styles.ptFlowItem} ${styles.new}`}>
                <div className={styles.ptFlowAmount}>₹129</div>
                <div className={styles.ptFlowLabel}>From Nov 1, 2026</div>
              </div>
            </div>

            <div className={styles.ptExplain}>
              <p>The System has always been one plan with full access — the current price is ₹99/month.</p>
              <p>
                From <b>Nov 1, 2026</b>, the price becomes ₹129/month, with <b>The Hunter&apos;s World</b>{" "}
                included.
              </p>
            </div>

            <div className={styles.ptOneline}>One plan. Full System access. One price.</div>

            <div className={styles.ptNochange}>
              <span>No add-ons</span>
              <span className={styles.ptNcDot} />
              <span>No second subscription</span>
              <span className={styles.ptNcDot} />
              <span>No extra payment</span>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className={`${styles.section} ${styles.final}`}>
          <h2>
            You Already Know
            <br />
            What You Need To Do.
            <br />
            Now Give Yourself A <span className={styles.accent}>System.</span>
          </h2>
          <p className={styles.finalSub}>
            Turn your NEET preparation into daily quests. Build your streak. Track your progression. Level up.
          </p>
          <div className={styles.heroCtas} style={{ marginTop: 34 }}>
            <button type="button" className={styles.btnPrimary} onClick={() => scrollToId("pricing")}>
              Activate System — ₹99/month
            </button>
          </div>
          <div className={styles.heroFoot}>Your awakening starts here.</div>
        </section>

        {/* FAQ */}
        <section id="faq" className={styles.section}>
          <div className={styles.secHead}>
            <span className={styles.tag}>Need To Know</span>
            <h2>
              Frequently Asked <span className={styles.cyan}>Questions</span>
            </h2>
            <p>Everything about the System, answered straight — no fine print hunting required.</p>
          </div>
          <div className={styles.faqList}>
            {FAQS.map((f, i) => (
              <details key={f.q} className={styles.faqItem} open={i === 0}>
                <summary>
                  <span className={styles.faqNum}>Q{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.faqQ}>{f.q}</span>
                  <span className={styles.faqIcon} />
                </summary>
                <div className={styles.faqA}>{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerTop}>
              <div className={styles.footerBrand}>
                <div className={styles.logo}>
                  <span className={styles.logoMark} />
                  NEETLEVELING
                </div>
                <p className={styles.footerTagline}>
                  A System for NEET UG 2027 aspirants who&apos;d rather level up than wait for motivation.
                </p>
                <div className={styles.footerSocial}>
                  <a href="#" aria-label="Instagram">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1" />
                    </svg>
                  </a>
                  <a href="#" aria-label="X / Twitter">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 4 L20 20 M20 4 L4 20" />
                    </svg>
                  </a>
                  <a href="#" aria-label="Telegram">
                    <svg viewBox="0 0 24 24">
                      <path d="M21 4 L3 11 L10 13 L12 20 L15 15 L21 4 Z M10 13 L21 4" />
                    </svg>
                  </a>
                  <a href="#" aria-label="YouTube">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="6" width="18" height="12" rx="3" />
                      <path d="M10 9.5 L15 12 L10 14.5 Z" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>System</div>
                <button type="button" onClick={() => scrollToId("how")}>
                  How It Works
                </button>
                <button type="button" onClick={() => scrollToId("pricing")}>
                  Pricing
                </button>
                <button type="button" onClick={() => scrollToId("faq")}>
                  FAQ
                </button>
                <button type="button" onClick={() => scrollToId("pricing")}>
                  The Hunter&apos;s World
                </button>
              </div>

              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Company</div>
                <a href="#">Contact</a>
                <Link href="/legal">Terms Of Service</Link>
                <Link href="/legal">Privacy Policy</Link>
                <Link href="/legal">Refund Policy</Link>
              </div>
            </div>

            <div className={styles.footerDivider} />

            <div className={styles.footerBottom}>
              <span>© 2026 NEETLeveling. All rights reserved.</span>
              <span className={styles.footerStatus}>
                <span className={styles.dot} />
                System Online
              </span>
            </div>
          </div>

          <div className={styles.disclaimer}>
            NEETLeveling provides the quest system, deadlines, and accountability structure only — not NEET study
            content, notes, or question banks. Bring your own material; the System makes sure you use it.
          </div>
        </footer>
      </div>
    </div>
  );
}
