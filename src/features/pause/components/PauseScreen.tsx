"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Narrow } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { localDay } from "@/lib/utils/day";
import {
  breathPatternIds,
  breathPatterns,
  patternDuration,
  positionAt,
  ringScale,
  type BreathPatternId,
} from "../patterns";
import { pausesOnDay, recordPause } from "../log";

type Stage = "choose" | "running" | "done";

/** How often the ring and counter re-read the clock. */
const TICK_MS = 100;

/**
 * One minute of breathing, and nothing else on the screen.
 *
 * The run is driven by wall-clock time rather than chained timeouts, so a
 * phone that throttles a backgrounded tab does not leave the ring out of step
 * with the count.
 */
export function PauseScreen({ initialPattern }: { initialPattern?: BreathPatternId }) {
  const t = useTranslations("pause");
  const [stage, setStage] = useState<Stage>("choose");
  const [patternId, setPatternId] = useState<BreathPatternId>(initialPattern ?? "settle");
  const [elapsed, setElapsed] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const startedAt = useRef<number>(0);

  const pattern = breathPatterns[patternId];
  const total = patternDuration(pattern);
  const position = useMemo(() => positionAt(pattern, elapsed), [pattern, elapsed]);

  const start = useCallback((id: BreathPatternId) => {
    setPatternId(id);
    setElapsed(0);
    startedAt.current = Date.now();
    setStage("running");
  }, []);

  useEffect(() => {
    if (stage !== "running") return;
    const timer = window.setInterval(() => {
      const seconds = (Date.now() - startedAt.current) / 1000;
      setElapsed(seconds);
      if (seconds >= total) {
        window.clearInterval(timer);
        const entries = recordPause();
        setTodayCount(pausesOnDay(entries, localDay()));
        setStage("done");
      }
    }, TICK_MS);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setStage("choose");
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [stage, total]);

  if (stage === "choose") {
    return (
      <Narrow className="fade-in flex flex-col gap-8 py-8 md:py-14">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{t("eyebrow")}</p>
          <h1 className="font-display text-4xl md:text-5xl">{t("title")}</h1>
          <p className="text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
        </header>

        <ul className="grid gap-4">
          {breathPatternIds.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => start(id)}
                className="tap focus-ring w-full rounded-2xl border border-line bg-paper p-5 text-left shadow-soft transition-colors hover:border-clay"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-xl font-semibold">{t(`patterns.${id}.name`)}</span>
                  <span className="shrink-0 text-sm font-semibold text-ink-muted">
                    {t("seconds", { count: patternDuration(breathPatterns[id]) })}
                  </span>
                </span>
                <span className="mt-1.5 block text-base leading-relaxed text-ink-soft">
                  {t(`patterns.${id}.body`)}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <p className="text-base text-ink-muted">{t("note")}</p>
      </Narrow>
    );
  }

  if (stage === "running") {
    const scale = ringScale(position.phase.kind);
    // Full screen on purpose: during the minute there is nothing else to look
    // at, no header, no tab bar, nothing to tap by accident.
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-cream px-5 py-8"
      >
        <div className="relative flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
          <div
            aria-hidden
            className="breath-ring absolute inset-0 rounded-full bg-clay-soft"
            style={{ "--breath-scale": scale, "--breath-duration": `${position.phase.seconds}s` } as React.CSSProperties}
          />
          <div
            aria-hidden
            className="breath-ring absolute inset-6 rounded-full border-2 border-clay/40"
            style={{ "--breath-scale": scale, "--breath-duration": `${position.phase.seconds}s` } as React.CSSProperties}
          />
          <div className="relative text-center">
            <p aria-live="polite" className="font-display text-3xl sm:text-4xl">
              {t(`phase.${position.phase.kind}`)}
            </p>
            <p className="mt-2 text-5xl font-semibold tabular-nums text-clay-deep sm:text-6xl">
              {position.secondsLeft}
            </p>
          </div>
        </div>

        <div className="w-full max-w-xs space-y-3 text-center">
          <p className="text-base text-ink-soft">
            {t("cycleOf", { current: position.cycle, total: pattern.cycles })}
          </p>
          <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-clay transition-[width] duration-200 ease-linear"
              style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }}
            />
          </div>
          <Button variant="ghost" onClick={() => setStage("choose")}>
            {t("stop")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Narrow className="fade-in flex min-h-[60vh] flex-col justify-center gap-8 py-8 md:py-14">
      <div className="space-y-3">
        <h1 className="font-display text-4xl md:text-5xl">{t("done.title")}</h1>
        <p className="text-lg leading-relaxed text-ink-soft">{t("done.body")}</p>
        {todayCount > 1 && <p className="text-base text-ink-muted">{t("done.countToday", { count: todayCount })}</p>}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button size="lg" onClick={() => start(patternId)}>
          {t("done.again")}
        </Button>
        <Link href="/reset" className={buttonClassName("secondary", "lg")}>
          {t("done.reset")}
        </Link>
        <Link href="/" className={cn(buttonClassName("ghost", "lg"))}>
          {t("done.home")}
        </Link>
      </div>
    </Narrow>
  );
}
