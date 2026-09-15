"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/feedback/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DayNoteRepository } from "./DayNoteRepository";
import { LocalDayNoteRepository } from "./LocalDayNoteRepository";
import { LocalLoadRepository } from "./LocalLoadRepository";
import { LocalResetRepository } from "./LocalResetRepository";
import type { LoadRepository } from "./LoadRepository";
import type { ResetRepository } from "./ResetRepository";
import { SupabaseDayNoteRepository } from "./SupabaseDayNoteRepository";
import { SupabaseLoadRepository } from "./SupabaseLoadRepository";
import { SupabaseResetRepository } from "./SupabaseResetRepository";
import { getDayNoteRepository, getLoadRepository, getResetRepository } from "./index";

export interface Repositories {
  resets: ResetRepository;
  load: LoadRepository;
  dayNotes: DayNoteRepository;
  /** Null for guests. */
  userId: string | null;
}

const PersistenceContext = createContext<Repositories | null>(null);

/**
 * Chooses where data lives. Guests keep everything on the device; signed-in
 * users read and write Supabase. On first sign-in on a device, whatever was
 * saved locally is merged into the account so nothing is lost.
 */
export function PersistenceProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  const { toast } = useToast();
  const t = useTranslations("account.sync");
  const migratedFor = useRef<string | null>(null);

  const value = useMemo<Repositories>(() => {
    if (userId) {
      const client = createSupabaseBrowserClient();
      if (client) {
        return {
          resets: new SupabaseResetRepository(client, userId),
          load: new SupabaseLoadRepository(client, userId),
          dayNotes: new SupabaseDayNoteRepository(client, userId),
          userId,
        };
      }
    }
    return {
      resets: getResetRepository(),
      load: getLoadRepository(),
      dayNotes: getDayNoteRepository(),
      userId: null,
    };
  }, [userId]);

  useEffect(() => {
    if (!value.userId || migratedFor.current === value.userId) return;
    migratedFor.current = value.userId;
    mergeLocalIntoAccount(value)
      .then((counts) => {
        if (counts.resets + counts.items + counts.notes > 0) {
          toast(t("merged", { resets: counts.resets, items: counts.items }), "success");
        }
      })
      .catch(() => {
        // Merging is best effort; local data stays on the device for a retry.
      });
  }, [value, toast, t]);

  return <PersistenceContext.Provider value={value}>{children}</PersistenceContext.Provider>;
}

export function useRepositories(): Repositories {
  const ctx = useContext(PersistenceContext);
  return (
    ctx ?? {
      resets: getResetRepository(),
      load: getLoadRepository(),
      dayNotes: getDayNoteRepository(),
      userId: null,
    }
  );
}

const MIGRATED_KEY = "parent-reset:migrated:v1";

async function mergeLocalIntoAccount(
  target: Repositories,
): Promise<{ resets: number; items: number; notes: number }> {
  const nothing = { resets: 0, items: 0, notes: 0 };
  if (typeof window === "undefined" || !target.userId) return nothing;
  let done: string[] = [];
  try {
    done = JSON.parse(window.localStorage.getItem(MIGRATED_KEY) ?? "[]") as string[];
  } catch {
    done = [];
  }
  if (done.includes(target.userId)) return nothing;

  const localResets = new LocalResetRepository();
  const localLoad = new LocalLoadRepository();
  const localNotes = new LocalDayNoteRepository();
  const resets = await localResets.list();
  const items = await localLoad.list();
  const notes = await localNotes.list();

  for (const record of resets) await target.resets.save(record);
  for (const item of items) await target.load.add(item);
  for (const note of notes) await target.dayNotes.save(note);

  try {
    window.localStorage.setItem(MIGRATED_KEY, JSON.stringify([...done, target.userId]));
  } catch {
    // ignore
  }
  return { resets: resets.length, items: items.length, notes: notes.length };
}
