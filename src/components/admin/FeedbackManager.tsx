"use client";

import { useMemo, useState, useTransition } from "react";
import { updateBugReportStatus, updateFeatureRequestStatus } from "@/actions/feedback";
import type { BugReportStatus, FeatureRequestStatus } from "@/generated/prisma/client";
import { ticketCode } from "@/lib/ticket";
import styles from "@/app/admin/admin.module.css";

type BugReport = {
  id: string;
  title: string;
  description: string;
  screenshotUrl: string | null;
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

const BUG_SELECT_CLASS: Record<BugReportStatus, string> = { OPEN: "open", IN_PROGRESS: "progress", FIXED: "fixed" };
const FEATURE_SELECT_CLASS: Record<FeatureRequestStatus, string> = { OPEN: "open", PLANNED: "progress", SHIPPED: "fixed" };

export function FeedbackManager({
  bugReports: initialBugs,
  featureRequests: initialFeatures,
}: {
  bugReports: BugReport[];
  featureRequests: FeatureRequest[];
}) {
  const [bugs, setBugs] = useState(initialBugs);
  const [features, setFeatures] = useState(initialFeatures);
  const [bugFilter, setBugFilter] = useState<"all" | BugReportStatus>("all");
  const [featureFilter, setFeatureFilter] = useState<"all" | FeatureRequestStatus>("all");
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

  const bugCounts = useMemo(
    () => ({
      OPEN: bugs.filter((b) => b.status === "OPEN").length,
      IN_PROGRESS: bugs.filter((b) => b.status === "IN_PROGRESS").length,
      FIXED: bugs.filter((b) => b.status === "FIXED").length,
    }),
    [bugs],
  );
  const featureCounts = useMemo(
    () => ({
      OPEN: features.filter((f) => f.status === "OPEN").length,
      PLANNED: features.filter((f) => f.status === "PLANNED").length,
      SHIPPED: features.filter((f) => f.status === "SHIPPED").length,
    }),
    [features],
  );

  const filteredBugs = bugFilter === "all" ? bugs : bugs.filter((b) => b.status === bugFilter);
  const filteredFeatures = featureFilter === "all" ? features : features.filter((f) => f.status === featureFilter);

  return (
    <>
      <section>
        <div className={styles.statsRow} style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className={styles.statCard}>
            <div className={`${styles.statNum} ${styles.gold}`}>{bugCounts.OPEN}</div>
            <div className={styles.statLbl}>Open</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statNum} ${styles.violet}`}>{bugCounts.IN_PROGRESS}</div>
            <div className={styles.statLbl}>In Progress</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statNum} ${styles.green}`}>{bugCounts.FIXED}</div>
            <div className={styles.statLbl}>Fixed</div>
          </div>
        </div>

        <span className={styles.secLabel} style={{ marginTop: "var(--sp-5)" }}>
          <span className={styles.dot} />Bug Reports ({bugs.length})
        </span>
        <div className={styles.filterTabs} style={{ marginBottom: "var(--sp-3)" }}>
          {(["all", ...BUG_STATUSES] as const).map((f) => (
            <div
              key={f}
              className={`${styles.filterTab} ${bugFilter === f ? styles.filterTabActive : ""}`}
              onClick={() => setBugFilter(f)}
            >
              {f === "all" ? "All" : f.replace("_", " ")}
            </div>
          ))}
        </div>
        <div className={styles.panelBox}>
          {filteredBugs.length === 0 ? (
            <div className={styles.rowDashed} style={{ textAlign: "center", color: "var(--slate)" }}>
              No bug reports.
            </div>
          ) : (
            filteredBugs.map((b) => (
              <div key={b.id} className={styles.breqRow}>
                <div className={styles.breqInfo}>
                  <div className={styles.breqTitle}>{b.title}</div>
                  <div className={styles.breqDesc}>{b.description}</div>
                  <div className={styles.breqMeta}>
                    {ticketCode(b.id)} · {b.hunterName} · {new Date(b.createdAt).toLocaleDateString("en-IN")}
                    {b.screenshotUrl && (
                      <>
                        {" · "}
                        <a href={b.screenshotUrl} target="_blank" rel="noreferrer" style={{ color: "var(--blue)" }}>
                          Screenshot
                        </a>
                      </>
                    )}
                  </div>
                </div>
                <select
                  value={b.status}
                  onChange={(e) => changeBugStatus(b.id, e.target.value as BugReportStatus)}
                  className={`${styles.statusSelect} ${styles[BUG_SELECT_CLASS[b.status]]}`}
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
      </section>

      <section>
        <div className={styles.statsRow} style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className={styles.statCard}>
            <div className={`${styles.statNum} ${styles.gold}`}>{featureCounts.OPEN}</div>
            <div className={styles.statLbl}>Open</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statNum} ${styles.violet}`}>{featureCounts.PLANNED}</div>
            <div className={styles.statLbl}>Planned</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statNum} ${styles.green}`}>{featureCounts.SHIPPED}</div>
            <div className={styles.statLbl}>Shipped</div>
          </div>
        </div>

        <span className={styles.secLabel} style={{ color: "var(--violet)", marginTop: "var(--sp-5)" }}>
          <span className={styles.dot} style={{ background: "var(--violet)", boxShadow: "0 0 6px var(--violet)" }} />
          Feature Requests ({features.length})
        </span>
        <div className={styles.filterTabs} style={{ marginBottom: "var(--sp-3)" }}>
          {(["all", ...FEATURE_STATUSES] as const).map((f) => (
            <div
              key={f}
              className={`${styles.filterTab} ${featureFilter === f ? styles.filterTabActive : ""}`}
              onClick={() => setFeatureFilter(f)}
            >
              {f === "all" ? "All" : f}
            </div>
          ))}
        </div>
        <div className={styles.panelBox}>
          {filteredFeatures.length === 0 ? (
            <div className={styles.rowDashed} style={{ textAlign: "center", color: "var(--slate)" }}>
              No feature requests.
            </div>
          ) : (
            filteredFeatures.map((f) => (
              <div key={f.id} className={styles.breqRow}>
                <div className={styles.breqInfo}>
                  <div className={styles.breqTitle}>{f.title}</div>
                  <div className={styles.breqDesc}>{f.description}</div>
                  <div className={styles.breqMeta}>
                    {ticketCode(f.id)} · {f.hunterName} · {new Date(f.createdAt).toLocaleDateString("en-IN")}
                  </div>
                </div>
                <select
                  value={f.status}
                  onChange={(e) => changeFeatureStatus(f.id, e.target.value as FeatureRequestStatus)}
                  className={`${styles.statusSelect} ${styles[FEATURE_SELECT_CLASS[f.status]]}`}
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
      </section>
    </>
  );
}
