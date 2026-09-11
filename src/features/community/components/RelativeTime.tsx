"use client";

import { useLocale } from "next-intl";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** "3 hours ago", localised via Intl.RelativeTimeFormat. */
export function RelativeTime({ iso }: { iso: string }) {
  const locale = useLocale();
  // Read the clock through an external store so rendering stays pure and the
  // server snapshot matches the first client render.
  const now = useSyncExternalStore(subscribe, () => Date.now(), () => Date.now());
  return <time dateTime={iso}>{formatRelative(iso, now, locale)}</time>;
}

export function formatRelative(iso: string, now: number, locale: string): string {
  const diffSeconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diffSeconds);
  if (abs < 60) return rtf.format(diffSeconds, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSeconds / 86400), "day");
  return rtf.format(Math.round(diffSeconds / (86400 * 30)), "month");
}
