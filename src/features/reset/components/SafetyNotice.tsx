"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Shown above the plan when free text suggested immediate danger. Generic on
 * purpose: no invented phone numbers, no diagnosis. Country-aware resources
 * can be added later behind the same component.
 */
export function SafetyNotice() {
  const t = useTranslations("safety");
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <section
      role="region"
      aria-labelledby="safety-title"
      className="space-y-4 rounded-2xl border border-clay bg-paper p-6 shadow-lift"
    >
      <h2 id="safety-title" className="font-display text-2xl">
        {t("title")}
      </h2>
      <p className="text-lg text-ink-soft">{t("body")}</p>
      <ul className="space-y-3 text-lg">
        <li className="flex gap-3">
          <span aria-hidden className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-clay" />
          <span className="font-semibold">{t("emergency")}</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-clay" />
          <span>{t("trustedPerson")}</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-clay" />
          <span>{t("support")}</span>
        </li>
      </ul>
      <Button variant="secondary" onClick={() => setDismissed(true)}>
        {t("continue")}
      </Button>
    </section>
  );
}
