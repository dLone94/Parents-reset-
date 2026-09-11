"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/feedback/Toast";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Narrow } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/intl/format";
import { cn } from "@/lib/utils/cn";
import { createId } from "@/lib/utils/id";
import { useRepositories } from "@/services/persistence/PersistenceProvider";
import type { PlanItem, ResetRecord } from "@/types/reset";
import { areaToLoadCategory } from "../loadBridge";
import { FocusMode } from "./FocusMode";
import { SafetyNotice } from "./SafetyNotice";

type State = { status: "loading" } | { status: "missing" } | { status: "ready"; record: ResetRecord };

export function ResultView({ id }: { id: string }) {
  const t = useTranslations("result");
  const tp = useTranslations("planner");
  const tc = useTranslations("common");
  const tl = useTranslations("load.categories");
  const locale = useLocale();
  const { toast } = useToast();
  const { resets, load } = useRepositories();
  const [state, setState] = useState<State>({ status: "loading" });
  const [focus, setFocus] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    resets
      .get(id)
      .then((record) => {
        if (cancelled) return;
        setState(record ? { status: "ready", record } : { status: "missing" });
      })
      .catch(() => !cancelled && setState({ status: "missing" }));
    return () => {
      cancelled = true;
    };
  }, [id, resets]);

  const plannerText = useCallback(
    (key: string) => tp(key as Parameters<typeof tp>[0]),
    [tp],
  );

  const toggleDone = useCallback(
    async (itemId: string) => {
      if (state.status !== "ready") return;
      const current = state.record.completedItemIds ?? [];
      const next = current.includes(itemId) ? current.filter((i) => i !== itemId) : [...current, itemId];
      const record = { ...state.record, completedItemIds: next };
      setState({ status: "ready", record });
      await resets.save(record);
    },
    [resets, state],
  );

  async function addToLoad(item: PlanItem) {
    const category = areaToLoadCategory(item.area);
    const title = item.source === "user" ? (item.text ?? "") : plannerText(item.messageKey ?? "");
    const now = new Date().toISOString();
    await load.add({ id: createId(), category, title, status: "open", createdAt: now, updatedAt: now });
    setAdded((prev) => new Set(prev).add(item.id));
    toast(t("addedToLoad", { area: tl(category) }), "success");
  }

  if (state.status === "loading") {
    return (
      <Narrow className="py-16">
        <p className="text-lg text-ink-soft" aria-live="polite">
          {tc("loading")}
        </p>
      </Narrow>
    );
  }

  if (state.status === "missing") {
    return (
      <Narrow className="flex flex-col items-start gap-4 py-16">
        <h1 className="font-display text-3xl">{t("notFound.title")}</h1>
        <p className="text-lg text-ink-soft">{t("notFound.body")}</p>
        <Link href="/reset" className={buttonClassName("primary", "lg")}>
          {t("notFound.cta")}
        </Link>
      </Narrow>
    );
  }

  const { record } = state;
  const { plan } = record;
  const completed = record.completedItemIds ?? [];
  const allDone = plan.today.length > 0 && plan.today.every((i) => completed.includes(i.id));
  const renderItem = (item: PlanItem) => (item.source === "user" ? item.text : plannerText(item.messageKey ?? ""));

  return (
    <Narrow className="flex flex-col gap-8 py-8 md:py-14">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{t("title")}</p>
        <p className="text-sm text-ink-muted">{t("dateLabel", { date: formatDate(record.createdAt, locale) })}</p>
        <h1 className="font-display text-3xl leading-tight md:text-4xl">{plannerText(plan.summaryKey)}</h1>
        <p className="text-lg text-ink-soft">{plannerText(plan.timeKey)}</p>
      </header>

      {record.safetyFlag && <SafetyNotice />}

      {/* Today: tickable, with focus mode */}
      <section aria-label={t("today.label")} className="rounded-2xl border border-clay/30 bg-paper p-5 shadow-soft md:p-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="inline-block rounded-full bg-clay-soft px-3 py-1 text-sm font-semibold text-clay-deep">
            {t("today.label")}
          </span>
          <p className="text-base text-ink-soft">{allDone ? t("today.allDone") : t("today.intro")}</p>
        </div>
        <ol className="mt-4 space-y-3">
          {plan.today.map((item, index) => {
            const done = completed.includes(item.id);
            return (
              <li key={item.id} className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleDone(item.id)}
                  aria-pressed={done}
                  aria-label={done ? t("today.undo") : t("today.markDone")}
                  className={cn(
                    "tap focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-base transition-colors",
                    done ? "border-moss bg-moss text-paper" : "border-clay bg-clay text-paper hover:bg-clay-deep",
                  )}
                  style={{ minHeight: "2rem" }}
                >
                  {done ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </button>
                <p className={cn("flex-1 text-lg leading-snug", done && "text-ink-muted line-through")}>{renderItem(item)}</p>
              </li>
            );
          })}
        </ol>
        {!allDone && plan.today.length > 0 && (
          <Button size="lg" className="mt-5 w-full sm:w-auto" onClick={() => setFocus(true)}>
            {t("today.focus")}
          </Button>
        )}
      </section>

      <Bucket
        tone="honey"
        label={t("thisWeek.label")}
        intro={t("thisWeek.intro")}
        items={plan.thisWeek}
        renderItem={renderItem}
        noteText={(key) => plannerText(key)}
        action={(item) =>
          added.has(item.id) ? (
            <span className="text-sm text-moss">{t("addedShort")}</span>
          ) : (
            <button
              type="button"
              onClick={() => addToLoad(item)}
              className="focus-ring rounded-full border border-line bg-paper px-3 py-1 text-sm font-semibold text-ink-soft hover:border-ink-muted hover:text-ink"
            >
              {t("addToLoad")}
            </button>
          )
        }
      />
      <Bucket tone="moss" label={t("letGo.label")} intro={t("letGo.intro")} items={plan.letGo} renderItem={renderItem} noteText={(key) => plannerText(key)} />

      <p className="text-base text-ink-muted">{t("savedLocally")}</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/reset" className={buttonClassName("primary", "lg")}>
          {t("newReset")}
        </Link>
        <Link href="/load" className={buttonClassName("secondary", "lg")}>
          {t("goToLoad")}
        </Link>
      </div>

      <p className="text-sm text-ink-muted">{t("disclaimer")}</p>

      {focus && (
        <FocusMode
          items={plan.today}
          completedIds={completed}
          onComplete={toggleDone}
          onClose={() => setFocus(false)}
          renderItem={renderItem}
        />
      )}
    </Narrow>
  );
}

const tones = {
  honey: { chip: "bg-honey-soft text-honey", dot: "bg-honey", border: "border-honey/30" },
  moss: { chip: "bg-moss-soft text-moss", dot: "bg-moss", border: "border-moss/30" },
} as const;

function Bucket({
  tone,
  label,
  intro,
  items,
  renderItem,
  noteText,
  action,
}: {
  tone: keyof typeof tones;
  label: string;
  intro: string;
  items: PlanItem[];
  renderItem: (item: PlanItem) => React.ReactNode;
  noteText: (key: string) => string;
  action?: (item: PlanItem) => React.ReactNode;
}) {
  const styles = tones[tone];
  return (
    <section aria-label={label} className={cn("rounded-2xl border bg-paper p-5 shadow-soft md:p-6", styles.border)}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={cn("inline-block rounded-full px-3 py-1 text-sm font-semibold", styles.chip)}>{label}</span>
        <p className="text-base text-ink-soft">{intro}</p>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3">
            <span aria-hidden className={cn("mt-2.5 h-2 w-2 shrink-0 rounded-full", styles.dot)} />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-lg leading-snug">{renderItem(item)}</p>
              {item.noteKey && <p className="text-sm text-ink-muted">{noteText(item.noteKey)}</p>}
              {action && <div>{action(item)}</div>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
