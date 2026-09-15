"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { effectiveStatus } from "@/features/load/logic";
import { completionRatio } from "@/features/history/summarise";
import { returnsKey, summariseReturns } from "@/features/history/returns";
import { pickResurfaced } from "@/features/kept/resurface";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/intl/format";
import { cn } from "@/lib/utils/cn";
import { dayToDate, daysBetween, localDay } from "@/lib/utils/day";
import { useRepositories } from "@/services/persistence/PersistenceProvider";
import { keptMoments, type DayNote, type KeptMoment } from "@/types/journal";
import type { ResetRecord } from "@/types/reset";
import { QuickActions } from "./QuickActions";

interface Snapshot {
  lastReset: ResetRecord | null;
  openLoad: number;
  resetCount: number;
  notes: DayNote[];
  moments: KeptMoment[];
  /** Every day the parent did something: resets and evening closes. */
  activeDays: string[];
}

function greetingKey(hour: number): "morning" | "afternoon" | "evening" | "night" {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  if (hour < 23) return "evening";
  return "night";
}

/**
 * Shown on the home page only to parents who have used the app before on
 * this device or account. First-time visitors see the plain landing page.
 */
export function WelcomeBack() {
  const t = useTranslations("home.welcome");
  const tp = useTranslations("planner");
  const locale = useLocale();
  const { resets, load, dayNotes } = useRepositories();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const today = useMemo(() => localDay(), []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      resets.list(),
      load.list(),
      dayNotes.list().catch(() => [] as DayNote[]),
    ])
      .then(([records, items, notes]) => {
        if (cancelled) return;
        const now = new Date();
        setSnapshot({
          lastReset: records[0] ?? null,
          openLoad: items.filter((i) => effectiveStatus(i, now) === "open").length,
          resetCount: records.length,
          notes,
          moments: keptMoments(notes),
          activeDays: [
            ...records.map((record) => localDay(new Date(record.createdAt))),
            ...notes.map((note) => note.day),
          ],
        });
      })
      .catch(() => !cancelled && setSnapshot(null));
    return () => {
      cancelled = true;
    };
  }, [resets, load, dayNotes]);

  if (!snapshot) return null;
  const nothingYet =
    snapshot.resetCount === 0 && snapshot.openLoad === 0 && snapshot.notes.length === 0;
  if (nothingYet) return null;

  const last = snapshot.lastReset;
  const todayClosed = snapshot.notes.some((note) => note.day === today);
  const closedToday = todayClosed;
  const isToday = last ? isSameDay(new Date(last.createdAt), new Date()) : false;
  const ratio = last ? completionRatio(last) : null;
  const hour = new Date().getHours();
  const returns = summariseReturns(snapshot.activeDays, today);
  const returnsMessage = returnsKey(returns);
  const resurfaced = pickResurfaced(snapshot.moments, today);
  const yesterdayNote = snapshot.notes.find((note) => daysBetween(note.day, today) === 1);
  const tomorrowLine = yesterdayNote?.tomorrow?.trim();

  return (
    <section className="border-b border-line bg-paper/70">
      <Container className="flex flex-col gap-5 py-8 md:py-10">
        <div className="fade-in rounded-3xl border border-line bg-paper p-5 shadow-soft md:p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
            {t(`greeting.${greetingKey(hour)}`)}
          </p>
          <h2 className="font-display mt-2 text-2xl md:text-3xl">
            {isToday && last ? t("todayDone") : t("title")}
          </h2>
          {returnsMessage !== "none" && returnsMessage !== "first" && (
            <p className="mt-2 text-base text-ink-soft">
              {t(`returns.${returnsMessage}`, {
                total: returns.total,
                weeks: returns.weeks,
                days: returns.sinceLast,
                thisWeek: returns.thisWeek,
              })}
            </p>
          )}

          <QuickActions className="mt-5" closedToday={closedToday} hour={hour} />

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {last && (
              <div className="rounded-2xl border border-line bg-cream p-4">
                <p className="text-sm text-ink-muted">
                  {t("lastReset", { date: formatDate(last.createdAt, locale, { dateStyle: "medium" }) })}
                </p>
                <p className="mt-1 text-base">{tp(last.plan.summaryKey as Parameters<typeof tp>[0])}</p>
                {ratio !== null && (
                  <p className={cn("mt-2 text-sm font-semibold", ratio === 1 ? "text-moss" : "text-ink-soft")}>
                    {t("progress", { percent: Math.round(ratio * 100) })}
                  </p>
                )}
                <Link
                  href={`/reset/${last.id}`}
                  className="mt-3 inline-block text-sm font-semibold text-clay-deep underline-offset-4 hover:underline"
                >
                  {t("openLast")}
                </Link>
              </div>
            )}
            <div className="rounded-2xl border border-line bg-cream p-4">
              <p className="text-sm text-ink-muted">{t("loadLabel")}</p>
              <p className="mt-1 text-base">{t("openItems", { count: snapshot.openLoad })}</p>
              <Link
                href="/load"
                className="mt-3 inline-block text-sm font-semibold text-clay-deep underline-offset-4 hover:underline"
              >
                {t("openLoad")}
              </Link>
            </div>
          </div>

          {tomorrowLine && (
            <div className="mt-5 rounded-2xl border border-honey/40 bg-honey-soft p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-honey">
                {t("tomorrowLabel")}
              </p>
              <p className="mt-1 text-lg">{tomorrowLine}</p>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/reset" className={buttonClassName("primary", "lg")}>
              {isToday ? t("ctaAgain") : t("cta")}
            </Link>
            {snapshot.resetCount > 1 && (
              <Link href="/history" className={buttonClassName("secondary", "lg")}>
                {t("history", { count: snapshot.resetCount })}
              </Link>
            )}
          </div>
        </div>

        {resurfaced && (
          <Link
            href="/kept"
            className="focus-ring fade-in block rounded-3xl border border-moss/40 bg-moss-soft p-5 shadow-soft transition-colors hover:border-moss md:p-7"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-moss">
              {t("kept.label", { days: daysBetween(resurfaced.day, today) })}
            </p>
            <blockquote className="font-display mt-3 text-xl leading-snug md:text-2xl">
              {resurfaced.text}
            </blockquote>
            <p className="mt-3 text-sm text-ink-soft">
              {formatDate(dayToDate(resurfaced.day).toISOString(), locale, { dateStyle: "long" })}
            </p>
          </Link>
        )}
      </Container>
    </section>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
