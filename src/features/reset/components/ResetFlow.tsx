"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Narrow } from "@/components/ui/Container";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/locales";
import { createId } from "@/lib/utils/id";
import { getResetRepository } from "@/services/persistence";
import { limits } from "@/types/reset";
import { submitReset } from "../actions";
import { countCharacters } from "../schema";
import { useResetDraft } from "../useResetDraft";
import { AreasStep } from "./steps/AreasStep";
import { MoneyStep } from "./steps/MoneyStep";
import { OverwhelmStep } from "./steps/OverwhelmStep";
import { TextStep } from "./steps/TextStep";
import { TimeStep } from "./steps/TimeStep";

const TOTAL_STEPS = 6;

export function ResetFlow() {
  const t = useTranslations("reset");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { draft, update, reset, restored } = useResetDraft();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const step = Math.min(Math.max(draft.step, 0), TOTAL_STEPS - 1);

  const canContinue = (() => {
    switch (step) {
      case 0:
        return draft.overwhelm !== null;
      case 1:
        return draft.areas.length > 0;
      case 2:
        return draft.time !== null;
      case 3:
        return draft.moneyPressure !== null;
      case 4:
        return (
          countCharacters(draft.mustHappen.trim()) > 0 &&
          countCharacters(draft.mustHappen) <= limits.mustHappenMax
        );
      case 5:
        return countCharacters(draft.onMind) <= limits.onMindMax;
      default:
        return false;
    }
  })();

  function next() {
    setError(null);
    if (step < TOTAL_STEPS - 1) update({ step: step + 1 });
  }

  function back() {
    setError(null);
    if (step > 0) update({ step: step - 1 });
  }

  function submit() {
    setError(null);
    const payload = {
      overwhelm: draft.overwhelm,
      areas: draft.areas,
      time: draft.time,
      moneyPressure: draft.moneyPressure,
      mustHappen: draft.mustHappen,
      onMind: draft.onMind || undefined,
    };
    startTransition(async () => {
      try {
        const result = await submitReset(payload);
        if (!result.ok) {
          if (result.error === "rateLimited") setError(t("errors.rateLimited"));
          else if (result.fields?.mustHappen === "tooLong")
            setError(t("errors.tooLong", { max: limits.mustHappenMax }));
          else if (result.fields?.mustHappen === "required") setError(t("errors.required"));
          else if (result.fields?.areas) setError(t("errors.areasRequired"));
          else setError(t("errors.generic"));
          return;
        }
        const id = createId();
        await getResetRepository().save({
          id,
          createdAt: new Date().toISOString(),
          locale,
          answers: result.answers,
          plan: result.plan,
          safetyFlag: result.safetyFlag,
        });
        reset();
        router.push(`/reset/${id}`);
      } catch {
        setError(t("errors.generic"));
      }
    });
  }

  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div className="flex flex-1 flex-col">
      <Narrow className="flex flex-1 flex-col gap-8 pb-36 pt-8 md:pt-14">
        <header className="space-y-3">
          <div className="flex items-center justify-between text-sm text-ink-soft">
            <span className="font-semibold text-ink">{t("title")}</span>
            <span aria-live="polite">{t("progress", { current: step + 1, total: TOTAL_STEPS })}</span>
          </div>
          <ProgressBar value={step + 1} max={TOTAL_STEPS} label={t("progress", { current: step + 1, total: TOTAL_STEPS })} />
        </header>

        {restored && step > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sand px-4 py-3 text-base text-ink-soft">
            <span>{t("resumeDraft")}</span>
            <button type="button" onClick={reset} className="focus-ring rounded-full font-semibold text-clay-deep underline-offset-4 hover:underline">
              {t("startOver")}
            </button>
          </div>
        )}

        <div key={step} className="fade-in flex flex-col gap-6">
          {step === 0 && (
            <OverwhelmStep value={draft.overwhelm} onChange={(overwhelm) => update({ overwhelm })} />
          )}
          {step === 1 && <AreasStep value={draft.areas} onChange={(areas) => update({ areas })} />}
          {step === 2 && <TimeStep value={draft.time} onChange={(time) => update({ time })} />}
          {step === 3 && (
            <MoneyStep value={draft.moneyPressure} onChange={(moneyPressure) => update({ moneyPressure })} />
          )}
          {step === 4 && (
            <TextStep
              id="must-happen"
              title={t("questions.must.title")}
              help={t("questions.must.help")}
              placeholder={t("questions.must.placeholder")}
              value={draft.mustHappen}
              max={limits.mustHappenMax}
              required
              onChange={(mustHappen) => update({ mustHappen })}
            />
          )}
          {step === 5 && (
            <TextStep
              id="on-mind"
              title={t("questions.onMind.title")}
              help={t("questions.onMind.help")}
              placeholder={t("questions.onMind.placeholder")}
              value={draft.onMind}
              max={limits.onMindMax}
              optionalLabel={tc("optional")}
              onChange={(onMind) => update({ onMind })}
            />
          )}
          {step === 0 && <p className="text-base text-ink-muted">{t("hint.oneHand")}</p>}
        </div>

        {error && (
          <p role="alert" className="rounded-2xl border border-clay bg-clay-soft px-4 py-3 text-base text-ink">
            {error}
          </p>
        )}
      </Narrow>

      {/* Sticky, thumb-reachable action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-cream/95 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 backdrop-blur">
        <Narrow className="flex items-center gap-3">
          <Button variant="ghost" size="lg" onClick={back} disabled={step === 0 || isPending} className="shrink-0">
            {tc("back")}
          </Button>
          {isLast ? (
            <Button size="lg" fullWidth onClick={submit} disabled={!canContinue || isPending}>
              {isPending ? t("submitting") : t("submit")}
            </Button>
          ) : (
            <Button size="lg" fullWidth onClick={next} disabled={!canContinue}>
              {tc("continue")}
            </Button>
          )}
        </Narrow>
      </div>
    </div>
  );
}
