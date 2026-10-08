"use client";

import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/site";
import styles from "@/components/feedback/ReportPage.module.css";

// Last line of defence for the one page hunters can always use to reach the
// admin: if rendering ever fails, show a way forward instead of a blank
// crash screen. Any message already typed is still in the browser's saved
// draft (see ReportPage), so retrying doesn't cost them their text.
export default function ReportBugError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className={styles.page}>
      <div className={styles.app}>
        <div className={styles.topbar}>
          <Link href="/settings" className={styles.back}>
            ← Back
          </Link>
        </div>
        <div className={styles.reportBox} style={{ marginTop: 40 }}>
          <div className={styles.success}>
            <div className={styles.successTitle}>This page hit a snag.</div>
            <div className={styles.successSub}>
              Nothing you typed is lost — it&apos;s saved on this device.
              <br />
              Try again in a moment.
              {SUPPORT_EMAIL && (
                <>
                  <br />
                  Or email{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "var(--blue)" }}>
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </>
              )}
            </div>
            <button type="button" className={styles.submitBtn} style={{ marginTop: 22 }} onClick={reset}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
