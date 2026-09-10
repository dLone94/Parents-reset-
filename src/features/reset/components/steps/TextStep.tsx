"use client";

import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils/cn";
import { countCharacters } from "../../schema";
import { StepHeading } from "./StepHeading";

interface TextStepProps {
  id: string;
  title: string;
  help: string;
  placeholder: string;
  value: string;
  max: number;
  required?: boolean;
  optionalLabel?: string;
  onChange: (value: string) => void;
}

export function TextStep({ id, title, help, placeholder, value, max, required, optionalLabel, onChange }: TextStepProps) {
  const t = useTranslations("common");
  const count = countCharacters(value);
  const tooLong = count > max;

  return (
    <section aria-labelledby={`${id}-label`} className="space-y-5">
      <StepHeading id={`${id}-label`} title={title} help={help} badge={optionalLabel} />
      <Textarea
        id={id}
        aria-labelledby={`${id}-label`}
        aria-required={required}
        aria-invalid={tooLong}
        rows={5}
        autoFocus
        placeholder={placeholder}
        value={value}
        invalid={tooLong}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className={cn("text-right text-sm", tooLong ? "text-clay-deep" : "text-ink-muted")} aria-live="polite">
        {t("characters", { count, max })}
      </p>
    </section>
  );
}
