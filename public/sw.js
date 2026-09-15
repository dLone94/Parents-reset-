/*
  Parent Reset service worker.

  The point is narrow: a parent standing in a park with one bar of signal
  should still be able to breathe, run a reset and close their day. Guest data
  already lives on the device, so only the shell has to be there too.

  Strategy:
  - Navigations: network first (so a deploy is picked up), falling back to the
    cached page, then to the cached offline page for that language.
  - Static build assets and icons: cache first; their URLs are content-hashed.
  - Anything else (API routes, Supabase, POSTs): straight to the network, never
    cached. Account and community data is not ours to keep lying around.
*/

const VERSION = "v1";
const SHELL_CACHE = `parent-reset-shell-${VERSION}`;
const PAGE_CACHE = `parent-reset-pages-${VERSION}`;
const ASSET_CACHE = `parent-reset-assets-${VERSION}`;
const CURRENT = [SHELL_CACHE, PAGE_CACHE, ASSET_CACHE];

/** Screens worth having offline, relative to a locale root. */
const OFFLINE_PATHS = ["", "/pause", "/reset", "/evening", "/load", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("parent-reset-") && !CURRENT.includes(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

/**
 * The page tells us which language it is in once it has loaded, and we put
 * that language's core screens in the cache. Precaching all 26 locales would
 * cost a parent's data for pages they will never open.
 */
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "precache" || typeof data.locale !== "string") return;
  const locale = data.locale.replace(/[^a-zA-Z-]/g, "").slice(0, 10);
  if (!locale) return;

  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.all(
        OFFLINE_PATHS.map(async (path) => {
          const url = `/${locale}${path}`;
          try {
            const response = await fetch(url, { credentials: "same-origin" });
            if (response.ok) await cache.put(url, response);
          } catch {
            // Offline while precaching is fine; the next visit tries again.
          }
        }),
      );
    })(),
  );
});

function isAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  );
}

/** The offline page for the language of the request, falling back to English. */
async function offlinePage(url) {
  const locale = url.pathname.split("/")[1] ?? "";
  const shell = await caches.open(SHELL_CACHE);
  return (
    (await shell.match(`/${locale}/offline`)) ??
    (await shell.match("/en/offline")) ??
    new Response("", { status: 504, statusText: "Offline" })
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Auth callbacks and any future API routes must always hit the network.
  if (url.pathname.startsWith("/api/")) return;

  if (isAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })(),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(PAGE_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached =
            (await caches.match(request)) ?? (await caches.match(url.pathname));
          return cached ?? offlinePage(url);
        }
      })(),
    );
  }
});
