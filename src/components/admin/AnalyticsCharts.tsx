"use client";

import styles from "@/app/admin/admin.module.css";

export function RevenueBarChart({ data }: { data: { label: string; value: number }[] }) {
  const bw = 320;
  const bh = 120;
  const pad = 6;
  const maxV = Math.max(1, ...data.map((d) => d.value));
  const barW = (bw - pad * 2) / data.length - 8;

  return (
    <div>
      <svg viewBox={`0 0 ${bw} ${bh}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#4f9dff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8fd6ff" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const h = (d.value / maxV) * (bh - 14);
          const x = pad + i * ((bw - pad * 2) / data.length) + 4;
          const y = bh - h;
          return <rect key={d.label} x={x} y={y} width={barW} height={h} rx="4" fill="url(#barGrad)" />;
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9.5px", color: "var(--slate)" }}>
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export function CompletionLineChart({ points }: { points: number[] }) {
  const lw = 320;
  const lh = 100;
  const lpad = 4;
  const minP = Math.min(...points, 0) - 5;
  const maxP = Math.max(...points, 10) + 5;
  const coords = points.map((v, i) => {
    const x = lpad + (i / (points.length - 1)) * (lw - lpad * 2);
    const y = lh - ((v - minP) / (maxP - minP)) * (lh - lpad * 2) - lpad;
    return [x, y] as const;
  });
  const pathD = coords.map((c, i) => (i === 0 ? "M" : "L") + c[0].toFixed(1) + "," + c[1].toFixed(1)).join(" ");
  const areaD = `${pathD} L${coords[coords.length - 1][0]},${lh} L${coords[0][0]},${lh} Z`;

  return (
    <svg viewBox={`0 0 ${lw} ${lh}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fd6ff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8fd6ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#lineGrad)" />
      <path d={pathD} fill="none" stroke="#8fd6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FunnelChart({ steps }: { steps: { label: string; value: number; pct: number }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {steps.map((s) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className={styles.fieldLabel} style={{ width: "140px", flexShrink: 0, marginBottom: 0, textTransform: "none" }}>
            {s.label}
          </span>
          <div style={{ flex: 1, height: "26px", borderRadius: "7px", background: "rgba(255,255,255,.04)", overflow: "hidden", position: "relative" }}>
            <div
              style={{
                height: "100%",
                borderRadius: "7px",
                background: "linear-gradient(90deg, rgba(79,157,255,.3), var(--blue-2))",
                width: `${Math.max(s.pct, s.value > 0 ? 6 : 0)}%`,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: "10px",
              }}
            >
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "#04070f", fontWeight: 600 }}>{s.value}</span>
            </div>
          </div>
          <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", width: "38px", textAlign: "right", flexShrink: 0 }}>
            {s.pct}%
          </span>
        </div>
      ))}
    </div>
  );
}
