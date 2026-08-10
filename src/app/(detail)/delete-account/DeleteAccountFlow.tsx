"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestAccountDeletion } from "@/actions/settings";
import { signOut } from "@/actions/auth";

type Step = "warn" | "password" | "done";

export function DeleteAccountFlow({ hunterName }: { hunterName: string }) {
  const [step, setStep] = useState<Step>("warn");
  const [confirmName, setConfirmName] = useState("");
  const [agree, setAgree] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const step1Valid = confirmName === hunterName && agree;

  function handleSubmit() {
    setError(null);
    if (!password) return;
    const fd = new FormData();
    fd.set("confirmName", confirmName);
    fd.set("password", password);
    startTransition(async () => {
      const result = await requestAccountDeletion(fd);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setScheduledFor(result.scheduledFor);
      setStep("done");
    });
  }

  return (
    <>
      {step === "warn" && (
        <div>
          <div
            style={{
              padding: "20px",
              borderRadius: "14px",
              marginBottom: "24px",
              background: "rgba(255,77,94,.06)",
              border: "1px solid rgba(255,77,94,.35)",
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#ff8a94", marginBottom: "12px" }}>
              This deletes everything.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              {[
                "Your level, rank progress, and all XP",
                "Your streak and full quest history",
                "Any wallet credit — forfeited, not paid out",
                "Your active subscription — no refund for the current cycle",
              ].map((line) => (
                <div key={line} style={{ display: "flex", gap: "9px", fontSize: "13px", color: "#ffc9ce", lineHeight: 1.5 }}>
                  <span>✕</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Type {hunterName} to confirm
            </span>
            <input
              style={{ width: "100%", background: "var(--panel)", border: "1px solid var(--border-strong)", borderRadius: "10px", padding: "14px 15px", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "14px", color: "var(--ice)" }}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={hunterName}
            />
            <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--slate)", marginTop: "6px" }}>
              This matches your hunter name exactly.
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", margin: "20px 0 24px" }}>
            <input
              type="checkbox"
              id="agreeCheck"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              style={{ width: "17px", height: "17px", marginTop: "2px", accentColor: "var(--red)", flexShrink: 0 }}
            />
            <label htmlFor="agreeCheck" style={{ fontSize: "12.5px", color: "var(--slate)", lineHeight: 1.55 }}>
              I understand this forfeits my wallet credit and cannot be undone after the grace period.
            </label>
          </div>

          <button
            type="button"
            disabled={!step1Valid}
            onClick={() => setStep("password")}
            style={{
              width: "100%",
              height: "50px",
              borderRadius: "12px",
              fontFamily: "var(--font-rajdhani), sans-serif",
              fontWeight: 700,
              fontSize: "15.5px",
              background: "linear-gradient(135deg, var(--red), #c22636)",
              color: "#fff0f0",
              border: "none",
              cursor: step1Valid ? "pointer" : "default",
              opacity: step1Valid ? 1 : 0.4,
            }}
          >
            Continue
          </button>
        </div>
      )}

      {step === "password" && (
        <div>
          {error && (
            <div style={{ marginBottom: "16px", color: "#ffc9ce", fontSize: "13px" }}>{error}</div>
          )}
          <p style={{ fontSize: "13.5px", color: "var(--slate)", lineHeight: 1.6, marginBottom: "20px" }}>
            Enter your password to finish.
          </p>
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10.5px", color: "var(--slate)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", background: "var(--panel)", border: "1px solid var(--border-strong)", borderRadius: "10px", padding: "14px 15px", fontFamily: "var(--font-inter), sans-serif", fontSize: "14.5px", color: "var(--ice)" }}
            />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending || !password}
            style={{
              width: "100%",
              height: "50px",
              borderRadius: "12px",
              fontFamily: "var(--font-rajdhani), sans-serif",
              fontWeight: 700,
              fontSize: "15.5px",
              background: "linear-gradient(135deg, var(--red), #c22636)",
              color: "#fff0f0",
              border: "none",
              cursor: "pointer",
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? "Deleting…" : "Permanently Delete Account"}
          </button>
          <button
            type="button"
            onClick={() => setStep("warn")}
            style={{
              width: "100%",
              height: "50px",
              borderRadius: "12px",
              marginTop: "12px",
              border: "1px solid var(--border-strong)",
              color: "var(--ice)",
              background: "rgba(255,255,255,.02)",
              cursor: "pointer",
            }}
          >
            Go back
          </button>
        </div>
      )}

      {step === "done" && (
        <div style={{ textAlign: "center", paddingTop: "24px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,77,94,.1)",
              border: "1.5px solid var(--red-2)",
              boxShadow: "0 0 30px -6px var(--red-2)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--red-2)" strokeWidth="1.8" width="30" height="30">
              <path d="M12 9v4M12 17h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <h1 style={{ fontSize: "20px", marginBottom: "12px" }}>Account scheduled for deletion.</h1>
          <p style={{ fontSize: "13.5px", color: "var(--slate)", lineHeight: 1.65, marginBottom: "12px" }}>
            Your account and all data will be permanently erased on{" "}
            <span style={{ color: "var(--red-2)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
              {scheduledFor && new Date(scheduledFor).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </span>{" "}
            — a 14-day grace period.
          </p>
          <p style={{ fontSize: "13.5px", color: "var(--slate)", lineHeight: 1.65, marginBottom: "20px" }}>
            Changed your mind? Just log back in before then to cancel.
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            style={{
              display: "flex",
              width: "100%",
              height: "50px",
              borderRadius: "12px",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--border-strong)",
              color: "var(--ice)",
              background: "rgba(255,255,255,.02)",
              cursor: "pointer",
              fontFamily: "var(--font-rajdhani), sans-serif",
              fontWeight: 700,
              fontSize: "15.5px",
            }}
          >
            Log out now
          </button>
        </div>
      )}

      {step !== "done" && (
        <div style={{ marginTop: "16px" }}>
          <Link href="/settings" style={{ fontSize: "12px", color: "var(--slate)" }}>
            ← Back to Settings
          </Link>
        </div>
      )}
    </>
  );
}
