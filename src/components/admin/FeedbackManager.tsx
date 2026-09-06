"use client";

import { useState, useTransition } from "react";
import { updateBugReportStatus, updateFeatureRequestStatus } from "@/actions/feedback";
import type { BugReportStatus, FeatureRequestStatus } from "@/generated/prisma/client";
import styles from "@/app/admin/admin.module.css";

type BugReport = {
  id: string;
  title: string;
  description: string;
  status: BugReportStatus;
  createdAt: string;
  hunterName: string;
};

type FeatureRequest = {
  id: string;
  title: string;
  description: string;
  status: FeatureRequestStatus;
  createdAt: string;
  hunterName: string;
};

const BUG_STATUSES: BugReportStatus[] = ["OPEN", "IN_PROGRESS", "FIXED"];
const FEATURE_STATUSES: FeatureRequestStatus[] = ["OPEN", "PLANNED", "SHIPPED"];

export function FeedbackManager({
  bugReports: initialBugs,
  featureRequests: initialFeatures,
}: {
  bugReports: BugReport[];
  featureRequests: FeatureRequest[];
}) {
  const [bugs, setBugs] = useState(initialBugs);
  const [features, setFeatures] = useState(initialFeatures);
  const [, startTransition] = useTransition();

  function changeBugStatus(id: string, status: BugReportStatus) {
    setBugs((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    startTransition(() => {
      updateBugReportStatus(id, status);
    });
  }

  function changeFeatureStatus(id: string, status: FeatureRequestStatus) {
    setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
    startTransition(() => {
      updateFeatureRequestStatus(id, status);
    });
  }

  return (
    <>
      <div className={styles.card} style={{ marginBottom: "24px" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>
          Bug Reports ({bugs.length})
        </div>
        {bugs.length === 0 ? (
          <div style={{ padding: "20px", color: "var(--slate)" }}>No bug reports yet.</div>
        ) : (
          bugs.map((b) => (
            <div
              key={b.id}
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{b.title}</div>
                <div style={{ fontSize: "13px", color: "var(--slate)", marginTop: "4px" }}>{b.description}</div>
                <div style={{ fontSize: "11px", color: "var(--slate)", marginTop: "6px" }}>
                  {b.hunterName} · {new Date(b.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>
              <select
                value={b.status}
                onChange={(e) => changeBugStatus(b.id, e.target.value as BugReportStatus)}
                style={{
                  background: "var(--panel)",
                  color: "var(--ice)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  flexShrink: 0,
                }}
              >
                {BUG_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          ))
        )}
      </div>

      <div className={styles.card}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>
          Feature Requests ({features.length})
        </div>
        {features.length === 0 ? (
          <div style={{ padding: "20px", color: "var(--slate)" }}>No feature requests yet.</div>
        ) : (
          features.map((f) => (
            <div
              key={f.id}
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{f.title}</div>
                <div style={{ fontSize: "13px", color: "var(--slate)", marginTop: "4px" }}>{f.description}</div>
                <div style={{ fontSize: "11px", color: "var(--slate)", marginTop: "6px" }}>
                  {f.hunterName} · {new Date(f.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>
              <select
                value={f.status}
                onChange={(e) => changeFeatureStatus(f.id, e.target.value as FeatureRequestStatus)}
                style={{
                  background: "var(--panel)",
                  color: "var(--ice)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  flexShrink: 0,
                }}
              >
                {FEATURE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ))
        )}
      </div>
    </>
  );
}
