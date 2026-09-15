"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { StepHeading } from "./StepHeading";
import { RadioGroup } from "@/components/ui/RadioGroup";

const SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function OverwhelmStep({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const t = useTranslations("reset.questions.overwhelmed");
  return (
    <section aria-labelledby="q-overwhelm" className="space-y-6">
      <StepHeading id="q-overwhelm" title={t("title")} help={t("help")} />
      <RadioGroup labelledBy="q-overwhelm" className="grid grid-cols-5 gap-2.5">
        {SCALE.map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(n)}
              className={cn(
                "tap focus-ring aspect-square rounded-2xl border text-xl font-semibold transition-colors",
                selected
                  ? "border-clay bg-clay text-paper shadow-soft"
                  : "border-field bg-paper text-ink hover:border-ink-muted",
              )}
            >
              {n}
            </button>
          );
        })}
      </RadioGroup>
      <div className="flex justify-between text-sm text-ink-muted">
        <span>{t("low")}</span>
        <span>{t("high")}</span>
      </div>
      {value !== null && (
        <p className="text-base text-ink-soft" aria-live="polite">
          {t("selected", { value })}
        </p>
      )}
    </section>
  );
}
