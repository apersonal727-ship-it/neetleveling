"use client";

import { useState, useTransition } from "react";
import styles from "./StartSessionButton.module.css";

export function StartSessionButton({
  action,
  children,
  className,
  style,
  message,
}: {
  action: () => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  message?: string;
}) {
  const [showAlert, setShowAlert] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    setShowAlert(false);
    startTransition(() => {
      action();
    });
  }

  return (
    <>
      <button
        type="button"
        className={className}
        style={style}
        onClick={() => setShowAlert(true)}
        disabled={isPending}
      >
        {children}
      </button>

      {showAlert && (
        <div className={styles.overlay}>
          <div className={styles.card}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
            <h2>System Alert</h2>
            <p>
              {message ??
                "Once you begin, the Focus Lock timer cannot be paused, abandoned, or backed out of until it ends."}
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowAlert(false)}>
                Cancel
              </button>
              <button type="button" className={styles.confirmBtn} onClick={confirm} disabled={isPending}>
                {isPending ? "Starting…" : "Begin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
