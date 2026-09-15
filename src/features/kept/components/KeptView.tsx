"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WeatherIcon } from "@/features/evening/components/WeatherPicker";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/intl/format";
import { dayToDate, daysBetween, localDay } from "@/lib/utils/day";
import { useRepositories } from "@/services/persistence/PersistenceProvider";
import { keptMoments, type KeptMoment } from "@/types/journal";
import { pickResurfaced } from "../resurface";

/**
 * Everything a parent decided was worth keeping, newest first, with one older
 * moment lifted to the top. Their words, unedited, with nothing counted.
 */
export function KeptView() {
  const t = useTranslations("kept");
  const locale = useLocale();
  const { dayNotes } = useRepositories();
  const [moments, setMoments] = useState<KeptMoment[] | null>(null);
  const today = useMemo(() => localDay(), []);

  useEffect(() => {
    let cancelled = false;
    dayNotes
      .list()
      .then((notes) => !cancelled && setMoments(keptMoments(notes)))
      .catch(() => !cancelled && setMoments([]));
    return () => {
      cancelled = true;
    };
  }, [dayNotes]);

  const resurfaced = moments ? pickResurfaced(moments, today) : null;

  if (moments === null) {
    return (
      <Container className="py-10">
        <p className="text-base text-ink-muted">{t("loading")}</p>
      </Container>
    );
  }

  if (moments.length === 0) {
    return (
      <Container className="flex flex-col items-start gap-5 py-10 md:py-16">
        <h1 className="font-display text-4xl md:text-5xl">{t("title")}</h1>
        <p className="max-w-xl text-lg leading-relaxed text-ink-soft">{t("empty.body")}</p>
        <Link href="/evening" className={buttonClassName("primary", "lg")}>
          {t("empty.cta")}
        </Link>
      </Container>
    );
  }

  return (
    <Container className="flex flex-col gap-8 py-8 md:py-14">
      <header className="space-y-3">
        <h1 className="font-display text-4xl md:text-5xl">{t("title")}</h1>
        <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
          {t("subtitle", { count: moments.length })}
        </p>
      </header>

      {resurfaced && (
        <section className="fade-in rounded-3xl border border-moss/40 bg-moss-soft p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-moss">
            {t("resurfaced.label", { days: daysBetween(resurfaced.day, today) })}
          </p>
          <blockquote className="font-display mt-3 text-2xl leading-snug md:text-3xl">
            {resurfaced.text}
          </blockquote>
          <p className="mt-3 text-sm text-ink-soft">
            {formatDate(dayToDate(resurfaced.day).toISOString(), locale, { dateStyle: "long" })}
          </p>
        </section>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {moments.map((moment) => (
          <li
            key={moment.id}
            className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5 shadow-soft"
          >
            <div className="flex items-center justify-between gap-3 text-sm text-ink-muted">
              <span>{formatDate(dayToDate(moment.day).toISOString(), locale, { dateStyle: "medium" })}</span>
              {moment.weather && (
                <span className="text-ink-soft">
                  <WeatherIcon weather={moment.weather} size={20} />
                </span>
              )}
            </div>
            <p className="text-lg leading-relaxed">{moment.text}</p>
          </li>
        ))}
      </ul>
    </Container>
  );
}
