"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Container } from "@/components/ui/Container";
import type { LoadRepository } from "@/services/persistence";
import { loadCategories, type LoadCategory, type LoadItem } from "@/types/load";
import { effectiveStatus, scoresByCategory, sortForDisplay } from "../logic";
import { useFamilyLoad } from "../useFamilyLoad";
import { AddItemForm } from "./AddItemForm";
import { CategoryCard } from "./CategoryCard";
import { LoadItemRow } from "./LoadItemRow";

export function FamilyLoad({ repository }: { repository?: LoadRepository }) {
  const t = useTranslations("load");
  const tc = useTranslations("common");
  const { items, loading, add, complete, reopen, postpone, move, remove, clearDone } = useFamilyLoad(repository);
  const [selected, setSelected] = useState<LoadCategory>("kids");
  const panelRef = useRef<HTMLDivElement>(null);

  const all = items ?? [];
  const now = new Date();
  const scores = scoresByCategory(all, now);
  const totalOpen = loadCategories.reduce((sum, c) => sum + scores[c].open, 0);

  const inCategory = sortForDisplay(all.filter((i) => i.category === selected), now);
  const grouped = {
    open: inCategory.filter((i) => effectiveStatus(i, now) === "open"),
    postponed: inCategory.filter((i) => effectiveStatus(i, now) === "postponed"),
    done: inCategory.filter((i) => effectiveStatus(i, now) === "done"),
  };

  function select(category: LoadCategory) {
    setSelected(category);
    // On phones the panel sits below the grid: bring it into view.
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  const categoryLabel = t(`categories.${selected}`);

  return (
    <Container className="flex flex-col gap-8 py-8 md:py-14">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{t("title")}</p>
        <h1 className="font-display text-3xl leading-tight md:text-5xl">{t("subtitle")}</h1>
        <p className="text-lg text-ink-soft" aria-live="polite">
          {loading ? tc("loading") : t("summary", { count: totalOpen })}
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-start md:gap-8">
        {/* Category overview */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1 lg:grid-cols-2" role="group" aria-label={t("selectCategory")}>
          {loadCategories.map((category) => (
            <CategoryCard
              key={category}
              label={t(`categories.${category}`)}
              openLabel={t("openCount", { count: scores[category].open })}
              levelLabel={t(`levels.${scores[category].level}`)}
              level={scores[category].level}
              score={scores[category].score}
              selected={selected === category}
              onSelect={() => select(category)}
            />
          ))}
        </div>

        {/* Selected category */}
        <section
          ref={panelRef}
          aria-labelledby="load-panel-title"
          className="scroll-mt-20 flex flex-col gap-5 rounded-3xl border border-line bg-sand/50 p-4 md:p-6"
        >
          <h2 id="load-panel-title" className="font-display text-2xl md:text-3xl">
            {categoryLabel}
          </h2>

          <AddItemForm categoryLabel={categoryLabel} onAdd={(title) => add(selected, title)} />

          {!loading && inCategory.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-paper/60 p-5">
              <p className="font-semibold">{t("empty.title")}</p>
              <p className="mt-1 text-base text-ink-soft">
                {t("empty.body", { examples: t(`examples.${selected}`) })}
              </p>
            </div>
          )}

          <ItemGroup title={t("sections.open")} items={grouped.open} hidden={grouped.open.length === 0}>
            {(item) => rowFor(item, "open")}
          </ItemGroup>
          <ItemGroup title={t("sections.postponed")} items={grouped.postponed} hidden={grouped.postponed.length === 0}>
            {(item) => rowFor(item, "postponed")}
          </ItemGroup>
          <ItemGroup
            title={t("sections.done")}
            items={grouped.done}
            hidden={grouped.done.length === 0}
            action={
              <button
                type="button"
                onClick={() => clearDone(selected)}
                className="focus-ring rounded-full text-sm font-semibold text-ink-soft underline-offset-4 hover:underline"
              >
                {t("actions.clearDone")}
              </button>
            }
          >
            {(item) => rowFor(item, "done")}
          </ItemGroup>

          <div className="space-y-1 text-sm text-ink-muted">
            <p>{t("notProjectTool")}</p>
            <p>{t("savedLocally")}</p>
          </div>
        </section>
      </div>
    </Container>
  );

  function rowFor(item: LoadItem, status: "open" | "postponed" | "done") {
    return (
      <LoadItemRow
        key={item.id}
        item={item}
        status={status}
        onComplete={() => complete(item.id)}
        onReopen={() => reopen(item.id)}
        onPostpone={() => postpone(item.id)}
        onMove={(category) => move(item.id, category)}
        onRemove={() => remove(item.id)}
      />
    );
  }
}

function ItemGroup({
  title,
  items,
  hidden,
  action,
  children,
}: {
  title: string;
  items: LoadItem[];
  hidden: boolean;
  action?: React.ReactNode;
  children: (item: LoadItem) => React.ReactNode;
}) {
  if (hidden) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-soft">
          {title} · {items.length}
        </h3>
        {action}
      </div>
      <ul className="space-y-2">{items.map(children)}</ul>
    </div>
  );
}
