// Deliberately minimal and conservative — this exists only to make the app
// installable and to keep the shell (not live data) available offline. It
// must never touch anything correctness-sensitive: Focus Mode's server
// actions, API routes, or dashboard/quest page data all depend on being
// hit fresh every time (see src/actions/focus.ts's server-side elapsed-time
// re-check), so this only ever intercepts same-origin GET requests, and
// only for two safe cases below. Everything else — every POST (all server
// actions), every API route, every cross-origin request — passes straight
// through untouched.
const CACHE_VERSION = "v1";
const CACHE_NAME = `neetleveling-shell-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL])),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Build output under /_next/static/ is content-hashed by Next.js — the
  // filename changes whenever the content does, so caching it forever is
  // always safe, never stale.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // Full page navigations: always prefer the network (real data), only
  // falling back to the cached offline shell if there's truly no
  // connection. Never caches the navigated-to page itself — quest/timer
  // state must always come from the network when it's reachable.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(OFFLINE_URL)) ?? Response.error();
      }),
    );
  }
});
