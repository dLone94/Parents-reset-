"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

function subscribe(listener: () => void): () => void {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

/**
 * A quiet line when the phone has no connection, so nothing in the app looks
 * broken. Almost everything keeps working — the reset, Family Load, breathing
 * and the evening close are all on the device — and this says which parts are
 * not: the community and signing in.
 */
export function OfflineBanner() {
  const t = useTranslations("offline");
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  if (online) return null;

  return (
    <div role="status" className="border-b border-honey/40 bg-honey-soft px-5 py-2.5 text-center">
      <p className="text-sm font-semibold text-honey">{t("banner")}</p>
    </div>
  );
}
