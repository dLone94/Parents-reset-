import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanItem, ResetRecord } from "@/types/reset";
import type { ResetRepository } from "./ResetRepository";

/**
 * Supabase-backed repository for signed-in users. Mirrors the SQL schema in
 * supabase/migrations. Row Level Security guarantees a user only ever reads
 * or writes their own rows, so no user_id filtering is needed client-side
 * beyond providing it on insert.
 *
 * Wired up in Milestone 2 (accounts). Included now so the persistence
 * boundary is real, not a placeholder.
 */
export class SupabaseResetRepository implements ResetRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async save(record: ResetRecord): Promise<void> {
    const { error } = await this.client.from("resets").upsert({
      id: record.id,
      user_id: this.userId,
      created_at: record.createdAt,
      locale: record.locale,
      overwhelm: record.answers.overwhelm,
      areas: record.answers.areas,
      time_available: record.answers.time,
      money_pressure: record.answers.moneyPressure,
      must_happen: record.answers.mustHappen,
      on_mind: record.answers.onMind ?? null,
      summary_key: record.plan.summaryKey,
      time_key: record.plan.timeKey,
      safety_flag: record.safetyFlag,
      completed_item_ids: record.completedItemIds ?? [],
    });
    if (error) throw error;

    const items = [...record.plan.today, ...record.plan.thisWeek, ...record.plan.letGo];
    await this.client.from("reset_items").delete().eq("reset_id", record.id);
    const { error: itemsError } = await this.client.from("reset_items").insert(
      items.map((item, position) => ({
        id: `${record.id}:${item.id}`,
        reset_id: record.id,
        user_id: this.userId,
        bucket: item.bucket,
        position,
        source: item.source,
        text: item.text ?? null,
        message_key: item.messageKey ?? null,
        area: item.area ?? null,
        note_key: item.noteKey ?? null,
      })),
    );
    if (itemsError) throw itemsError;
  }

  async get(id: string): Promise<ResetRecord | null> {
    const { data, error } = await this.client
      .from("resets")
      .select("*, reset_items(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToRecord(data as ResetRow) : null;
  }

  async list(): Promise<ResetRecord[]> {
    const { data, error } = await this.client
      .from("resets")
      .select("*, reset_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as ResetRow[]).map(rowToRecord);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from("resets").delete().eq("id", id);
    if (error) throw error;
  }

  async clear(): Promise<void> {
    const { error } = await this.client.from("resets").delete().eq("user_id", this.userId);
    if (error) throw error;
  }
}

interface ResetItemRow {
  id: string;
  bucket: PlanItem["bucket"];
  position: number;
  source: PlanItem["source"];
  text: string | null;
  message_key: string | null;
  area: PlanItem["area"] | null;
  note_key: string | null;
}

interface ResetRow {
  id: string;
  created_at: string;
  locale: ResetRecord["locale"];
  overwhelm: number;
  areas: ResetRecord["answers"]["areas"];
  time_available: ResetRecord["answers"]["time"];
  money_pressure: boolean;
  must_happen: string;
  on_mind: string | null;
  summary_key: string;
  time_key: string;
  safety_flag: boolean;
  completed_item_ids: string[] | null;
  reset_items: ResetItemRow[];
}

function rowToRecord(row: ResetRow): ResetRecord {
  const items = [...row.reset_items]
    .sort((a, b) => a.position - b.position)
    .map<PlanItem>((item) => ({
      id: item.id.split(":").pop() ?? item.id,
      bucket: item.bucket,
      source: item.source,
      text: item.text ?? undefined,
      messageKey: item.message_key ?? undefined,
      area: item.area ?? undefined,
      noteKey: item.note_key ?? undefined,
    }));
  return {
    id: row.id,
    createdAt: row.created_at,
    locale: row.locale,
    answers: {
      overwhelm: row.overwhelm,
      areas: row.areas,
      time: row.time_available,
      moneyPressure: row.money_pressure,
      mustHappen: row.must_happen,
      onMind: row.on_mind ?? undefined,
    },
    plan: {
      summaryKey: row.summary_key,
      timeKey: row.time_key,
      today: items.filter((i) => i.bucket === "today"),
      thisWeek: items.filter((i) => i.bucket === "thisWeek"),
      letGo: items.filter((i) => i.bucket === "letGo"),
    },
    safetyFlag: row.safety_flag,
    completedItemIds: row.completed_item_ids ?? [],
  };
}
