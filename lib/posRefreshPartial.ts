import {
  MAX_PRODUCTS_PER_REFRESH,
  menuChange,
  type MenuChange,
  type MenuSignatures,
  type MenuState,
} from "@/lib/menuFingerprint";

/**
 * A POS refresh that names the rows it just wrote (`{ ids: [...] }`) reads only those rows instead of the
 * whole menu. Everything here is pure, so it can be tested without Supabase or Next.js; the route
 * (app/api/pos-refresh/route.ts) does the reading and saving.
 *
 * Whenever anything is unclear the answer is "full": the body is not a clean list, there is no saved copy,
 * or the last full compare is older than FULL_CHECK_MAX_AGE_MS (changes the bridge never names, such as an
 * admin edit or manual SQL, are then still found).
 */

/** The last full compare of the whole menu may be at most this old for a named refresh to be trusted. */
export const FULL_CHECK_MAX_AGE_MS = 6 * 60 * 60_000;
/** A body larger than this is not a list the POS bridge sends: the refresh runs in full. */
export const MAX_REFRESH_BODY_BYTES = 64 * 1024;
const MAX_ID_LENGTH = 200;
// Printable ASCII only, no spaces: menu ids are slugs and POS ids.
const PLAIN_ID = /^[\x21-\x7e]+$/;

/**
 * The ids named in a POS refresh body, or null when the refresh must run in full: the body is missing,
 * not `{ ids: string[] }`, empty, longer than MAX_PRODUCTS_PER_REFRESH, holds anything other than plain
 * id strings, or names a whole-row id (the store settings row, which only a full compare may judge).
 */
export function parseRefreshIds(body: unknown, wholeRow: (id: string) => boolean): string[] | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const ids = (body as { ids?: unknown }).ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_PRODUCTS_PER_REFRESH) return null;
  for (const id of ids) {
    if (typeof id !== "string" || id.length > MAX_ID_LENGTH || !PLAIN_ID.test(id) || wholeRow(id)) return null;
  }
  return [...new Set(ids as string[])];
}

/** The body text as JSON, or undefined when it is empty, too large or not JSON. */
export function parseRefreshBody(text: string): unknown {
  if (!text.trim() || text.length > MAX_REFRESH_BODY_BYTES) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Why a named refresh can't be trusted against this saved copy; null when it can. */
export function partialBlocker(remembered: MenuState | null, now: number): string | null {
  if (!remembered) return "no earlier copy";
  const checkedAt = remembered.checkedAt ? Date.parse(remembered.checkedAt) : NaN;
  if (!Number.isFinite(checkedAt)) return "no time of the last full check";
  if (now - checkedAt > FULL_CHECK_MAX_AGE_MS) return "last full check too old";
  return null;
}

/** What changed among `ids` only: `fresh` holds the signatures of the named rows that still exist. */
export function partialMenuChange(ids: readonly string[], fresh: MenuSignatures, remembered: MenuSignatures): MenuChange {
  const before: MenuSignatures = {};
  const now: MenuSignatures = {};
  for (const id of ids) {
    if (remembered[id]) before[id] = remembered[id];
    if (fresh[id]) now[id] = fresh[id];
  }
  return menuChange(now, before);
}

/**
 * The copy to save after a named refresh: the old rows with `ids` replaced by `fresh` (a named row that
 * no longer exists is dropped), the related strips just worked out, and the time of the last full check
 * carried over, because only the named rows were compared.
 */
export function mergePartialState(
  remembered: MenuState,
  ids: readonly string[],
  fresh: MenuSignatures,
  related: Record<string, string>
): MenuState {
  const named = new Set(ids);
  const rows: MenuSignatures = {};
  for (const [id, signature] of Object.entries(remembered.rows)) {
    if (!named.has(id)) rows[id] = signature;
  }
  for (const id of ids) {
    if (fresh[id]) rows[id] = fresh[id];
  }
  return { rows, related, checkedAt: remembered.checkedAt };
}

type ListedRow = { id: string; sort_order?: number | null };

/** Postgres puts a missing sort_order last when ordering ascending, as the menu read does. */
function sortKey(row: ListedRow): number {
  return typeof row.sort_order === "number" && Number.isFinite(row.sort_order) ? row.sort_order : Number.POSITIVE_INFINITY;
}

/**
 * The whole catalogue for the related strips: the cached listing rows with the named rows swapped for
 * the ones just read, a named row that is gone dropped, and a new one added, in the menu's order
 * (sort_order; rows with the same sort_order keep the listing's order, new ones follow by id).
 */
export function mergeListingRows<T extends ListedRow>(listing: readonly T[], ids: readonly string[], fresh: readonly T[]): T[] {
  const named = new Set(ids);
  const freshById = new Map(fresh.filter((row) => named.has(row.id)).map((row) => [row.id, row]));
  const merged: T[] = [];
  const placed = new Set<string>();
  for (const row of listing) {
    if (!named.has(row.id)) {
      merged.push(row);
      continue;
    }
    const replacement = freshById.get(row.id);
    if (replacement && !placed.has(row.id)) {
      merged.push(replacement);
      placed.add(row.id);
    }
  }
  const added = [...freshById.values()].filter((row) => !placed.has(row.id)).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  // Array.prototype.sort is stable, so ties keep the listing's order with the new rows after them.
  return [...merged, ...added].sort((a, b) => sortKey(a) - sortKey(b) || 0);
}
