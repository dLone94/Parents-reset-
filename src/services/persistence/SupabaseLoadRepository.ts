import type { SupabaseClient } from "@supabase/supabase-js";
import type { LoadItem } from "@/types/load";
import type { LoadRepository } from "./LoadRepository";

/**
 * Supabase-backed Family Load repository for signed-in users (wired up with
 * accounts in a later milestone). Mirrors supabase/migrations/0002_load_items.sql.
 * Row Level Security restricts every query to the user's own rows.
 */
export class SupabaseLoadRepository implements LoadRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async list(): Promise<LoadItem[]> {
    const { data, error } = await this.client
      .from("load_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as LoadRow[]).map(rowToItem);
  }

  async add(item: LoadItem): Promise<void> {
    const { error } = await this.client.from("load_items").insert(itemToRow(item, this.userId));
    if (error) throw error;
  }

  async update(id: string, patch: Partial<Omit<LoadItem, "id" | "createdAt">>): Promise<LoadItem | null> {
    const row: Partial<LoadRow> = {};
    if (patch.category !== undefined) row.category = patch.category;
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.updatedAt !== undefined) row.updated_at = patch.updatedAt;
    if ("completedAt" in patch) row.completed_at = patch.completedAt ?? null;
    if ("postponedUntil" in patch) row.postponed_until = patch.postponedUntil ?? null;
    const { data, error } = await this.client
      .from("load_items")
      .update(row)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? rowToItem(data as LoadRow) : null;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from("load_items").delete().eq("id", id);
    if (error) throw error;
  }

  async clear(): Promise<void> {
    const { error } = await this.client.from("load_items").delete().eq("user_id", this.userId);
    if (error) throw error;
  }
}

interface LoadRow {
  id: string;
  user_id: string;
  category: LoadItem["category"];
  title: string;
  status: LoadItem["status"];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  postponed_until: string | null;
}

function rowToItem(row: LoadRow): LoadItem {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
    postponedUntil: row.postponed_until ?? undefined,
  };
}

function itemToRow(item: LoadItem, userId: string): LoadRow {
  return {
    id: item.id,
    user_id: userId,
    category: item.category,
    title: item.title,
    status: item.status,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    completed_at: item.completedAt ?? null,
    postponed_until: item.postponedUntil ?? null,
  };
}
