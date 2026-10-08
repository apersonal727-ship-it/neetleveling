"use client";

import { useEffect, useState } from "react";
import styles from "./InstallPrompt.module.css";

const DISMISS_KEY = "nl-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Chrome/Android fires beforeinstallprompt when the site meets install
// criteria (manifest + HTTPS + service worker) — we capture and defer it so
// the actual install button can trigger it on demand instead of the
// browser's own mini-infobar. iOS Safari never fires this event at all and
// has no programmatic install API, so it only ever gets static
// instructions (tap Share -> Add to Home Screen).
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // default hidden until checked, avoids a flash
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window));
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
    );

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (isStandalone || dismissed) return null;
  if (!isIOS && !deferredPrompt) return null; // Android/desktop: only once the browser actually offers it

  return (
    <div className={styles.banner}>
      <span className={styles.mark} />
      <div className={styles.body}>
        <div className={styles.title}>Install NEETLeveling</div>
        <div className={styles.subtitle}>
          {isIOS
            ? "Tap Share, then “Add to Home Screen.”"
            : "Add it to your home screen for the full app experience."}
        </div>
      </div>
      {!isIOS && (
        <button type="button" className={styles.installBtn} onClick={install}>
          Install
        </button>
      )}
      <button type="button" className={styles.closeBtn} onClick={dismiss} aria-label="Dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
