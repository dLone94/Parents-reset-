"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { LoadArea, TimeAvailable } from "@/types/reset";

export const RESET_DRAFT_KEY = "parent-reset:draft:v1";

export interface ResetDraft {
  step: number;
  overwhelm: number | null;
  areas: LoadArea[];
  time: TimeAvailable | null;
  moneyPressure: boolean | null;
  mustHappen: string;
  onMind: string;
}

export const emptyDraft: ResetDraft = {
  step: 0,
  overwhelm: null,
  areas: [],
  time: null,
  moneyPressure: null,
  mustHappen: "",
  onMind: "",
};

/*
 * A tiny external store backed by sessionStorage, so an interruption (a child,
 * a phone call, a tab switch) does not lose in-progress answers. Session-scoped
 * on purpose: personal text should not linger once the browser is closed.
 */
interface DraftState {
  draft: ResetDraft;
  restored: boolean;
}

let state: DraftState | null = null;
const listeners = new Set<() => void>();
const serverState: DraftState = { draft: emptyDraft, restored: false };

function readStorage(): DraftState {
  try {
    const raw = window.sessionStorage.getItem(RESET_DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ResetDraft>;
      const draft = { ...emptyDraft, ...parsed };
      return { draft, restored: draft.step > 0 || draft.mustHappen.length > 0 };
    }
  } catch {
    // ignore
  }
  return serverState;
}

function getSnapshot(): DraftState {
  if (!state) state = readStorage();
  return state;
}

function getServerSnapshot(): DraftState {
  return serverState;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(next: DraftState): void {
  state = next;
  try {
    if (next.draft === emptyDraft) window.sessionStorage.removeItem(RESET_DRAFT_KEY);
    else window.sessionStorage.setItem(RESET_DRAFT_KEY, JSON.stringify(next.draft));
  } catch {
    // ignore (private mode / storage full)
  }
  listeners.forEach((listener) => listener());
}

/** Test helper: forget the in-memory cache so the next read hits storage. */
export function __resetDraftStoreForTests(): void {
  state = null;
}

export function useResetDraft() {
  const { draft, restored } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback((patch: Partial<ResetDraft>) => {
    const current = getSnapshot();
    setState({ draft: { ...current.draft, ...patch }, restored: current.restored });
  }, []);

  const reset = useCallback(() => {
    setState({ draft: emptyDraft, restored: false });
  }, []);

  return { draft, update, reset, restored };
}
