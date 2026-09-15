"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { countCharacters } from "@/features/reset/schema";
import { cn } from "@/lib/utils/cn";
import { createPost, type PostFormState } from "../actions";
import { communityCategories, communityLimits, type CommunityCategory } from "../schema";

export function PostForm({ defaultCategory }: { defaultCategory?: CommunityCategory }) {
  const t = useTranslations("community");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [state, action, pending] = useActionState<PostFormState, FormData>(createPost, { status: "idle" });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <form action={action} className="space-y-5 rounded-3xl border border-line bg-paper p-5 shadow-soft md:p-7">
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-1.5">
        <label htmlFor="category" className="block text-sm font-semibold text-ink-soft">
          {t("new.category")}
        </label>
        <select
          id="category"
          name="category"
          defaultValue={defaultCategory ?? "general"}
          className="tap focus-ring w-full cursor-pointer rounded-full border border-field bg-paper px-5 text-lg text-ink"
        >
          {communityCategories.map((c) => (
            <option key={c} value={c}>
              {t(`categories.${c}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="title" className="block text-sm font-semibold text-ink-soft">
          {t("new.title")}
        </label>
        <input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={communityLimits.titleMax + 20}
          placeholder={t("new.titlePlaceholder")}
          className={cn("tap focus-ring w-full rounded-full border bg-paper px-5 text-lg text-ink placeholder:text-ink-muted", countCharacters(title) > communityLimits.titleMax ? "border-clay" : "border-line")}
        />
        <p className="text-right text-sm text-ink-muted">{tc("characters", { count: countCharacters(title), max: communityLimits.titleMax })}</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="body" className="block text-sm font-semibold text-ink-soft">
          {t("new.body")}
        </label>
        <Textarea
          id="body"
          name="body"
          rows={7}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          placeholder={t("new.bodyPlaceholder")}
          invalid={countCharacters(body) > communityLimits.bodyMax}
        />
        <p className="text-right text-sm text-ink-muted">{tc("characters", { count: countCharacters(body), max: communityLimits.bodyMax })}</p>
      </div>

      <p className="text-sm text-ink-muted">{t("new.guidelines")}</p>

      {state.status === "error" && (
        <p role="alert" className="rounded-2xl border border-clay bg-clay-soft px-4 py-3 text-base">
          {t(`errors.${state.code}`)}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? t("new.posting") : t("new.submit")}
      </Button>
    </form>
  );
}
