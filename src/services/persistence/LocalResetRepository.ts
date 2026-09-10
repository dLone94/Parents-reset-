import type { ResetRecord } from "@/types/reset";
import type { ResetRepository } from "./ResetRepository";

export const LOCAL_RESETS_KEY = "parent-reset:resets:v1";
const MAX_LOCAL_RESETS = 20;

interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Stores resets in localStorage. Newest first, capped so a guest browser never
 * accumulates unbounded personal data.
 */
export class LocalResetRepository implements ResetRepository {
  constructor(private readonly storage: KeyValueStorage | null = defaultStorage()) {}

  private read(): ResetRecord[] {
    if (!this.storage) return [];
    try {
      const raw = this.storage.getItem(LOCAL_RESETS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as ResetRecord[]) : [];
    } catch {
      return [];
    }
  }

  private write(records: ResetRecord[]): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(LOCAL_RESETS_KEY, JSON.stringify(records));
    } catch {
      // Storage may be full or blocked (private mode). Fail silently: the
      // result is still shown from memory in the current session.
    }
  }

  async save(record: ResetRecord): Promise<void> {
    const others = this.read().filter((r) => r.id !== record.id);
    this.write([record, ...others].slice(0, MAX_LOCAL_RESETS));
  }

  async get(id: string): Promise<ResetRecord | null> {
    return this.read().find((r) => r.id === id) ?? null;
  }

  async list(): Promise<ResetRecord[]> {
    return this.read();
  }

  async remove(id: string): Promise<void> {
    this.write(this.read().filter((r) => r.id !== id));
  }

  async clear(): Promise<void> {
    this.storage?.removeItem(LOCAL_RESETS_KEY);
  }
}

function defaultStorage(): KeyValueStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
