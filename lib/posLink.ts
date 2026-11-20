/**
 * Rows linked to the shop POS (menu_items.pos_linked) take price, stock and hide from the POS.
 * Website admin saves keep every other field but never write these three for linked rows.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingColumnError } from "@/lib/menuColumns";

export const POS_LOCKED_FIELDS = ["price", "is_available", "is_hidden"] as const;

/** The admin save payload with the POS-owned fields removed when the row is linked. */
export function posSafePayload<T extends Record<string, unknown>>(payload: T, linked: boolean): Partial<T> {
  if (!linked) return { ...payload };
  const kept: Partial<T> = {};
  for (const [key, value] of Object.entries(payload)) {
    if ((POS_LOCKED_FIELDS as readonly string[]).includes(key)) continue;
    (kept as Record<string, unknown>)[key] = value;
  }
  return kept;
}

/** Only `from()` is used, so tests can pass a small fake. */
type LinkClient = Pick<SupabaseClient, "from">;

/**
 * Which of `ids` are linked to the POS. Before data/pos-bridge.sql is applied the column is
 * missing and nothing is linked; any other read failure is returned so the save stops.
 */
export async function linkedMenuIds(client: LinkClient, ids: string[]): Promise<{ ids: Set<string>; error: string }> {
  const wanted = [...new Set(ids.filter(Boolean))];
  if (!wanted.length) return { ids: new Set(), error: "" };
  const { data, error } = await client.from("menu_items").select("id, pos_linked").in("id", wanted);
  if (error) {
    if (isMissingColumnError(error)) return { ids: new Set(), error: "" };
    return { ids: new Set(), error: error.message || "Could not read the item." };
  }
  const rows = Array.isArray(data) ? (data as { id?: unknown; pos_linked?: unknown }[]) : [];
  return {
    ids: new Set(rows.filter((row) => row.pos_linked === true).map((row) => String(row.id))),
    error: "",
  };
}
