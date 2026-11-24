import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { MAX_PRODUCTS_PER_REFRESH, menuChange, menuSignatures } from "@/lib/menuFingerprint";

const SETTINGS_ID = "__settings__";
const isSettings = (id: string) => id === SETTINGS_ID;

const ROWS = [
  { id: "cham-cham", category_id: "sweets", name: "Cham Cham", price: 1200, image_url: "a.webp", is_available: true, is_hidden: false },
  { id: "dry-cake-cup", category_id: "bakery", name: "Cup Cake", price: 45, image_url: "b.webp", is_available: true, is_hidden: false },
  { id: SETTINGS_ID, category_id: "sweets", name: "__store_visibility__", price: 0, description: "{}", is_available: false },
];

function change(after: typeof ROWS | Record<string, unknown>[]) {
  return menuChange(menuSignatures(after, isSettings), menuSignatures(ROWS, isSettings));
}

function edited(id: string, fields: Record<string, unknown>) {
  return ROWS.map((row) => (row.id === id ? { ...row, ...fields } : row));
}

describe("what a POS refresh rebuilds", () => {
  test("nothing, when no row moved", () => {
    assert.deepEqual(change(structuredClone(ROWS)), { kind: "none" });
  });

  test("only the product, for a new photo, rate, description or stock", () => {
    assert.deepEqual(change(edited("cham-cham", { image_url: "new.webp" })), { kind: "products", ids: ["cham-cham"] });
    assert.deepEqual(change(edited("dry-cake-cup", { price: 50 })), { kind: "products", ids: ["dry-cake-cup"] });
    assert.deepEqual(change(edited("cham-cham", { description: "Soft" })), { kind: "products", ids: ["cham-cham"] });
    assert.deepEqual(change(edited("cham-cham", { is_available: false })), { kind: "products", ids: ["cham-cham"] });
  });

  test("everything, when a product is renamed, moved, hidden, added or removed", () => {
    assert.equal(change(edited("cham-cham", { name: "Cham Cham Special" })).kind, "all");
    assert.equal(change(edited("cham-cham", { category_id: "bakery" })).kind, "all");
    assert.equal(change(edited("cham-cham", { is_hidden: true })).kind, "all");
    assert.equal(change([...ROWS, { id: "new", category_id: "sweets", name: "New", price: 10 }]).kind, "all");
    assert.equal(change(ROWS.slice(1)).kind, "all");
    assert.equal(change([{ ...ROWS[0], id: "swapped" }, ...ROWS.slice(1)]).kind, "all");
  });

  test("everything, when the store settings row changes", () => {
    assert.equal(change(edited(SETTINGS_ID, { description: '{"hiddenItemIds":["x"]}' })).kind, "all");
  });

  test("everything, when there is no earlier copy or too many products changed", () => {
    assert.equal(menuChange(menuSignatures(ROWS, isSettings), null).kind, "all");
    const many = Array.from({ length: MAX_PRODUCTS_PER_REFRESH + 1 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, price: 1 }));
    const repriced = many.map((row) => ({ ...row, price: 2 }));
    assert.equal(menuChange(menuSignatures(repriced), menuSignatures(many)).kind, "all");
  });

  test("the order of a row's columns does not matter", () => {
    const reordered = ROWS.map((row) => Object.fromEntries(Object.entries(row).reverse()));
    assert.deepEqual(change(reordered), { kind: "none" });
  });
});
