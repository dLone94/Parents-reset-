"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { Narrow } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/intl/format";
import { cn } from "@/lib/utils/cn";
import { getResetRepository } from "@/services/persistence";
import type { PlanItem, ResetRecord } from "@/types/reset";
import { SafetyNotice } from "./SafetyNotice";

type State = { status: "loading" } | { status: "missing" } | { status: "ready"; record: ResetRecord };

export function ResultView({ id }: { id: string }) {
  const t = useTranslations("result");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getResetRepository()
      .get(id)
      .then((record) => {
        if (cancelled) return;
        setState(record ? { status: "ready", record } : { status: "missing" });
      })
      .catch(() => !cancelled && setState({ status: "missing" }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.status === "loading") {
    return (
      <Narrow className="py-16">
        <p className="text-lg text-ink-soft" aria-live="polite">
          {tc("loading")}
        </p>
      </Narrow>
    );
  }

  if (state.status === "missing") {
    return (
      <Narrow className="flex flex-col items-start gap-4 py-16">
        <h1 className="font-display text-3xl">{t("notFound.title")}</h1>
        <p className="text-lg text-ink-soft">{t("notFound.body")}</p>
        <Link href="/reset" className={buttonClassName("primary", "lg")}>
          {t("notFound.cta")}
        </Link>
      </Narrow>
    );
  }

  const { record } = state;
  const { plan } = record;

  return (
    <Narrow className="flex flex-col gap-8 py-8 md:py-14">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{t("title")}</p>
        <p className="text-sm text-ink-muted">{t("dateLabel", { date: formatDate(record.createdAt, locale) })}</p>
        <h1 className="font-display text-3xl leading-tight md:text-4xl">
          <PlannerText messageKey={plan.summaryKey} />
        </h1>
        <p className="text-lg text-ink-soft">
          <PlannerText messageKey={plan.timeKey} />
        </p>
      </header>

      {record.safetyFlag && <SafetyNotice />}

      <Bucket tone="clay" label={t("today.label")} intro={t("today.intro")} items={plan.today} numbered />
      <Bucket tone="honey" label={t("thisWeek.label")} intro={t("thisWeek.intro")} items={plan.thisWeek} />
      <Bucket tone="moss" label={t("letGo.label")} intro={t("letGo.intro")} items={plan.letGo} />

      <p className="text-base text-ink-muted">{t("savedLocally")}</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/reset" className={buttonClassName("primary", "lg")}>
          {t("newReset")}
        </Link>
        <Link href="/" className={buttonClassName("secondary", "lg")}>
          {t("backHome")}
        </Link>
      </div>

      <p className="text-sm text-ink-muted">{t("disclaimer")}</p>
    </Narrow>
  );
}

const tones = {
  clay: { chip: "bg-clay-soft text-clay-deep", dot: "bg-clay", border: "border-clay/30" },
  honey: { chip: "bg-honey-soft text-honey", dot: "bg-honey", border: "border-honey/30" },
  moss: { chip: "bg-moss-soft text-moss", dot: "bg-moss", border: "border-moss/30" },
} as const;

function Bucket({
  tone,
  label,
  intro,
  items,
  numbered,
}: {
  tone: keyof typeof tones;
  label: string;
  intro: string;
  items: PlanItem[];
  numbered?: boolean;
}) {
  const styles = tones[tone];
  const List = numbered ? "ol" : "ul";
  return (
    <section aria-label={label} className={cn("rounded-2xl border bg-paper p-5 shadow-soft md:p-6", styles.border)}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={cn("inline-block rounded-full px-3 py-1 text-sm font-semibold", styles.chip)}>{label}</span>
        <p className="text-base text-ink-soft">{intro}</p>
      </div>
      <List className="mt-4 space-y-3">
        {items.map((item, index) => (
          <li key={item.id} className="flex gap-3">
            {numbered ? (
              <span
                aria-hidden
                className={cn("font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base text-paper", styles.dot)}
              >
                {index + 1}
              </span>
            ) : (
              <span aria-hidden className={cn("mt-2.5 h-2 w-2 shrink-0 rounded-full", styles.dot)} />
            )}
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-lg leading-snug">
                {item.source === "user" ? item.text : <PlannerText messageKey={item.messageKey ?? ""} />}
              </p>
              {item.noteKey && (
                <p className="text-sm text-ink-muted">
                  <PlannerText messageKey={item.noteKey} />
                </p>
              )}
            </div>
          </li>
        ))}
      </List>
    </section>
  );
}

/** Resolves a planner message key ("today.moneyCheck") through the planner namespace. */
function PlannerText({ messageKey }: { messageKey: string }) {
  const t = useTranslations("planner");
  // Keys are produced by our own planner, never by users; the cast is safe.
  return <>{t(messageKey as Parameters<typeof t>[0])}</>;
}
