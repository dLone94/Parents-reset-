"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { Narrow } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/intl/format";
import { cn } from "@/lib/utils/cn";
import { localDay } from "@/lib/utils/day";
import { useRepositories } from "@/services/persistence/PersistenceProvider";
import type { DayNote } from "@/types/journal";
import type { ResetRecord } from "@/types/reset";
import { returnsKey, summariseReturns } from "../returns";
import { WeekStrip } from "./WeekStrip";
import { completionRatio, summariseHistory } from "../summarise";

export function HistoryView() {
  const t = useTranslations("history");
  const tr = useTranslations("reset.questions.areas.options");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { resets, dayNotes, userId } = useRepositories();
  const [records, setRecords] = useState<ResetRecord[] | null>(null);
  const [notes, setNotes] = useState<DayNote[]>([]);

  useEffect(() => {
    let cancelled = false;
    resets
      .list()
      .then((list) => !cancelled && setRecords(list))
      .catch(() => !cancelled && setRecords([]));
    dayNotes
      .list()
      .then((list) => !cancelled && setNotes(list))
      .catch(() => !cancelled && setNotes([]));
    return () => {
      cancelled = true;
    };
  }, [resets, dayNotes]);

  async function remove(id: string) {
    await resets.remove(id);
    setRecords((prev) => (prev ?? []).filter((r) => r.id !== id));
  }

  const summary = summariseHistory(records ?? []);
  const today = localDay();
  const returns = summariseReturns(
    [
      ...(records ?? []).map((record) => localDay(new Date(record.createdAt))),
      ...notes.map((note) => note.day),
    ],
    today,
  );
  const returnsMessage = returnsKey(returns);
  const lighter =
    summary.recentAverage !== null && summary.earlierAverage !== null
      ? summary.earlierAverage - summary.recentAverage
      : null;

  return (
    <Narrow className="flex flex-col gap-8 py-8 md:py-14">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{t("title")}</p>
        <h1 className="font-display text-3xl leading-tight md:text-5xl">{t("subtitle")}</h1>
        <p className="text-lg text-ink-soft" aria-live="polite">
          {records === null ? tc("loading") : t("count", { count: summary.count })}
        </p>
      </header>

      {notes.length > 0 && <WeekStrip notes={notes} today={today} />}

      {returns.total > 0 && (
        <section
          aria-label={t("returns.label")}
          className="rounded-3xl border border-moss/40 bg-moss-soft p-5 shadow-soft md:p-6"
        >
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-moss">{t("returns.label")}</h2>
          <p className="font-display mt-2 text-2xl md:text-3xl">
            {t("returns.total", { count: returns.total })}
          </p>
          <p className="mt-2 text-base text-ink-soft">
            {t(`returns.${returnsMessage}`, {
              total: returns.total,
              weeks: returns.weeks,
              days: returns.sinceLast,
              thisWeek: returns.thisWeek,
            })}
          </p>
          {returns.longestGap >= 7 && (
            <p className="mt-1 text-sm text-ink-muted">{t("returns.longestGap", { days: returns.longestGap })}</p>
          )}
        </section>
      )}

      {records && records.length > 0 && (
        <section aria-label={t("trend.label")} className="rounded-3xl border border-line bg-paper p-5 shadow-soft md:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-soft">{t("trend.label")}</h2>
            {summary.recentAverage !== null && (
              <p className="text-base text-ink-soft">{t("trend.average", { value: summary.recentAverage })}</p>
            )}
          </div>
          <div className="mt-4 flex h-16 items-end gap-1.5" role="img" aria-label={t("trend.chartLabel")}>
            {summary.trend.map((score, i) => (
              <span
                key={i}
                className={cn("w-5 rounded-t-md", score >= 7 ? "bg-clay" : score >= 4 ? "bg-honey" : "bg-moss")}
                style={{ height: `${(score / 10) * 100}%` }}
              />
            ))}
          </div>
          <p className="mt-3 text-base text-ink-soft">
            {lighter === null
              ? t("trend.needMore")
              : lighter > 0.5
                ? t("trend.lighter")
                : lighter < -0.5
                  ? t("trend.heavier")
                  : t("trend.steady")}
          </p>
          {summary.frequentAreas.length > 0 && (
            <p className="mt-1 text-sm text-ink-muted">
              {t("trend.frequentAreas", { areas: summary.frequentAreas.map((a) => tr(a)).join(", ") })}
            </p>
          )}
        </section>
      )}

      {records && records.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line bg-paper/60 p-6">
          <p className="font-semibold">{t("empty.title")}</p>
          <p className="mt-1 text-base text-ink-soft">{t("empty.body")}</p>
          <Link href="/reset" className={cn(buttonClassName("primary", "lg"), "mt-4")}>
            {t("empty.cta")}
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {(records ?? []).map((record) => {
          const ratio = completionRatio(record);
          return (
            <li key={record.id} className="rounded-2xl border border-line bg-paper p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-ink-muted">{formatDate(record.createdAt, locale, { dateStyle: "full" })}</p>
                  <p className="mt-1 text-lg font-semibold">
                    {t("overwhelm", { value: record.answers.overwhelm })}
                  </p>
                  <p className="text-sm text-ink-soft">{record.answers.areas.map((a) => tr(a)).join(" · ")}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                    record.answers.overwhelm >= 7
                      ? "bg-clay-soft text-clay-deep"
                      : record.answers.overwhelm >= 4
                        ? "bg-honey-soft text-honey"
                        : "bg-moss-soft text-moss",
                  )}
                >
                  {record.answers.overwhelm}/10
                </span>
              </div>
              <ol className="mt-3 space-y-1.5">
                {record.plan.today.map((item, index) => {
                  const done = record.completedItemIds?.includes(item.id);
                  return (
                    <li key={item.id} className="flex gap-2 text-base">
                      <span className="text-ink-muted">{index + 1}.</span>
                      <span className={cn(done && "text-ink-muted line-through")}>
                        {item.source === "user" ? item.text : <PlannerText messageKey={item.messageKey ?? ""} />}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-ink-muted">
                  {ratio === null ? "" : t("completion", { percent: Math.round(ratio * 100) })}
                </p>
                <div className="flex gap-2">
                  <Link href={`/reset/${record.id}`} className={buttonClassName("secondary", "md")}>
                    {t("open")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(record.id)}
                    className="focus-ring rounded-full px-3 text-sm font-semibold text-ink-soft underline-offset-4 hover:underline"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {!userId && records && records.length > 0 && (
        <p className="text-sm text-ink-muted">
          {t("guestNote")}{" "}
          <Link href="/account" className="font-semibold text-clay-deep underline-offset-4 hover:underline">
            {t("guestCta")}
          </Link>
        </p>
      )}
    </Narrow>
  );
}

function PlannerText({ messageKey }: { messageKey: string }) {
  const t = useTranslations("planner");
  return <>{t(messageKey as Parameters<typeof t>[0])}</>;
}
