"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { submitBugReport, submitFeatureRequest, uploadReportScreenshot } from "@/actions/feedback";
import styles from "./ReportPage.module.css";

export type ReportItem = {
  id: string;
  ticket: string;
  title: string;
  dateLabel: string;
  kind: "Bug" | "Feature";
  statusLabel: string;
  tone: "open" | "progress" | "fixed";
};

type Category = "Bug" | "Feature" | "Other";

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

// Each category gets its own wording — a feature request shouldn't read like
// a bug report.
const COPY: Record<
  Category,
  {
    label: string;
    eyebrow: string;
    title: string;
    sub: ReactNode;
    titlePlaceholder: string;
    descLabel: string;
    descPlaceholder: string;
    descError: string;
    submit: string;
    successTitle: string;
    successNote: ReactNode;
  }
> = {
  Bug: {
    label: "Bug / Glitch",
    eyebrow: "Something Broken?",
    title: "Report An Issue",
    sub: (
      <>
        Every report gets a real look. Bugs get fixed within <b>48 hours</b>.
      </>
    ),
    titlePlaceholder: "e.g. Timer freezes on Focus Mode",
    descLabel: "What Happened?",
    descPlaceholder: "What were you doing, what did you expect, and what actually happened?",
    descError: "A quick description helps us fix it faster.",
    submit: "Submit Report",
    successTitle: "Report Sent.",
    successNote: (
      <>
        We&apos;ll have this looked at within <b>48 hours</b>.
      </>
    ),
  },
  Feature: {
    label: "Feature Request",
    eyebrow: "Got An Idea?",
    title: "Request A Feature",
    sub: (
      <>
        Every request gets read. If it improves the System, it ships <b>free for every Hunter</b>.
      </>
    ),
    titlePlaceholder: "e.g. Dark mode toggle for Focus Mode",
    descLabel: "What Should It Do?",
    descPlaceholder: "Describe the feature and how it would help you study or use the System.",
    descError: "Tell us a bit more so we can understand the idea.",
    submit: "Submit Request",
    successTitle: "Request Logged.",
    successNote: (
      <>
        If it improves the System, it&apos;ll ship <b>free for every Hunter</b>.
      </>
    ),
  },
  Other: {
    label: "Other",
    eyebrow: "Something Else?",
    title: "Get In Touch",
    sub: "Anything that doesn't fit the other two — tell us here and we'll point you the right way.",
    titlePlaceholder: "e.g. Question about my subscription",
    descLabel: "Tell Us More",
    descPlaceholder: "Share the details so we can help.",
    descError: "A few details will help us respond properly.",
    submit: "Send Message",
    successTitle: "Message Sent.",
    successNote: "We'll get back to you as soon as we can.",
  },
};

function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={`${styles.reveal} ${shown ? styles.show : ""}`}>{children}</div>;
}

export function ReportPage({ initialReports }: { initialReports: ReportItem[] }) {
  const [category, setCategory] = useState<Category>("Bug");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [titleErr, setTitleErr] = useState(false);
  const [descErr, setDescErr] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [shot, setShot] = useState<{ file: File; previewUrl: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState<"form" | "success">("form");
  const [ticket, setTicket] = useState("");
  const [local, setLocal] = useState<ReportItem[]>([]);
  const [newId, setNewId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copy = COPY[category];

  // Reports submitted this session show instantly; once the server refresh
  // brings the same report back in initialReports, that copy wins.
  const localOnly = local.filter((l) => !initialReports.some((i) => i.id === l.id));
  const items = [...localOnly, ...initialReports];

  function takeFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > MAX_SCREENSHOT_BYTES) {
      setFormError("Screenshots must be an image under 5MB.");
      return;
    }
    setFormError(null);
    if (shot) URL.revokeObjectURL(shot.previewUrl);
    setShot({ file, previewUrl: URL.createObjectURL(file) });
  }

  function removeShot() {
    if (shot) URL.revokeObjectURL(shot.previewUrl);
    setShot(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const titleOk = title.trim().length >= 4;
    const descOk = desc.trim().length >= 8;
    setTitleErr(!titleOk);
    setDescErr(!descOk);
    setFormError(null);
    if (!titleOk || !descOk) return;

    startTransition(async () => {
      let screenshotUrl = "";
      if (shot && category !== "Feature") {
        setUploading(true);
        const upload = await uploadReportScreenshot(shot.file);
        setUploading(false);
        if ("error" in upload) {
          setFormError(upload.error);
          return;
        }
        screenshotUrl = upload.url;
      }

      const formData = new FormData();
      formData.set("title", title.trim());
      formData.set("description", desc.trim());
      formData.set("screenshotUrl", screenshotUrl);

      const result =
        category === "Feature" ? await submitFeatureRequest(formData) : await submitBugReport(formData);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }

      const report = result.report;
      if (report) {
        setTicket(report.ticket);
        setNewId(report.id);
        setLocal((prev) => [
          {
            id: report.id,
            ticket: report.ticket,
            title: report.title,
            dateLabel: new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Kolkata",
            }),
            kind: report.kind,
            statusLabel: "Open",
            tone: "open",
          },
          ...prev,
        ]);
      }
      setView("success");
    });
  }

  function reset() {
    setTitle("");
    setDesc("");
    setTitleErr(false);
    setDescErr(false);
    setFormError(null);
    removeShot();
    setView("form");
  }

  return (
    <div className={styles.page}>
      <div className={styles.app}>
        <div className={styles.topbar}>
          <Link href="/settings" className={styles.back}>
            ← Back
          </Link>
        </div>

        <Reveal>
          <div className={styles.pageHead}>
            <div className={styles.pageEyebrow}>
              <span className={styles.dot} />
              <span>{copy.eyebrow}</span>
            </div>
            <h2>{copy.title}</h2>
            <p>{copy.sub}</p>
          </div>
        </Reveal>

        <Reveal>
          <div className={styles.reportBox}>
            {view === "form" ? (
              <form onSubmit={submit} noValidate>
                {formError && <div className={styles.formError}>{formError}</div>}

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>What Is This About?</span>
                  <div className={styles.catRow}>
                    {(Object.keys(COPY) as Category[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`${styles.catBtn} ${category === c ? styles.selected : ""}`}
                        onClick={() => setCategory(c)}
                      >
                        {COPY[c].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="rp-title">Title</label>
                  <input
                    id="rp-title"
                    type="text"
                    className={titleErr ? styles.error : ""}
                    value={title}
                    maxLength={120}
                    placeholder={copy.titlePlaceholder}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  {titleErr && (
                    <div className={styles.fieldError}>Give it a short title so we know what it&apos;s about.</div>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="rp-desc">{copy.descLabel}</label>
                  <textarea
                    id="rp-desc"
                    className={descErr ? styles.error : ""}
                    value={desc}
                    placeholder={copy.descPlaceholder}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                  {descErr && <div className={styles.fieldError}>{copy.descError}</div>}
                </div>

                {category !== "Feature" && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>
                      Screenshot <span style={{ textTransform: "none", color: "var(--slate)" }}>(optional)</span>
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => takeFile(e.target.files?.[0])}
                    />
                    {!shot ? (
                      <div
                        className={`${styles.shotDrop} ${dragOver ? styles.dragover : ""}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(false);
                          takeFile(e.dataTransfer.files[0]);
                        }}
                      >
                        <div className={styles.shotDropText}>📎 Drop a screenshot or click to upload</div>
                        <div className={styles.shotDropSub}>PNG, JPG — up to 5MB</div>
                      </div>
                    ) : (
                      <div className={styles.shotPreview}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={shot.previewUrl} alt="" />
                        <div className={styles.shotName}>{shot.file.name}</div>
                        <button type="button" className={styles.shotRemove} onClick={removeShot}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" className={styles.submitBtn} disabled={pending}>
                  {uploading ? "Uploading screenshot…" : pending ? "Sending…" : copy.submit}
                </button>
              </form>
            ) : (
              <div className={styles.success}>
                <div className={styles.successBadge}>✓</div>
                <div className={styles.successTitle}>{copy.successTitle}</div>
                <div className={styles.successSub}>
                  Ticket <b>{ticket}</b> logged.
                  <br />
                  {copy.successNote}
                </div>
                <button type="button" className={styles.successDone} onClick={reset}>
                  Done
                </button>
              </div>
            )}
          </div>
        </Reveal>

        <Reveal>
          <div className={styles.secTag}>
            <span className={styles.dot} />
            Your Reports
          </div>
        </Reveal>
        <Reveal>
          <div className={styles.histBox}>
            {items.length === 0 ? (
              <div className={styles.histEmpty}>
                No reports yet.
                <br />
                Anything you send shows up here with its status.
              </div>
            ) : (
              items.map((r) => (
                <div key={`${r.kind}-${r.id}`} className={`${styles.histRow} ${r.id === newId ? styles.new : ""}`}>
                  <div className={styles.histMain}>
                    <div className={styles.histTitle}>{r.title}</div>
                    <div className={styles.histMeta}>
                      {r.ticket} · {r.dateLabel} · {r.kind === "Feature" ? "Feature Request" : "Bug / Other"}
                    </div>
                  </div>
                  <div className={`${styles.histStatus} ${styles[r.tone]}`}>{r.statusLabel}</div>
                </div>
              ))
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
