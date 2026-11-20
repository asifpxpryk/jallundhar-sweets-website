import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  lookupTrackedOrder,
  orderTrackingUrl,
  parseOrderNumber,
  phoneKey,
  savedOrderNumber,
  type TrackingClient,
} from "@/lib/orderTracking";

type Row = Record<string, unknown>;

const ORDERS: Row[] = [
  {
    id: "o-1",
    order_number: 1042,
    phone: "0300-1234567",
    status: "preparing",
    status_at: "2026-11-20T10:05:00Z",
    created_at: "2026-11-20T10:00:00Z",
    total: 1250,
  },
  {
    id: "o-2",
    order_number: 1043,
    phone: "+92 301 7654321",
    status: "cancelled",
    status_at: "2026-11-20T11:00:00Z",
    created_at: "2026-11-20T10:30:00Z",
    total: 300,
  },
];
const ITEMS: Row[] = [
  { order_id: "o-1", item_name: "Gulab Jamun 1 kg", quantity: 1, line_total: 1000 },
  { order_id: "o-1", item_name: "Nimko 200g", quantity: 2, line_total: 250 },
];

function fakeDb(tables: Record<string, Row[]>, failOn?: string) {
  const reads: string[] = [];
  const fake = {
    from(table: string) {
      return {
        select() {
          return {
            eq(column: string, value: unknown) {
              reads.push(`${table}.${column}=${String(value)}`);
              const rows = (tables[table] ?? []).filter((row) => row[column] === value);
              const result =
                failOn === table ? { data: null, error: { message: "boom" } } : { data: rows, error: null };
              return { limit: () => Promise.resolve(result), order: () => Promise.resolve(result) };
            },
          };
        },
      };
    },
  };
  return { client: fake as unknown as TrackingClient, reads };
}

describe("order tracking lookup", () => {
  test("the right phone sees status steps, lines and total", async () => {
    const { client } = fakeDb({ orders: ORDERS, order_items: ITEMS });
    const result = await lookupTrackedOrder(client, 1042, "+92 300 1234567");
    assert.equal(result.found, true);
    if (!result.found) return;
    assert.equal(result.order.status, "preparing");
    assert.equal(result.order.statusAt, "2026-11-20T10:05:00Z");
    assert.deepEqual(
      result.order.steps.map((step) => [step.key, step.done, step.current]),
      [
        ["received", true, false],
        ["accepted", true, false],
        ["preparing", true, true],
        ["ready", false, false],
        ["out_for_delivery", false, false],
        ["delivered", false, false],
      ]
    );
    assert.deepEqual(result.order.lines, [
      { name: "Gulab Jamun 1 kg", quantity: 1, lineTotal: 1000 },
      { name: "Nimko 200g", quantity: 2, lineTotal: 250 },
    ]);
    assert.equal(result.order.total, 1250);
  });

  test("a wrong phone gets nothing and no order lines are read", async () => {
    const { client, reads } = fakeDb({ orders: ORDERS, order_items: ITEMS });
    assert.deepEqual(await lookupTrackedOrder(client, 1042, "0300 1234568"), { found: false });
    assert.equal(reads.some((read) => read.startsWith("order_items")), false);
  });

  test("an unknown number answers the same as a wrong phone", async () => {
    const { client } = fakeDb({ orders: ORDERS, order_items: ITEMS });
    assert.deepEqual(await lookupTrackedOrder(client, 9999, "0300 1234567"), { found: false });
  });

  test("a cancelled order is shown as cancelled", async () => {
    const { client } = fakeDb({ orders: ORDERS, order_items: [] });
    const result = await lookupTrackedOrder(client, 1043, "03017654321");
    assert.equal(result.found && result.order.cancelled, true);
    assert.equal(result.found && result.order.steps.some((step) => step.done), false);
  });

  test("a phone too short to compare never matches", async () => {
    const { client, reads } = fakeDb({ orders: [{ ...ORDERS[0], phone: "" }], order_items: ITEMS });
    assert.deepEqual(await lookupTrackedOrder(client, 1042, ""), { found: false });
    assert.equal(reads.length, 0);
  });

  test("a database failure comes back as an error", async () => {
    const { client } = fakeDb({ orders: ORDERS }, "orders");
    assert.deepEqual(await lookupTrackedOrder(client, 1042, "03001234567"), { found: false, error: "boom" });
  });
});

describe("tracking helpers", () => {
  test("phones compare on their last 10 digits", () => {
    assert.equal(phoneKey("0300-1234567"), "3001234567");
    assert.equal(phoneKey("+923001234567"), "3001234567");
    assert.equal(phoneKey("12345"), "");
  });

  test("order numbers must be positive whole numbers", () => {
    assert.equal(parseOrderNumber("1042"), 1042);
    assert.equal(parseOrderNumber(7), 7);
    assert.equal(parseOrderNumber("0"), null);
    assert.equal(parseOrderNumber("12a"), null);
    assert.equal(parseOrderNumber("99999999999"), null);
  });

  test("the link the customer gets", () => {
    assert.equal(orderTrackingUrl(1042), "https://www.jallundharmain.com/order/1042");
  });

  test("the saved order number is read back, or null when it can't be", async () => {
    const client = (data: unknown, error: { message: string } | null = null) =>
      ({
        from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data, error }) }) }) }),
      }) as unknown as TrackingClient;
    assert.equal(await savedOrderNumber(client({ order_number: 1042 }), "o-1"), 1042);
    assert.equal(await savedOrderNumber(client(null, { message: "denied" }), "o-1"), null);
  });
});
