"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Narrow } from "@/components/ui/Container";
import { Textarea } from "@/components/ui/Textarea";
import { SafetyNotice } from "@/features/reset/components/SafetyNotice";
import { detectSafetyConcern } from "@/features/reset/safety";
import { Link } from "@/i18n/navigation";

type Stage = "writing" | "tearing" | "gone";

/** Length of the dissolve animation in globals.css. */
const TEAR_MS = 900;

/**
 * Write the thing you cannot say out loud, then tear it up.
 *
 * Nothing here is stored, sent, or counted. There is no repository, no server
 * action and no draft key on purpose: the promise on the screen is only worth
 * making if the code makes it true. The text lives in React state and dies
 * with the component.
 */
export function VentScreen() {
  const t = useTranslations("vent");
  const [text, setText] = useState("");
  const [stage, setStage] = useState<Stage>("writing");
  const [concern, setConcern] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function tearUp() {
    // The one thing the text is used for before it goes: if it suggests real
    // danger, the safety pathway stays on screen afterwards.
    setConcern(detectSafetyConcern(text));
    setStage("tearing");
    timer.current = window.setTimeout(() => {
      setText("");
      setStage("gone");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, TEAR_MS);
  }

  function again() {
    setStage("writing");
    setConcern(false);
  }

  if (stage === "gone") {
    return (
      <Narrow className="fade-in flex min-h-[60vh] flex-col justify-center gap-8 py-8 md:py-14">
        {concern && <SafetyNotice />}
        <div className="space-y-3">
          <h1 className="font-display text-4xl md:text-5xl">{t("gone.title")}</h1>
          <p className="text-lg leading-relaxed text-ink-soft">{t("gone.body")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button size="lg" variant="secondary" onClick={again}>
            {t("gone.again")}
          </Button>
          <Link href="/pause" className={buttonClassName("primary", "lg")}>
            {t("gone.pause")}
          </Link>
          <Link href="/" className={buttonClassName("ghost", "lg")}>
            {t("gone.home")}
          </Link>
        </div>
      </Narrow>
    );
  }

  return (
    <Narrow className="flex flex-col gap-6 py-8 md:py-14">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{t("eyebrow")}</p>
        <h1 className="font-display text-4xl md:text-5xl">{t("title")}</h1>
        <p className="text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
      </header>

      <Textarea
        rows={9}
        value={text}
        autoComplete="off"
        disabled={stage === "tearing"}
        placeholder={t("placeholder")}
        aria-label={t("label")}
        className={stage === "tearing" ? "dissolve" : undefined}
        onChange={(event) => setText(event.target.value)}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button size="lg" onClick={tearUp} disabled={!text.trim() || stage === "tearing"}>
          {t("tear")}
        </Button>
        <p className="text-base text-ink-muted">{t("promise")}</p>
      </div>
    </Narrow>
  );
}
