"use client";

import { useEffect } from "react";

// Gated to production only — a service worker caching /_next/static/ chunks
// during `next dev` would fight Turbopack's own HMR/rebuild output and
// cause phantom stale-chunk errors during development.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js");
  }, []);

  return null;
}
