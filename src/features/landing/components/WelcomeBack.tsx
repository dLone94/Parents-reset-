"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { effectiveStatus } from "@/features/load/logic";
import { completionRatio } from "@/features/history/summarise";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/intl/format";
import { cn } from "@/lib/utils/cn";
import { useRepositories } from "@/services/persistence/PersistenceProvider";
import type { ResetRecord } from "@/types/reset";

interface Snapshot {
  lastReset: ResetRecord | null;
  openLoad: number;
  resetCount: number;
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
  const { resets, load } = useRepositories();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([resets.list(), load.list()])
      .then(([records, items]) => {
        if (cancelled) return;
        const now = new Date();
        setSnapshot({
          lastReset: records[0] ?? null,
          openLoad: items.filter((i) => effectiveStatus(i, now) === "open").length,
          resetCount: records.length,
        });
      })
      .catch(() => !cancelled && setSnapshot(null));
    return () => {
      cancelled = true;
    };
  }, [resets, load]);

  if (!snapshot || (snapshot.resetCount === 0 && snapshot.openLoad === 0)) return null;

  const last = snapshot.lastReset;
  const today = last ? isSameDay(new Date(last.createdAt), new Date()) : false;
  const ratio = last ? completionRatio(last) : null;
  const hour = new Date().getHours();

  return (
    <section className="border-b border-line bg-paper/70">
      <Container className="py-8 md:py-10">
        <div className="fade-in rounded-3xl border border-line bg-paper p-5 shadow-soft md:p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{t(`greeting.${greetingKey(hour)}`)}</p>
          <h2 className="font-display mt-2 text-2xl md:text-3xl">
            {today && last ? t("todayDone") : t("title")}
          </h2>

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
                <Link href={`/reset/${last.id}`} className="mt-3 inline-block text-sm font-semibold text-clay-deep underline-offset-4 hover:underline">
                  {t("openLast")}
                </Link>
              </div>
            )}
            <div className="rounded-2xl border border-line bg-cream p-4">
              <p className="text-sm text-ink-muted">{t("loadLabel")}</p>
              <p className="mt-1 text-base">{t("openItems", { count: snapshot.openLoad })}</p>
              <Link href="/load" className="mt-3 inline-block text-sm font-semibold text-clay-deep underline-offset-4 hover:underline">
                {t("openLoad")}
              </Link>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/reset" className={buttonClassName("primary", "lg")}>
              {today ? t("ctaAgain") : t("cta")}
            </Link>
            {snapshot.resetCount > 1 && (
              <Link href="/history" className={buttonClassName("secondary", "lg")}>
                {t("history", { count: snapshot.resetCount })}
              </Link>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
