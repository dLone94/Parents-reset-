"use client";

import { useTranslations } from "next-intl";
import { OptionButton } from "@/components/ui/OptionButton";
import { StepHeading } from "./StepHeading";

export function MoneyStep({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  const t = useTranslations("reset.questions.money");
  return (
    <section aria-labelledby="q-money" className="space-y-6">
      <StepHeading id="q-money" title={t("title")} help={t("help")} />
      <div role="radiogroup" aria-labelledby="q-money" className="grid gap-3 sm:grid-cols-2">
        <OptionButton role="radio" aria-checked={value === true} selected={value === true} onClick={() => onChange(true)}>
          {t("yes")}
        </OptionButton>
        <OptionButton role="radio" aria-checked={value === false} selected={value === false} onClick={() => onChange(false)}>
          {t("no")}
        </OptionButton>
      </div>
    </section>
  );
}
