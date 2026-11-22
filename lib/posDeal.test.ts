import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { withDealPrice } from "@/lib/cartLine";
import { priceOrderLines, type CatalogPrice } from "@/lib/orderPricing";
import { activePosDeal, dealShown, posFields } from "@/lib/posDeal";
import type { MenuItem } from "@/lib/types";

const NOW = Date.parse("2026-11-20T12:00:00Z");
const HOUR = 3_600_000;

function item(fields: Partial<MenuItem> = {}): MenuItem {
  return {
    id: "pos-prd-12",
    category_id: "general",
    name: "Nimko 200g",
    description: null,
    price: 100,
    image_url: null,
    is_available: true,
    sort_order: 0,
    ...fields,
  };
}

/** The catalogue entry the order route builds: today's price (deal included) and the plain price. */
function catalogFor(menuItem: MenuItem, now: number): Map<string, CatalogPrice | null> {
  const prices = [...new Set([withDealPrice(menuItem, now).price, menuItem.price])];
  return new Map([[menuItem.id, { name: menuItem.name, prices, available: true, weighable: false }]]);
}

function orderAt(menuItem: MenuItem, unitPrice: number, now: number) {
  const lines = [{ id: menuItem.id, name: menuItem.name, quantity: 2, unit_price: unitPrice, weighed: false }];
  return priceOrderLines(lines, catalogFor(menuItem, now));
}

const inAnHour = new Date(NOW + HOUR).toISOString();
const anHourAgo = new Date(NOW - HOUR).toISOString();

describe("activePosDeal", () => {
  test("a deal with a future end is running", () => {
    const deal = activePosDeal(item({ pos_deal_price: 80, pos_deal_label: "Eid offer", pos_deal_ends_at: inAnHour }), NOW);
    assert.deepEqual(deal, { price: 80, label: "Eid offer" });
  });

  test("a deal with no end runs until the shop removes it", () => {
    assert.deepEqual(activePosDeal(item({ pos_deal_price: 80, pos_deal_ends_at: null }), NOW), { price: 80, label: "" });
  });

  test("a deal past its end is ignored", () => {
    assert.equal(activePosDeal(item({ pos_deal_price: 80, pos_deal_ends_at: new Date(NOW - 1).toISOString() }), NOW), null);
  });

  test("no deal price, zero or a broken end date means no deal", () => {
    assert.equal(activePosDeal(item(), NOW), null);
    assert.equal(activePosDeal(item({ pos_deal_price: 0 }), NOW), null);
    assert.equal(activePosDeal(item({ pos_deal_price: 80, pos_deal_ends_at: "not a date" }), NOW), null);
  });

  test("a numeric deal price sent as text still counts", () => {
    assert.equal(activePosDeal(item({ pos_deal_price: "75.5" as unknown as number }), NOW)?.price, 75.5);
  });
});

describe("deal prices on cards and in the cart", () => {
  test("a running shop deal sells at the deal price with its label", () => {
    const running = item({ pos_deal_price: 80, pos_deal_label: "Eid offer", pos_deal_ends_at: inAnHour });
    assert.equal(withDealPrice(running, NOW).price, 80);
    assert.deepEqual(dealShown(running, 100, NOW), { sale: 80, label: "Eid offer" });
  });

  test("an ended shop deal shows and sells the normal price", () => {
    const ended = item({ pos_deal_price: 80, pos_deal_label: "Eid offer", pos_deal_ends_at: anHourAgo });
    assert.equal(withDealPrice(ended, NOW).price, 100);
    assert.deepEqual(dealShown(ended, 100, NOW), { sale: null, label: "" });
  });

  test("the website's numeric deal line still sets the price", () => {
    const shelfDeal = item({ is_deal: true, deal_label: "Rs. 90" });
    assert.equal(withDealPrice(shelfDeal, NOW).price, 90);
    assert.deepEqual(dealShown(shelfDeal, 100, NOW), { sale: 90, label: "" });
    assert.deepEqual(dealShown(item({ is_deal: true, deal_label: "2 for 1" }), 100, NOW), { sale: null, label: "2 for 1" });
  });

  test("a running shop deal wins over the website deal line", () => {
    const both = item({ is_deal: true, deal_label: "90", pos_deal_price: 70, pos_deal_ends_at: null });
    assert.equal(withDealPrice(both, NOW).price, 70);
  });

  test("posFields carries POS columns only when the row has them", () => {
    assert.deepEqual(posFields(item()), {});
    assert.deepEqual(posFields(item({ pos_linked: true, pos_product_id: "P1", pos_deal_price: 80 })), {
      pos_linked: true,
      pos_product_id: "P1",
      pos_deal_price: 80,
      pos_deal_label: null,
      pos_deal_ends_at: null,
    });
  });
});

describe("server order pricing with shop deals", () => {
  test("accepts the deal price while the deal runs", () => {
    const running = item({ pos_deal_price: 80, pos_deal_ends_at: inAnHour });
    const result = orderAt(running, 80, NOW);
    assert.deepEqual(result.changes, []);
    assert.equal(result.lines[0].line_total, 160);
  });

  test("accepts the deal price when the deal has no end", () => {
    const open = item({ pos_deal_price: 80, pos_deal_ends_at: null });
    assert.deepEqual(orderAt(open, 80, NOW).changes, []);
  });

  test("rejects the deal price once the deal has ended", () => {
    const ended = item({ pos_deal_price: 80, pos_deal_ends_at: new Date(NOW - 1).toISOString() });
    const result = orderAt(ended, 80, NOW);
    assert.deepEqual(result.changes, [{ id: ended.id, name: ended.name, price: 100 }]);
  });

  test("the same cart is accepted before the end and rejected after it", () => {
    const deal = item({ pos_deal_price: 80, pos_deal_ends_at: new Date(NOW).toISOString() });
    assert.deepEqual(orderAt(deal, 80, NOW - 1).changes, []);
    assert.equal(orderAt(deal, 80, NOW).changes.length, 1);
  });
});
