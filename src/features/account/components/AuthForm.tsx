"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { signIn, signUp, type AuthState } from "../actions";

const initial: AuthState = { status: "idle" };

export function AuthForm({ next }: { next?: string }) {
  const t = useTranslations("account.auth");
  const locale = useLocale();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [signInState, signInAction, signInPending] = useActionState(signIn, initial);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, initial);
  const state = mode === "signIn" ? signInState : signUpState;
  const pending = mode === "signIn" ? signInPending : signUpPending;

  if (state.status === "checkEmail") {
    return (
      <div className="rounded-3xl border border-moss/40 bg-moss-soft p-6">
        <h2 className="font-display text-2xl">{t("checkEmail.title")}</h2>
        <p className="mt-2 text-lg text-ink-soft">{t("checkEmail.body")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-line bg-paper p-5 shadow-soft md:p-8">
      <div role="tablist" aria-label={t("modeLabel")} className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-sand p-1">
        {(["signIn", "signUp"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "tap focus-ring rounded-full px-4 text-base font-semibold transition-colors",
              mode === m ? "bg-paper text-ink shadow-soft" : "text-ink-soft",
            )}
          >
            {t(`${m}.tab`)}
          </button>
        ))}
      </div>

      <form action={mode === "signIn" ? signInAction : signUpAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-semibold text-ink-soft">
            {t("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            inputMode="email"
            className="tap focus-ring w-full rounded-full border border-line bg-paper px-5 text-lg text-ink"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-semibold text-ink-soft">
            {t("password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            required
            minLength={8}
            className="tap focus-ring w-full rounded-full border border-line bg-paper px-5 text-lg text-ink"
          />
          {mode === "signUp" && <p className="text-sm text-ink-muted">{t("passwordHint")}</p>}
        </div>

        {state.status === "error" && (
          <p role="alert" className="rounded-2xl border border-clay bg-clay-soft px-4 py-3 text-base text-ink">
            {t(`errors.${state.code}`)}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth disabled={pending}>
          {pending ? t("working") : t(`${mode}.submit`)}
        </Button>
        <p className="text-center text-sm text-ink-muted">{t("privacy")}</p>
      </form>
    </div>
  );
}
