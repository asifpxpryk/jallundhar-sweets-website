import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { MAX_PRODUCTS_PER_REFRESH, menuSignatures, parseMenuState, type MenuState } from "@/lib/menuFingerprint";
import {
  FULL_CHECK_MAX_AGE_MS,
  MAX_REFRESH_BODY_BYTES,
  mergeListingRows,
  mergePartialState,
  parseRefreshBody,
  parseRefreshIds,
  partialBlocker,
  partialMenuChange,
} from "@/lib/posRefreshPartial";

const SETTINGS_ID = "store-visibility-config";
const isSettings = (id: string) => id === SETTINGS_ID;

const ROWS = [
  { id: "cham-cham", category_id: "sweets", name: "Cham Cham", price: 1200, is_available: true, is_hidden: false, sort_order: 1 },
  { id: "dry-cake-cup", category_id: "bakery", name: "Cup Cake", price: 45, is_available: true, is_hidden: false, sort_order: 2 },
  { id: "rusk", category_id: "bakery", name: "Rusk", price: 300, is_available: true, is_hidden: false, sort_order: 3 },
  { id: SETTINGS_ID, category_id: "sweets", name: "__store_visibility__", price: 0, description: "{}", is_available: false, sort_order: 0 },
];

const sigs = (rows: Record<string, unknown>[]) => menuSignatures(rows, isSettings);

describe("parseRefreshIds", () => {
  test("accepts a list of plain ids and drops repeats", () => {
    assert.deepEqual(parseRefreshIds({ ids: ["cham-cham", "pos:123", "cham-cham"] }, isSettings), ["cham-cham", "pos:123"]);
  });

  test("returns null (full refresh) for anything that is not a clean list", () => {
    const bad: unknown[] = [
      undefined,
      null,
      "cham-cham",
      ["cham-cham"],
      {},
      { ids: [] },
      { ids: "cham-cham" },
      { ids: ["cham-cham", 5] },
      { ids: [""] },
      { ids: ["has space"] },
      { ids: ["line\nbreak"] },
      { ids: ["x".repeat(201)] },
      { ids: ["cham-cham", SETTINGS_ID] },
      { ids: Array.from({ length: MAX_PRODUCTS_PER_REFRESH + 1 }, (_, i) => `p${i}`) },
    ];
    for (const body of bad) assert.equal(parseRefreshIds(body, isSettings), null, JSON.stringify(body)?.slice(0, 60));
  });

  test("accepts exactly the most ids one refresh may name", () => {
    const ids = Array.from({ length: MAX_PRODUCTS_PER_REFRESH }, (_, i) => `p${i}`);
    assert.deepEqual(parseRefreshIds({ ids }, isSettings), ids);
  });
});

describe("parseRefreshBody", () => {
  test("reads JSON and gives undefined for an empty, broken or oversized body", () => {
    assert.deepEqual(parseRefreshBody('{"ids":["a"]}'), { ids: ["a"] });
    assert.equal(parseRefreshBody(""), undefined);
    assert.equal(parseRefreshBody("   "), undefined);
    assert.equal(parseRefreshBody("{ids:"), undefined);
    assert.equal(parseRefreshBody(`{"ids":["${"a".repeat(MAX_REFRESH_BODY_BYTES)}"]}`), undefined);
  });
});

describe("partialBlocker", () => {
  const now = Date.parse("2026-11-25T12:00:00Z");
  const state = (checkedAt?: string): MenuState => ({ rows: {}, related: {}, ...(checkedAt ? { checkedAt } : {}) });

  test("trusts a copy whose last full check is recent", () => {
    assert.equal(partialBlocker(state(new Date(now - 60_000).toISOString()), now), null);
  });

  test("asks for a full compare without a copy, without a check time, or when the check is too old", () => {
    assert.equal(partialBlocker(null, now), "no earlier copy");
    assert.equal(partialBlocker(state(), now), "no time of the last full check");
    assert.equal(partialBlocker(state("not a date"), now), "no time of the last full check");
    assert.equal(partialBlocker(state(new Date(now - FULL_CHECK_MAX_AGE_MS - 1).toISOString()), now), "last full check too old");
  });
});

describe("partialMenuChange", () => {
  const remembered = sigs(ROWS);

  test("nothing changed among the named rows", () => {
    assert.deepEqual(partialMenuChange(["cham-cham"], sigs([ROWS[0]]), remembered), { kind: "none" });
  });

  test("a named row that changed", () => {
    const fresh = sigs([{ ...ROWS[0], price: 1300 }, ROWS[1]]);
    assert.deepEqual(partialMenuChange(["cham-cham", "dry-cake-cup"], fresh, remembered), { kind: "products", ids: ["cham-cham"] });
  });

  test("a named row that is gone counts as removed; a new one as added", () => {
    const fresh = sigs([{ id: "new-barfi", category_id: "sweets", name: "Barfi", price: 900, sort_order: 9 }]);
    const change = partialMenuChange(["rusk", "new-barfi"], fresh, remembered);
    assert.equal(change.kind, "products");
    assert.deepEqual(change.kind === "products" ? [...change.ids].sort() : [], ["new-barfi", "rusk"]);
  });

  test("rows that were not named are never compared", () => {
    // Rusk changed too, but only Cham Cham was named: Rusk is left for its own refresh or the full check.
    const fresh = sigs([ROWS[0], { ...ROWS[2], price: 999 }]);
    assert.deepEqual(partialMenuChange(["cham-cham"], fresh, remembered), { kind: "none" });
  });
});

describe("mergePartialState", () => {
  const remembered: MenuState = { rows: sigs(ROWS), related: { bakery: "old" }, checkedAt: "2026-11-25T10:00:00.000Z" };

  test("replaces the named rows, drops a named row that is gone, keeps the rest and the last full check time", () => {
    const fresh = sigs([{ ...ROWS[0], price: 1300 }, { id: "new-barfi", name: "Barfi", price: 900 }]);
    const merged = mergePartialState(remembered, ["cham-cham", "rusk", "new-barfi"], fresh, { bakery: "new" });
    assert.deepEqual(Object.keys(merged.rows).sort(), ["cham-cham", "dry-cake-cup", "new-barfi", SETTINGS_ID].sort());
    assert.deepEqual(merged.rows["cham-cham"], fresh["cham-cham"]);
    assert.deepEqual(merged.rows["dry-cake-cup"], remembered.rows["dry-cake-cup"]);
    assert.deepEqual(merged.rows[SETTINGS_ID], remembered.rows[SETTINGS_ID]);
    assert.deepEqual(merged.related, { bakery: "new" });
    assert.equal(merged.checkedAt, remembered.checkedAt);
  });

  test("does not change the copy it was given", () => {
    const before = JSON.stringify(remembered);
    mergePartialState(remembered, ["cham-cham"], {}, {});
    assert.equal(JSON.stringify(remembered), before);
  });

  test("a merged copy compared again with the same rows finds nothing", () => {
    const fresh = sigs([{ ...ROWS[0], price: 1300 }]);
    const merged = mergePartialState(remembered, ["cham-cham"], fresh, {});
    assert.deepEqual(partialMenuChange(["cham-cham"], fresh, merged.rows), { kind: "none" });
  });
});

describe("mergeListingRows", () => {
  const listing = ROWS.filter((row) => row.id !== SETTINGS_ID);

  test("swaps a named row in place", () => {
    const merged = mergeListingRows(listing, ["dry-cake-cup"], [{ ...ROWS[1], price: 50 }]);
    assert.deepEqual(merged.map((row) => row.id), ["cham-cham", "dry-cake-cup", "rusk"]);
    assert.equal(merged[1].price, 50);
  });

  test("drops a named row that is gone and adds a new one in sort order", () => {
    const added = { id: "barfi", category_id: "sweets", name: "Barfi", price: 900, is_available: true, is_hidden: false, sort_order: 2 };
    const merged = mergeListingRows(listing, ["rusk", "barfi"], [added]);
    assert.deepEqual(merged.map((row) => row.id), ["cham-cham", "dry-cake-cup", "barfi"]);
  });

  test("moves a row whose sort order changed, and ignores fresh rows that were not named", () => {
    const merged = mergeListingRows(listing, ["cham-cham"], [{ ...ROWS[0], sort_order: 10 }, { ...ROWS[2], price: 1 }]);
    assert.deepEqual(merged.map((row) => row.id), ["dry-cake-cup", "rusk", "cham-cham"]);
    assert.equal(merged[1].price, 300);
  });

  test("leaves the listing it was given unchanged", () => {
    const before = JSON.stringify(listing);
    mergeListingRows(listing, ["rusk"], []);
    assert.equal(JSON.stringify(listing), before);
  });
});

describe("parseMenuState check time", () => {
  const rows = sigs(ROWS);

  test("keeps checkedAt, and treats savedAt as the check time of an older copy", () => {
    assert.equal(parseMenuState({ version: 3, rows, related: {}, checkedAt: "a", savedAt: "b" })?.checkedAt, "a");
    assert.equal(parseMenuState({ version: 3, rows, related: {}, savedAt: "b" })?.checkedAt, "b");
    assert.equal(parseMenuState({ version: 3, rows, related: {} })?.checkedAt, undefined);
  });
});
