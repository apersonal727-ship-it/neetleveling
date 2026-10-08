"use client";

import styles from "./page.module.css";

// Cached by the service worker at install time (see public/sw.js) and
// served as the navigation fallback whenever a page request fails with no
// network — never shown for API/server-action calls, only full page loads.
export default function OfflinePage() {
  return (
    <div className={styles.wrap}>
      <span className={styles.mark} />
      <div className={styles.title}>You&apos;re offline</div>
      <p className={styles.subtitle}>
        No connection right now. Whatever you were doing in Focus Mode is still safe — the timer
        runs on real elapsed time, not this page.
      </p>
      <button type="button" className={styles.retryBtn} onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
}
