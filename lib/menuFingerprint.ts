import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * Remembers what every menu row looked like at the last POS refresh, so the next one refreshes only
 * what moved. The POS bridge calls every 20 minutes or so, and a full refresh throws away every cached
 * page (4,300 product pages), so:
 *   - nothing changed: nothing is refreshed;
 *   - a few products' rate, photo, description or stock changed: the listings and those product pages;
 *   - a product was added, removed, renamed, moved or hidden/shown, or the store settings row changed: everything.
 *
 * The signatures live in the private Storage bucket the rate limiter already uses, because serverless
 * functions do not share memory. Whenever they can't be read, the answer is "everything".
 */

const BUCKET = "rate-limits";
const OBJECT = "pos-refresh-menu-signatures.json";
const VERSION = 2;

/** Above this many changed products a full refresh is simpler than naming each page. */
export const MAX_PRODUCTS_PER_REFRESH = 200;

/** Fields that decide where a product is listed and what its address is. */
const PLACEMENT_FIELDS = ["name", "category_id", "is_hidden", "pos_linked"] as const;

/** [placement, details]: two short hashes per row. */
export type RowSignature = [string, string];
export type MenuSignatures = Record<string, RowSignature>;

export type MenuChange =
  | { kind: "none" }
  | { kind: "products"; ids: string[] }
  | { kind: "all"; reason: string };

function shortHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}

type Row = { id?: unknown } & Record<string, unknown>;

/** `wholeRow(id)` marks rows (the store settings row) where any change at all means a full refresh. */
export function menuSignatures(rows: Row[], wholeRow: (id: string) => boolean = () => false): MenuSignatures {
  const signatures: MenuSignatures = {};
  for (const row of rows) {
    const id = typeof row.id === "string" ? row.id : "";
    if (!id) continue;
    const fields = Object.keys(row)
      .sort()
      .map((key) => [key, row[key] ?? null] as const);
    if (wholeRow(id)) {
      signatures[id] = [shortHash(fields), ""];
      continue;
    }
    const placement = PLACEMENT_FIELDS.map((field) => row[field] ?? null);
    const details = fields.filter(([key]) => !(PLACEMENT_FIELDS as readonly string[]).includes(key));
    signatures[id] = [shortHash(placement), shortHash(details)];
  }
  return signatures;
}

/** What a POS refresh has to rebuild, given the rows now and the rows at the last refresh. */
export function menuChange(current: MenuSignatures, remembered: MenuSignatures | null): MenuChange {
  if (!remembered) return { kind: "all", reason: "no earlier copy" };
  const ids = Object.keys(current);
  if (ids.length !== Object.keys(remembered).length) return { kind: "all", reason: "products added or removed" };
  const changed: string[] = [];
  for (const id of ids) {
    const before = remembered[id];
    if (!before) return { kind: "all", reason: "products added or removed" };
    const now = current[id];
    if (before[0] !== now[0]) return { kind: "all", reason: "a product was renamed, moved or hidden" };
    if (before[1] !== now[1]) changed.push(id);
  }
  if (!changed.length) return { kind: "none" };
  if (changed.length > MAX_PRODUCTS_PER_REFRESH) return { kind: "all", reason: "many products changed" };
  return { kind: "products", ids: changed };
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !secret) return null;
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

function parseSignatures(raw: unknown): MenuSignatures | null {
  if (!raw || typeof raw !== "object") return null;
  const saved = raw as { version?: unknown; rows?: unknown };
  if (saved.version !== VERSION || !saved.rows || typeof saved.rows !== "object") return null;
  const rows = saved.rows as Record<string, unknown>;
  for (const value of Object.values(rows)) {
    if (!Array.isArray(value) || value.length !== 2 || typeof value[0] !== "string" || typeof value[1] !== "string") {
      return null;
    }
  }
  return rows as MenuSignatures;
}

export async function readMenuSignatures(): Promise<MenuSignatures | null> {
  const supabase = client();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(OBJECT);
    if (error || !data) return null;
    return parseSignatures(JSON.parse(await data.text()));
  } catch {
    return null;
  }
}

export async function saveMenuSignatures(rows: MenuSignatures) {
  const supabase = client();
  if (!supabase) return;
  try {
    await supabase.storage
      .from(BUCKET)
      .upload(OBJECT, JSON.stringify({ version: VERSION, savedAt: new Date().toISOString(), rows }), {
        contentType: "application/json",
        upsert: true,
      });
  } catch {
    // Not remembered: the next POS refresh simply runs in full.
  }
}
