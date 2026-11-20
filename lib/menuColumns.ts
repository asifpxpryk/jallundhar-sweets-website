/**
 * Columns read from menu_items, newest first. The site ships before data/pos-bridge.sql may be
 * applied, so a read that names a missing column falls back to the next set instead of failing.
 */
const BASE = "id, category_id, name, description, price, image_url, is_available, sort_order";
/** POS columns; the deal columns are renamed so they don't clash with the website's own deal line. */
const POS =
  "pos_linked, pos_product_id, pos_deal_price:deal_price, pos_deal_label:deal_label, pos_deal_ends_at:deal_ends_at";

export const MENU_COLUMN_SETS = [`${BASE}, is_hidden, ${POS}`, `${BASE}, is_hidden`, BASE] as const;

type QueryError = { code?: string; message?: string } | null | undefined;
type QueryResult<T> = { data: T | null; error: QueryError };

/** Postgres/PostgREST "column does not exist" errors. */
export function isMissingColumnError(error: QueryError): boolean {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  return /column .* does not exist|could not find the .* column/i.test(error.message ?? "");
}

/**
 * Runs `query` with the first column set that exists, starting at `start`. Returns the result and
 * the set index used, so a paged read keeps using it. Other errors are returned as they are.
 */
export async function selectWithColumnFallback<T>(
  query: (columns: string) => PromiseLike<QueryResult<T>>,
  start = 0
): Promise<QueryResult<T> & { columnSet: number }> {
  let columnSet = Math.max(0, Math.min(start, MENU_COLUMN_SETS.length - 1));
  for (;;) {
    const result = await query(MENU_COLUMN_SETS[columnSet]);
    if (!isMissingColumnError(result.error) || columnSet === MENU_COLUMN_SETS.length - 1) {
      return { data: result.data, error: result.error, columnSet };
    }
    columnSet += 1;
  }
}
