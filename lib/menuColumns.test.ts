import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { MENU_COLUMN_SETS, isMissingColumnError, selectWithColumnFallback } from "@/lib/menuColumns";

const missing = (column: string) => ({ code: "42703", message: `column menu_items.${column} does not exist` });

describe("menu_items read before and after data/pos-bridge.sql", () => {
  test("reads the POS columns when they exist", async () => {
    const seen: string[] = [];
    const result = await selectWithColumnFallback(async (columns) => {
      seen.push(columns);
      return { data: [{ id: "a", pos_linked: true }], error: null };
    });
    assert.equal(result.columnSet, 0);
    assert.match(seen[0], /pos_deal_price:deal_price/);
    assert.equal(seen.length, 1);
  });

  test("falls back without the POS columns when they are missing", async () => {
    const seen: string[] = [];
    const result = await selectWithColumnFallback(async (columns) => {
      seen.push(columns);
      if (columns.includes("pos_linked")) return { data: null, error: missing("pos_linked") };
      return { data: [{ id: "a" }], error: null };
    });
    assert.equal(result.error, null);
    assert.equal(result.columnSet, 1);
    assert.deepEqual(seen, [MENU_COLUMN_SETS[0], MENU_COLUMN_SETS[1]]);
  });

  test("falls back to the oldest columns when is_hidden is missing too", async () => {
    const result = await selectWithColumnFallback(async (columns) => {
      if (columns.includes("pos_linked")) return { data: null, error: missing("pos_linked") };
      if (columns.includes("is_hidden")) return { data: null, error: missing("is_hidden") };
      return { data: [], error: null };
    });
    assert.equal(result.columnSet, 2);
  });

  test("a later page starts from the column set the first page found", async () => {
    const seen: string[] = [];
    await selectWithColumnFallback(async (columns) => {
      seen.push(columns);
      return { data: [], error: null };
    }, 1);
    assert.deepEqual(seen, [MENU_COLUMN_SETS[1]]);
  });

  test("a network error is not mistaken for a missing column", async () => {
    let calls = 0;
    const result = await selectWithColumnFallback(async () => {
      calls += 1;
      return { data: null, error: { message: "fetch failed" } };
    });
    assert.equal(calls, 1);
    assert.equal(result.error?.message, "fetch failed");
  });

  test("recognises PostgREST missing-column errors", () => {
    assert.equal(isMissingColumnError({ code: "PGRST204", message: "Could not find the 'pos_linked' column" }), true);
    assert.equal(isMissingColumnError({ message: "permission denied" }), false);
    assert.equal(isMissingColumnError(null), false);
  });
});
