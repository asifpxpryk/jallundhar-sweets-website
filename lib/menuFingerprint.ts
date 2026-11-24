import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

import { BUILD_ID } from "@/lib/menuScope";

/**
 * Remembers what every menu row looked like at the last POS refresh, so the next one refreshes only
 * what moved. A full refresh throws away every cached page (4,300 product pages), so:
 *   - nothing changed: nothing is refreshed;
 *   - some products changed (rate, photo, stock, name, section, hidden/shown), were added or were
 *     removed: the listings, those products' pages, and the pages of a shelf whose "related" strip changed;
 *   - the store settings row changed, or very many products at once: everything.
 *
 * The signatures live in the private Storage bucket the rate limiter already uses, because serverless
 * functions do not share memory. Each build keeps its own copy, written while it is built (see
 * posRefreshState.ts), so the pages a deployment starts with are compared with what they were built
 * from. Whenever the copy can't be read, the answer is "everything".
 */

const BUCKET = "rate-limits";
const OBJECT_PREFIX = "pos-refresh-menu-signatures";
const OBJECT = `${OBJECT_PREFIX}-${BUILD_ID}.json`;
const VERSION = 3;
/** Another build's copy is left alone this long (a build in progress, or a rollback, may still need it). */
const KEEP_OTHER_BUILDS_MS = 14 * 86_400_000;

/** Above this many changed products a full refresh is simpler than naming each page. */
export const MAX_PRODUCTS_PER_REFRESH = 200;

/** Fields that decide where a product is listed and what its address is. */
export const PLACEMENT_FIELDS = ["name", "category_id", "is_hidden", "pos_linked"] as const;

/** [placement, details]: two short hashes per row. */
export type RowSignature = [string, string];
export type MenuSignatures = Record<string, RowSignature>;
/** `related`: a hash of each shelf's "related" strip (see relatedProducts.ts). */
export type MenuState = { rows: MenuSignatures; related: Record<string, string> };

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
  const changed: string[] = [];
  for (const id of new Set([...Object.keys(current), ...Object.keys(remembered)])) {
    const before = remembered[id];
    const now = current[id];
    if (before && now && before[0] === now[0] && before[1] === now[1]) continue;
    // A signature without a details hash is a whole-row one: the store settings row.
    if (before?.[1] === "" || now?.[1] === "") return { kind: "all", reason: "store settings changed" };
    changed.push(id);
  }
  if (!changed.length) return { kind: "none" };
  if (changed.length > MAX_PRODUCTS_PER_REFRESH) return { kind: "all", reason: "many products changed" };
  return { kind: "products", ids: changed };
}

/** The shelves whose "related" strip is not what it was (or that appeared or went away). */
export function changedShelves(current: Record<string, string>, remembered: Record<string, string>): string[] {
  const keys = new Set([...Object.keys(current), ...Object.keys(remembered)]);
  return [...keys].filter((key) => current[key] !== remembered[key]);
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

export function parseMenuState(raw: unknown): MenuState | null {
  if (!raw || typeof raw !== "object") return null;
  const saved = raw as { version?: unknown; rows?: unknown; related?: unknown };
  if (saved.version !== VERSION || !saved.rows || typeof saved.rows !== "object") return null;
  if (!saved.related || typeof saved.related !== "object") return null;
  const rows = saved.rows as Record<string, unknown>;
  for (const value of Object.values(rows)) {
    if (!Array.isArray(value) || value.length !== 2 || typeof value[0] !== "string" || typeof value[1] !== "string") {
      return null;
    }
  }
  const related = saved.related as Record<string, unknown>;
  if (Object.values(related).some((value) => typeof value !== "string")) return null;
  return { rows: rows as MenuSignatures, related: related as Record<string, string> };
}

/** What this build last compared the menu with; null when there is no usable copy. */
export async function readMenuState(): Promise<MenuState | null> {
  const supabase = client();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(OBJECT);
    if (error || !data) return null;
    return parseMenuState(JSON.parse(await data.text()));
  } catch {
    return null;
  }
}

/** False when it could not be saved: the next POS refresh then simply runs in full. */
export async function saveMenuState(state: MenuState): Promise<boolean> {
  const supabase = client();
  if (!supabase) return false;
  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(OBJECT, JSON.stringify({ version: VERSION, savedAt: new Date().toISOString(), ...state }), {
        contentType: "application/json",
        upsert: true,
      });
    return !error;
  } catch {
    return false;
  }
}

/** Removes the copies of builds that stopped answering long ago. Never this build's. */
export async function dropOldMenuStates(now = Date.now()) {
  const supabase = client();
  if (!supabase) return;
  try {
    const { data } = await supabase.storage.from(BUCKET).list("", { search: OBJECT_PREFIX, limit: 200 });
    const old = (data ?? [])
      .filter((file) => file.name.startsWith(OBJECT_PREFIX) && file.name !== OBJECT)
      .filter((file) => now - Date.parse(file.updated_at ?? file.created_at ?? "") > KEEP_OTHER_BUILDS_MS)
      .map((file) => file.name);
    if (old.length) await supabase.storage.from(BUCKET).remove(old);
  } catch {
    // Left for the next refresh.
  }
}
