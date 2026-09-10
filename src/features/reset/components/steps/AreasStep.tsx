"use client";

import { useTranslations } from "next-intl";
import { OptionButton } from "@/components/ui/OptionButton";
import { loadAreas, type LoadArea } from "@/types/reset";
import { StepHeading } from "./StepHeading";

export function AreasStep({ value, onChange }: { value: LoadArea[]; onChange: (v: LoadArea[]) => void }) {
  const t = useTranslations("reset.questions.areas");

  function toggle(area: LoadArea) {
    onChange(value.includes(area) ? value.filter((a) => a !== area) : [...value, area]);
  }

  return (
    <section aria-labelledby="q-areas" className="space-y-6">
      <StepHeading id="q-areas" title={t("title")} help={t("help")} />
      <div className="flex flex-wrap gap-2.5">
        {loadAreas.map((area) => (
          <OptionButton key={area} appearance="chip" selected={value.includes(area)} onClick={() => toggle(area)}>
            {t(`options.${area}`)}
          </OptionButton>
        ))}
      </div>
    </section>
  );
}
