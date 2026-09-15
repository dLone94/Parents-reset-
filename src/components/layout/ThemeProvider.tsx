"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { isThemeChoice, resolveTheme, THEME_STORAGE_KEY, type ResolvedTheme, type ThemeChoice } from "@/lib/theme";

interface ThemeState {
  choice: ThemeChoice;
  setChoice: (choice: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

/** Page background per palette, mirrored into the theme-color meta tag. */
const themeColor: Record<ResolvedTheme, string> = { light: "#faf6ef", dark: "#17130f" };

/** How often "auto" re-checks the clock, so the app dims during a long evening. */
const CLOCK_INTERVAL_MS = 5 * 60 * 1000;

/** Subscribers to the stored choice: other tabs, and this tab's own toggle. */
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readChoice(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeChoice(stored) ? stored : "auto";
  } catch {
    return "auto";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The stored choice is external state, so it is read through the store API
  // rather than copied into React state inside an effect.
  const choice = useSyncExternalStore<ThemeChoice>(
    subscribe,
    readChoice,
    () => "auto",
  );

  // Applying the palette is a side effect on the document, which is exactly
  // what an effect is for. Nothing here sets React state.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const next = resolveTheme(choice, { prefersDark: media.matches, hour: new Date().getHours() });
      document.documentElement.dataset.theme = next;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor[next]);
    };

    apply();
    media.addEventListener("change", apply);
    document.addEventListener("visibilitychange", apply);
    const timer = window.setInterval(apply, CLOCK_INTERVAL_MS);
    return () => {
      media.removeEventListener("change", apply);
      document.removeEventListener("visibilitychange", apply);
      window.clearInterval(timer);
    };
  }, [choice]);

  const setChoice = useCallback((next: ThemeChoice) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing: the choice cannot be remembered, so leave it be.
    }
    for (const listener of listeners) listener();
  }, []);

  const value = useMemo<ThemeState>(() => ({ choice, setChoice }), [choice, setChoice]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  return useContext(ThemeContext) ?? { choice: "auto", setChoice: () => {} };
}
