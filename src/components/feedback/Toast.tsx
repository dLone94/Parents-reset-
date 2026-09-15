"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ToastItem {
  id: number;
  message: string;
  tone: "neutral" | "success";
}

interface ToastApi {
  toast: (message: string, tone?: ToastItem["tone"]) => void;
}

const ToastContext = createContext<ToastApi>({ toast: () => {} });

/** Small, calm confirmations at the bottom of the screen. No stacking noise. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, tone: ToastItem["tone"] = "neutral") => {
    const id = ++counter.current;
    setItems((prev) => [...prev.slice(-1), { id, message, tone }]);
    window.setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex flex-col items-center gap-2 px-4 md:bottom-6">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "fade-in pointer-events-auto max-w-md rounded-full border px-4 py-2.5 text-sm font-medium shadow-lift",
              item.tone === "success" ? "border-moss/40 bg-moss-soft text-moss" : "border-line bg-paper text-ink",
            )}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  return useContext(ToastContext);
}
