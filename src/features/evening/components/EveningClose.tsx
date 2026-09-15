"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Narrow } from "@/components/ui/Container";
import { Textarea } from "@/components/ui/Textarea";
import { WeatherPicker } from "@/features/evening/components/WeatherPicker";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/locales";
import { countCharacters } from "@/features/reset/schema";
import { createId } from "@/lib/utils/id";
import { daysBetween, localDay } from "@/lib/utils/day";
import { useRepositories } from "@/services/persistence/PersistenceProvider";
import { journalLimits, type DayNote, type DayWeather } from "@/types/journal";
import { closingKey } from "../closing";
import { dayNoteSchema } from "../schema";

type Stage = "writing" | "closed";

/**
 * The evening close: one screen, everything optional.
 *
 * Deliberately not a wizard. At 9pm a parent should be able to tap the weather
 * and put the phone down, or write three lines, and both are a finished day.
 */
export function EveningClose() {
  const t = useTranslations("evening");
  const locale = useLocale() as Locale;
  const { dayNotes, resets } = useRepositories();

  const day = useMemo(() => localDay(), []);
  const [loaded, setLoaded] = useState(false);
  const [existing, setExisting] = useState<DayNote | null>(null);
  const [weather, setWeather] = useState<DayWeather | undefined>();
  const [hard, setHard] = useState("");
  const [kept, setKept] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [stage, setStage] = useState<Stage>("writing");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState<string>("plain");

  useEffect(() => {
    let cancelled = false;
    dayNotes
      .getByDay(day)
      .then((note) => {
        if (cancelled) return;
        if (note) {
          setExisting(note);
          setWeather(note.weather);
          setHard(note.hard ?? "");
          setKept(note.kept ?? "");
          setTomorrow(note.tomorrow ?? "");
        }
        setLoaded(true);
      })
      .catch(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [dayNotes, day]);

  const tooLong =
    countCharacters(hard) > journalLimits.hardMax ||
    countCharacters(kept) > journalLimits.keptMax ||
    countCharacters(tomorrow) > journalLimits.tomorrowMax;

  async function save() {
    setSaving(true);
    setError(null);
    const parsed = dayNoteSchema.safeParse({ weather, hard, kept, tomorrow });
    if (!parsed.success) {
      setError(t("errors.tooLong"));
      setSaving(false);
      return;
    }

    const now = new Date();
    const note: DayNote = {
      id: existing?.id ?? createId(),
      day,
      createdAt: existing?.createdAt ?? now.toISOString(),
      updatedAt: now.toISOString(),
      locale,
      weather: parsed.data.weather,
      hard: parsed.data.hard || undefined,
      kept: parsed.data.kept || undefined,
      tomorrow: parsed.data.tomorrow || undefined,
    };

    try {
      await dayNotes.save(note);
      const [allNotes, records] = await Promise.all([
        dayNotes.list().catch(() => [] as DayNote[]),
        resets.list().catch(() => []),
      ]);
      const closedInLastWeek = allNotes.filter((n) => daysBetween(n.day, day) < 7).length;
      const resetToday = records.some((record) => localDay(new Date(record.createdAt)) === day);
      setClosing(
        closingKey({
          weather: note.weather,
          hasHard: Boolean(note.hard),
          hasKept: Boolean(note.kept),
          resetToday,
          closedInLastWeek,
        }),
      );
      setExisting(note);
      setStage("closed");
      // The closing line is the whole point of saving: make sure it is what
      // they see, not the bottom of the form they were already scrolled to.
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(t("errors.save"));
    } finally {
      setSaving(false);
    }
  }

  if (stage === "closed") {
    return (
      <Narrow className="fade-in flex min-h-[60vh] flex-col justify-center gap-8 py-8 md:py-14">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{t("closed.eyebrow")}</p>
          <h1 className="font-display text-4xl md:text-5xl">{t(`closing.${closing}.title`)}</h1>
          <p className="text-lg leading-relaxed text-ink-soft">{t(`closing.${closing}.body`)}</p>
        </div>

        {tomorrow.trim() && (
          <div className="rounded-2xl border border-line bg-paper p-5 shadow-soft">
            <p className="text-sm text-ink-muted">{t("closed.tomorrowLabel")}</p>
            <p className="mt-1 text-lg">{tomorrow.trim()}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button variant="secondary" size="lg" onClick={() => setStage("writing")}>
            {t("closed.edit")}
          </Button>
          {kept.trim() && (
            <Link href="/kept" className={buttonClassName("secondary", "lg")}>
              {t("closed.kept")}
            </Link>
          )}
          <Link href="/" className={buttonClassName("ghost", "lg")}>
            {t("closed.home")}
          </Link>
        </div>
      </Narrow>
    );
  }

  return (
    <Narrow className="flex flex-col gap-8 py-8 md:py-14">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{t("eyebrow")}</p>
        <h1 className="font-display text-4xl md:text-5xl">{t("title")}</h1>
        <p className="text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t("weather.question")}</h2>
        <WeatherPicker value={weather} onChange={setWeather} />
      </section>

      <Field
        label={t("hard.label")}
        hint={t("hard.hint")}
        value={hard}
        onChange={setHard}
        max={journalLimits.hardMax}
        placeholder={t("hard.placeholder")}
        rows={3}
        disabled={!loaded}
      />

      <Field
        label={t("kept.label")}
        hint={t("kept.hint")}
        value={kept}
        onChange={setKept}
        max={journalLimits.keptMax}
        placeholder={t("kept.placeholder")}
        rows={3}
        disabled={!loaded}
        accent
      />

      <Field
        label={t("tomorrow.label")}
        hint={t("tomorrow.hint")}
        value={tomorrow}
        onChange={setTomorrow}
        max={journalLimits.tomorrowMax}
        placeholder={t("tomorrow.placeholder")}
        rows={2}
        disabled={!loaded}
      />

      {error && (
        <p role="alert" className="text-base font-semibold text-clay-deep">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button size="lg" onClick={save} disabled={saving || tooLong || !loaded}>
          {existing ? t("saveAgain") : t("save")}
        </Button>
        <p className="text-base text-ink-muted">{t("privacy")}</p>
      </div>
    </Narrow>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  max,
  placeholder,
  rows,
  disabled,
  accent,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
  placeholder: string;
  rows: number;
  disabled?: boolean;
  accent?: boolean;
}) {
  const used = countCharacters(value);
  const over = used > max;
  return (
    <section className="space-y-2">
      <label className="block">
        <span className="text-xl font-semibold">{label}</span>
        <span className="mt-1 block text-base text-ink-soft">{hint}</span>
        <Textarea
          className={accent ? "mt-3 border-moss/50" : "mt-3"}
          rows={rows}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          invalid={over}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {used > max * 0.8 && (
        <p className={over ? "text-sm font-semibold text-clay-deep" : "text-sm text-ink-muted"}>
          {used} / {max}
        </p>
      )}
    </section>
  );
}
