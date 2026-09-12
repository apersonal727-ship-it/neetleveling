"use client";

import { useRef, useState, useTransition } from "react";
import { submitBugReport, submitFeatureRequest, uploadReportScreenshot } from "@/actions/feedback";
import styles from "@/app/(onboarding)/onboarding.module.css";

type Category = "Bug" | "Feature" | "Other";

const CATEGORY_COPY: Record<Category, { label: string; titlePlaceholder: string; descPlaceholder: string; done: string }> = {
  Bug: {
    label: "Bug / Glitch",
    titlePlaceholder: "e.g. Timer freezes on Focus Mode",
    descPlaceholder: "What were you doing, what did you expect, and what actually happened?",
    done: "Reported. We aim to fix it within 48 hours — you'll get a notification when it's done.",
  },
  Feature: {
    label: "Feature Request",
    titlePlaceholder: "e.g. Dark mode for Focus Lock",
    descPlaceholder: "What you'd want it to do, and why it'd make the System better.",
    done: "Sent. If it improves the System, it'll be added free for every Hunter.",
  },
  Other: {
    label: "Other",
    titlePlaceholder: "e.g. Question about billing",
    descPlaceholder: "Tell us what's on your mind.",
    done: "Sent. A real person will take a look.",
  },
};

export function ReportForm() {
  const [category, setCategory] = useState<Category>("Bug");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const [screenshot, setScreenshot] = useState<{ file: File; previewUrl: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot({ file, previewUrl: URL.createObjectURL(file) });
  }

  function removeScreenshot() {
    if (screenshot) URL.revokeObjectURL(screenshot.previewUrl);
    setScreenshot(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      let screenshotUrl = "";
      if (screenshot && category !== "Feature") {
        setUploading(true);
        const uploadResult = await uploadReportScreenshot(screenshot.file);
        setUploading(false);
        if ("error" in uploadResult) {
          setError(uploadResult.error);
          return;
        }
        screenshotUrl = uploadResult.url;
      }
      formData.set("screenshotUrl", screenshotUrl);

      const result =
        category === "Feature" ? await submitFeatureRequest(formData) : await submitBugReport(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setDone(true);
      }
    });
  }

  const copy = CATEGORY_COPY[category];

  if (done) {
    return (
      <div
        className={styles.formError}
        style={{ background: "rgba(61, 220, 132, 0.08)", borderColor: "rgba(61, 220, 132, 0.35)" }}
      >
        <span>{copy.done}</span>
      </div>
    );
  }

  return (
    <form action={handleSubmit}>
      {error && (
        <div className={styles.formError}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 9v4M12 17h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className={styles.field2}>
        <span className={styles.fieldLabel}>What kind of issue?</span>
        <div className={styles.catRow}>
          {(Object.keys(CATEGORY_COPY) as Category[]).map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.catBtn} ${category === c ? styles.catBtnSelected : ""}`}
              onClick={() => setCategory(c)}
            >
              {CATEGORY_COPY[c].label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field2}>
        <span className={styles.fieldLabel}>Title</span>
        <input className={styles.fieldInput} name="title" type="text" placeholder={copy.titlePlaceholder} />
      </div>

      <div className={styles.field2}>
        <span className={styles.fieldLabel}>{category === "Feature" ? "Why it'd help" : "What happened?"}</span>
        <textarea className={styles.fieldInput} name="description" rows={5} placeholder={copy.descPlaceholder} />
      </div>

      {category !== "Feature" && (
        <div className={styles.field2}>
          <span className={styles.fieldLabel}>
            Screenshot <span style={{ textTransform: "none", color: "var(--slate)" }}>(optional)</span>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          {!screenshot ? (
            <div className={styles.shotDrop} onClick={() => fileInputRef.current?.click()}>
              <div className={styles.shotDropText}>📎 Click to upload a screenshot</div>
              <div className={styles.shotDropSub}>PNG, JPG — up to 5MB</div>
            </div>
          ) : (
            <div className={styles.shotPreview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={screenshot.previewUrl} alt="" />
              <div className={styles.shotPreviewName}>{screenshot.file.name}</div>
              <button type="button" className={styles.shotRemove} onClick={removeScreenshot}>
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      <button type="submit" className={styles.btnPrimary} disabled={pending}>
        <span>{uploading ? "Uploading screenshot…" : pending ? "Submitting…" : "Submit"}</span>
      </button>
    </form>
  );
}
