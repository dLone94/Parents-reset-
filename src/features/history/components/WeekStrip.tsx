"use client";

import { useLocale, useTranslations } from "next-intl";
import { WeatherIcon } from "@/features/evening/components/WeatherPicker";
import { formatDate } from "@/lib/intl/format";
import { cn } from "@/lib/utils/cn";
import { dayToDate } from "@/lib/utils/day";
import type { DayNote } from "@/types/journal";
import { closedThisWeek, weekStrip } from "../week";

const tone = {
  storm: "bg-clay-soft text-clay-deep border-clay/40",
  rain: "bg-honey-soft text-honey border-honey/40",
  cloudy: "bg-sand text-ink-soft border-ink-muted/30",
  sun: "bg-moss-soft text-moss border-moss/40",
} as const;

/**
 * Seven days as weather. The quickest honest picture of a week: a row of
 * storms says something a number never could, and the empty days stay empty
 * rather than being scored.
 */
export function WeekStrip({ notes, today }: { notes: DayNote[]; today?: string }) {
  const t = useTranslations("history.week");
  const tw = useTranslations("evening.weather.options");
  const locale = useLocale();
  const days = weekStrip(notes, today);
  const closed = closedThisWeek(notes, today);

  return (
    <section aria-labelledby="week-strip" className="rounded-3xl border border-line bg-paper p-5 shadow-soft md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="week-strip" className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-soft">
          {t("label")}
        </h2>
        {closed > 0 && <p className="text-base text-ink-soft">{t("closed", { count: closed })}</p>}
      </div>

      <ol className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {days.map((day) => {
          const date = dayToDate(day.day);
          const weekday = formatDate(date.toISOString(), locale, { weekday: "short" });
          const label = day.weather
            ? `${formatDate(date.toISOString(), locale, { dateStyle: "long" })}: ${tw(day.weather)}`
            : `${formatDate(date.toISOString(), locale, { dateStyle: "long" })}: ${t(day.closed ? "closedNoWeather" : "notClosed")}`;

          return (
            <li key={day.day} className="flex flex-col items-center gap-1.5">
              <span
                title={label}
                className={cn(
                  "flex aspect-square w-full items-center justify-center rounded-2xl border",
                  day.weather
                    ? tone[day.weather]
                    : day.closed
                      ? "border-line bg-cream text-ink-muted"
                      : "border-dashed border-line bg-transparent text-ink-muted",
                  day.isToday && "ring-2 ring-clay/40",
                )}
              >
                <span className="sr-only">{label}</span>
                {day.weather ? (
                  <WeatherIcon weather={day.weather} size={22} />
                ) : (
                  <span aria-hidden className={day.closed ? "text-lg" : "text-lg opacity-40"}>
                    {day.closed ? "·" : ""}
                  </span>
                )}
              </span>
              <span aria-hidden className="text-xs text-ink-muted">
                {weekday}
              </span>
            </li>
          );
        })}
      </ol>

      {closed === 0 && <p className="mt-4 text-base text-ink-soft">{t("empty")}</p>}
    </section>
  );
}
