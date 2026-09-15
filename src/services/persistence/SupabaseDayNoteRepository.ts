import type { SupabaseClient } from "@supabase/supabase-js";
import type { DayNote, DayWeather } from "@/types/journal";
import type { Locale } from "@/i18n/locales";
import type { DayNoteRepository } from "./DayNoteRepository";

/**
 * Evening closes for signed-in users. Mirrors `day_notes` in migration 0004.
 * Row Level Security keeps a user to their own rows; the unique index on
 * (user_id, day) is what makes "one close per day" true on the server too.
 */
export class SupabaseDayNoteRepository implements DayNoteRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async list(): Promise<DayNote[]> {
    const { data, error } = await this.client
      .from("day_notes")
      .select("*")
      .order("day", { ascending: false });
    if (error) throw error;
    return (data as DayNoteRow[]).map(rowToNote);
  }

  async getByDay(day: string): Promise<DayNote | null> {
    const { data, error } = await this.client
      .from("day_notes")
      .select("*")
      .eq("day", day)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToNote(data as DayNoteRow) : null;
  }

  async save(note: DayNote): Promise<void> {
    const { error } = await this.client.from("day_notes").upsert(
      {
        id: note.id,
        user_id: this.userId,
        day: note.day,
        created_at: note.createdAt,
        updated_at: note.updatedAt,
        locale: note.locale,
        weather: note.weather ?? null,
        hard: note.hard ?? null,
        kept: note.kept ?? null,
        tomorrow: note.tomorrow ?? null,
      },
      { onConflict: "user_id,day" },
    );
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from("day_notes").delete().eq("id", id);
    if (error) throw error;
  }

  async clear(): Promise<void> {
    const { error } = await this.client.from("day_notes").delete().eq("user_id", this.userId);
    if (error) throw error;
  }
}

interface DayNoteRow {
  id: string;
  day: string;
  created_at: string;
  updated_at: string;
  locale: Locale;
  weather: DayWeather | null;
  hard: string | null;
  kept: string | null;
  tomorrow: string | null;
}

function rowToNote(row: DayNoteRow): DayNote {
  return {
    id: row.id,
    day: row.day,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    locale: row.locale,
    weather: row.weather ?? undefined,
    hard: row.hard ?? undefined,
    kept: row.kept ?? undefined,
    tomorrow: row.tomorrow ?? undefined,
  };
}
