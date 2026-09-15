import { journalLimits, type DayNote } from "@/types/journal";
import type { DayNoteRepository } from "./DayNoteRepository";

export const LOCAL_DAY_NOTES_KEY = "parent-reset:day-notes:v1";

interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Evening closes on the device. Newest first, capped like the other local
 * stores so a guest browser never accumulates unbounded personal writing.
 */
export class LocalDayNoteRepository implements DayNoteRepository {
  constructor(private readonly storage: KeyValueStorage | null = defaultStorage()) {}

  private read(): DayNote[] {
    if (!this.storage) return [];
    try {
      const raw = this.storage.getItem(LOCAL_DAY_NOTES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as DayNote[]) : [];
    } catch {
      return [];
    }
  }

  private write(notes: DayNote[]): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(LOCAL_DAY_NOTES_KEY, JSON.stringify(notes));
    } catch {
      // Storage full or blocked: the note still shows for this visit.
    }
  }

  async list(): Promise<DayNote[]> {
    return [...this.read()].sort((a, b) => b.day.localeCompare(a.day));
  }

  async getByDay(day: string): Promise<DayNote | null> {
    return this.read().find((note) => note.day === day) ?? null;
  }

  async save(note: DayNote): Promise<void> {
    // One note per day: closing the same evening twice edits it rather than
    // stacking duplicates.
    const others = this.read().filter((n) => n.id !== note.id && n.day !== note.day);
    const next = [note, ...others]
      .sort((a, b) => b.day.localeCompare(a.day))
      .slice(0, journalLimits.maxNotes);
    this.write(next);
  }

  async remove(id: string): Promise<void> {
    this.write(this.read().filter((note) => note.id !== id));
  }

  async clear(): Promise<void> {
    this.storage?.removeItem(LOCAL_DAY_NOTES_KEY);
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
