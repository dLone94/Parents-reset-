"use client";

import { useTranslations } from "next-intl";
import { dayWeather, type DayWeather } from "@/types/journal";
import { cn } from "@/lib/utils/cn";

const tone: Record<DayWeather, string> = {
  storm: "bg-clay-soft text-clay-deep border-clay",
  rain: "bg-honey-soft text-honey border-honey",
  cloudy: "bg-sand text-ink-soft border-ink-muted",
  sun: "bg-moss-soft text-moss border-moss",
};

/**
 * How the day felt, as weather. Four taps, no numbers: a mood scale from one
 * to ten reads like a clinical form, and nobody remembers what a six meant.
 */
export function WeatherPicker({
  value,
  onChange,
}: {
  value?: DayWeather;
  onChange: (value: DayWeather | undefined) => void;
}) {
  const t = useTranslations("evening.weather");

  return (
    <div role="radiogroup" aria-label={t("question")} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {dayWeather.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            // Tapping the chosen one again clears it: nothing here is compulsory.
            onClick={() => onChange(selected ? undefined : option)}
            className={cn(
              "tap focus-ring flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors",
              selected ? tone[option] : "border-line bg-paper text-ink-soft hover:border-ink-muted",
            )}
          >
            <WeatherIcon weather={option} />
            <span className="text-base font-semibold leading-snug">{t(`options.${option}`)}</span>
          </button>
        );
      })}
    </div>
  );
}

export function WeatherIcon({ weather, size = 30 }: { weather: DayWeather; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (weather) {
    case "storm":
      return (
        <svg {...common}>
          <path d="M7 16a4 4 0 01-.5-8 5.5 5.5 0 0110.6-1.2A3.6 3.6 0 0117.5 16" />
          <path d="M13 13l-2.5 4H14l-2 4.5" />
        </svg>
      );
    case "rain":
      return (
        <svg {...common}>
          <path d="M7 15a4 4 0 01-.5-8 5.5 5.5 0 0110.6-1.2A3.6 3.6 0 0117.5 15" />
          <path d="M8.5 18.5l-.8 2M12 18.5l-.8 2M15.5 18.5l-.8 2" />
        </svg>
      );
    case "cloudy":
      return (
        <svg {...common}>
          <path d="M7 18a4.2 4.2 0 01-.4-8.4 5.6 5.6 0 0110.8-1.3A3.8 3.8 0 0117.6 18z" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
        </svg>
      );
  }
}
