"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

/**
 * Registers the service worker and tells it which language to keep offline.
 *
 * Only in production: in development a cached shell makes every change look
 * like it did not happen.
 */
export function ServiceWorkerRegistration() {
  const locale = useLocale();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        if (cancelled) return;
        // Wait until a worker is actually controlling pages before asking it
        // to precache, otherwise the message lands nowhere.
        const worker = registration.active ?? (await navigator.serviceWorker.ready).active;
        worker?.postMessage({ type: "precache", locale });
      } catch {
        // No service worker (private mode, unsupported browser, blocked): the
        // app works exactly as before, just without the offline shell.
      }
    };

    void register();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return null;
}
