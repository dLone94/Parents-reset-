"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { loadLimits } from "@/types/load";
import { loadItemTitleSchema } from "../schema";

interface AddItemFormProps {
  categoryLabel: string;
  onAdd: (title: string) => Promise<unknown>;
}

export function AddItemForm({ categoryLabel, onAdd }: AddItemFormProps) {
  const t = useTranslations("load");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = loadItemTitleSchema.safeParse(value);
    if (!parsed.success) {
      const code = parsed.error.issues[0]?.message;
      setError(code === "tooLong" ? t("errors.tooLong", { max: loadLimits.titleMax }) : t("errors.required"));
      return;
    }
    setBusy(true);
    try {
      await onAdd(parsed.data);
      setValue("");
      setError(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="load-add" className="block text-sm font-semibold text-ink-soft">
        {t("add.label", { category: categoryLabel })}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="load-add"
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          placeholder={t("add.placeholder")}
          aria-invalid={error !== null}
          aria-describedby={error ? "load-add-error" : "load-add-hint"}
          autoComplete="off"
          enterKeyHint="done"
          className={cn(
            "tap focus-ring w-full flex-1 rounded-full border bg-paper px-5 text-lg text-ink placeholder:text-ink-muted",
            error ? "border-clay" : "border-line",
          )}
        />
        <Button type="submit" size="md" disabled={busy} className="sm:shrink-0">
          {t("add.button")}
        </Button>
      </div>
      {error ? (
        <p id="load-add-error" role="alert" className="text-sm text-clay-deep">
          {error}
        </p>
      ) : (
        <p id="load-add-hint" className="text-sm text-ink-muted">
          {t("add.hint")}
        </p>
      )}
    </form>
  );
}
