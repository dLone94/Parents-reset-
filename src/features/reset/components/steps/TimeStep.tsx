"use client";

import { useTranslations } from "next-intl";
import { OptionButton } from "@/components/ui/OptionButton";
import { timeOptions, type TimeAvailable } from "@/types/reset";
import { StepHeading } from "./StepHeading";

export function TimeStep({ value, onChange }: { value: TimeAvailable | null; onChange: (v: TimeAvailable) => void }) {
  const t = useTranslations("reset.questions.time");
  return (
    <section aria-labelledby="q-time" className="space-y-6">
      <StepHeading id="q-time" title={t("title")} help={t("help")} />
      <div role="radiogroup" aria-labelledby="q-time" className="flex flex-col gap-3">
        {timeOptions.map((option) => (
          <OptionButton key={option} role="radio" aria-checked={value === option} selected={value === option} onClick={() => onChange(option)}>
            {t(`options.${option}`)}
          </OptionButton>
        ))}
      </div>
    </section>
  );
}
