import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { itemsForPlacement } from "@/lib/itemPlacement";
import { applyMenuOverrides } from "@/lib/loadAisleItems";
import type { StoreVisibility } from "@/lib/storeVisibility";
import type { MenuItem } from "@/lib/types";

const VISIBILITY = {
  hiddenSections: [],
  hiddenAisles: [],
  hiddenItemIds: [],
  bestsellerIds: [],
  newArrivalIds: [],
  dealIds: [],
  dealLabels: {},
  itemAisleKeys: {},
  categoryNames: {},
  categoryImages: {},
  customCategories: [],
  bannerPages: {},
} as unknown as StoreVisibility;

function posRow(fields: Partial<MenuItem>): MenuItem {
  return {
    id: "pos-prd-999001",
    category_id: "general",
    name: "Shop Special Nimko 250g",
    description: null,
    price: 180,
    image_url: "/products/nimko.webp",
    is_available: true,
    is_hidden: false,
    sort_order: 0,
    pos_linked: true,
    pos_product_id: "PRD-999001",
    ...fields,
  };
}

function shown(placement: string, rows: MenuItem[], vis: StoreVisibility = VISIBILITY) {
  return applyMenuOverrides(itemsForPlacement(placement, vis, rows), rows, false, vis.hiddenItemIds, vis.bestsellerIds);
}

describe("new rows the POS adds (pos-prd-N, not in aisle-items.json)", () => {
  test("a section slug puts the row on that section", () => {
    const row = posRow({ category_id: "general" });
    assert.deepEqual(shown("general", [row]).map((item) => item.id), ["pos-prd-999001"]);
  });

  test("a section:aisle category puts the row on that aisle", () => {
    const row = posRow({ category_id: "general:biscuits" });
    const items = shown("general:biscuits", [row]);
    assert.equal(items.find((item) => item.id === row.id)?.pos_linked, true);
    assert.equal(shown("general", [row]).some((item) => item.id === row.id), false);
  });

  test("stays off the storefront while the POS keeps it hidden", () => {
    assert.equal(shown("general", [posRow({ is_hidden: true })]).length, 0);
  });

  test("the website hide list does not hide a POS-linked row, only an unlinked one", () => {
    const vis = { ...VISIBILITY, hiddenItemIds: ["pos-prd-999001"] } as StoreVisibility;
    assert.equal(shown("general", [posRow({})], vis).length, 1);
    assert.equal(shown("general", [posRow({ pos_linked: false })], vis).length, 0);
  });

  test("carries the shop deal to the storefront item", () => {
    const row = posRow({ pos_deal_price: 150, pos_deal_label: "Weekend", pos_deal_ends_at: null });
    const [item] = shown("general", [row]);
    assert.equal(item.pos_deal_price, 150);
    assert.equal(item.pos_deal_label, "Weekend");
  });
});
