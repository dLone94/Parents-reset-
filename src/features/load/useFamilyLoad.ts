"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createId } from "@/lib/utils/id";
import { getLoadRepository, type LoadRepository } from "@/services/persistence";
import type { LoadCategory, LoadItem } from "@/types/load";
import { postponeUntil } from "./logic";

/**
 * Thin state layer over a LoadRepository. Every action writes through the
 * repository first and then updates local state, so the same hook works for
 * guests (localStorage) and, later, signed-in users (Supabase).
 */
export function useFamilyLoad(repository?: LoadRepository) {
  const repo = useMemo(() => repository ?? getLoadRepository(), [repository]);
  const [items, setItems] = useState<LoadItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    repo
      .list()
      .then((loaded) => {
        if (!cancelled) setItems(loaded);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const add = useCallback(
    async (category: LoadCategory, title: string) => {
      const now = new Date().toISOString();
      const item: LoadItem = { id: createId(), category, title, status: "open", createdAt: now, updatedAt: now };
      await repo.add(item);
      setItems((prev) => [item, ...(prev ?? [])]);
      return item;
    },
    [repo],
  );

  const patch = useCallback(
    async (id: string, changes: Partial<Omit<LoadItem, "id" | "createdAt" | "updatedAt">>) => {
      const updated = await repo.update(id, { ...changes, updatedAt: new Date().toISOString() });
      if (updated) setItems((prev) => (prev ?? []).map((i) => (i.id === id ? updated : i)));
      return updated;
    },
    [repo],
  );

  const complete = useCallback(
    (id: string) =>
      patch(id, { status: "done", completedAt: new Date().toISOString(), postponedUntil: undefined }),
    [patch],
  );

  const reopen = useCallback(
    (id: string) => patch(id, { status: "open", completedAt: undefined, postponedUntil: undefined }),
    [patch],
  );

  const postpone = useCallback(
    (id: string) => patch(id, { status: "postponed", postponedUntil: postponeUntil() }),
    [patch],
  );

  const move = useCallback((id: string, category: LoadCategory) => patch(id, { category }), [patch]);

  const remove = useCallback(
    async (id: string) => {
      await repo.remove(id);
      setItems((prev) => (prev ?? []).filter((i) => i.id !== id));
    },
    [repo],
  );

  const clearDone = useCallback(
    async (category?: LoadCategory) => {
      const done = (items ?? []).filter(
        (i) => i.status === "done" && (category === undefined || i.category === category),
      );
      await Promise.all(done.map((i) => repo.remove(i.id)));
      const ids = new Set(done.map((i) => i.id));
      setItems((prev) => (prev ?? []).filter((i) => !ids.has(i.id)));
    },
    [items, repo],
  );

  return { items, loading: items === null, add, complete, reopen, postpone, move, remove, clearDone };
}
