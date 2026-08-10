"use client";

import { useEffect, useState, useTransition } from "react";
import { sendBroadcast, getAudienceReach, type Audience } from "@/actions/broadcast";
import styles from "@/app/admin/admin.module.css";

export function BroadcastForm() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [reach, setReach] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getAudienceReach(audience).then((n) => {
      if (!cancelled) setReach(n);
    });
    return () => {
      cancelled = true;
    };
  }, [audience]);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSent(null);
    startTransition(async () => {
      const result = await sendBroadcast(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSent(result.sentCount);
      setTitle("");
      setMessage("");
    });
  }

  return (
    <>
      <section>
        <span className={styles.secLabel}>Compose broadcast</span>
        <div className={styles.card} style={{ padding: "20px" }}>
          <form action={handleSubmit}>
            {error && <div className={styles.formError}>{error}</div>}
            {sent !== null && (
              <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "9px", background: "rgba(61,220,132,.08)", border: "1px solid rgba(61,220,132,.35)", color: "var(--green)", fontSize: "12.5px" }}>
                Sent to {sent} hunter{sent === 1 ? "" : "s"}.
              </div>
            )}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Title</span>
              <input
                className={styles.fieldInput}
                name="title"
                type="text"
                placeholder="e.g. New quest set is live"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Message</span>
              <textarea
                className={styles.fieldInput}
                name="message"
                maxLength={180}
                placeholder="Keep it short — this shows as a push notification."
                style={{ resize: "none", minHeight: "90px", lineHeight: 1.5, fontFamily: "var(--font-inter), sans-serif" }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", color: "var(--slate)", textAlign: "right", marginTop: "4px" }}>
                {message.length}/180
              </div>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Audience</span>
              <select className={styles.fieldSelect} name="audience" value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
                <option value="all">All Hunters</option>
                <option value="active">Active subscribers only</option>
                <option value="locked">Currently locked accounts</option>
                <option value="e">Rank E only</option>
                <option value="d">Rank D only</option>
                <option value="c">Rank C only</option>
                <option value="b">Rank B only</option>
                <option value="a">Rank A only</option>
                <option value="s">Rank S only</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(79,157,255,.06)", border: "1px dashed var(--border-strong)", borderRadius: "9px", padding: "11px 14px", marginBottom: "20px", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px" }}>
              <span>Estimated reach</span>
              <span style={{ color: "var(--blue-2)", fontWeight: 600, fontSize: "14px" }}>
                {reach === null ? "…" : `${reach.toLocaleString("en-IN")} hunter${reach === 1 ? "" : "s"}`}
              </span>
            </div>
            <button type="submit" className={styles.btnDeploy} disabled={pending || !title || !message}>
              {pending ? "Sending…" : "Send Broadcast"}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
              </svg>
            </button>
          </form>
        </div>
      </section>

      <section>
        <span className={styles.secLabel}>Preview</span>
        <div className={styles.card} style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "9px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(79,157,255,.12)", border: "1px solid var(--border-strong)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" style={{ color: "var(--blue-2)" }}>
              <path d="M12 2C12 2 7 7.5 7 13a5 5 0 0 0 10 0c0-1.2-.4-2-1-2.8.1 1-.3 1.8-1 2.3.3-2.5-1-4-1.6-5.2C13 6 13.4 4 12 2Z" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{title || "New quest set is live"}</div>
            <div style={{ fontSize: "12.5px", color: "var(--slate)", marginTop: "3px", lineHeight: 1.5 }}>
              {message || "Your message will appear here as hunters will see it."}
            </div>
            <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", color: "#4a5476", marginTop: "6px" }}>
              NOW · NEETLEVELING
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
