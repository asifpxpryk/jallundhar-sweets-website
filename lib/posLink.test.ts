import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { linkedMenuIds, posSafePayload } from "@/lib/posLink";

type Result = { data: unknown; error: { code?: string; message?: string } | null };

function fakeClient(result: Result) {
  return fakeDb(result) as unknown as Parameters<typeof linkedMenuIds>[0] & { calls: { ids: string[] }[] };
}

function fakeDb(result: Result) {
  const calls: { table: string; columns: string; ids: string[] }[] = [];
  return {
    calls,
    from(table: string) {
      return {
        select(columns: string) {
          return {
            in(_column: string, ids: string[]) {
              calls.push({ table, columns, ids });
              return Promise.resolve(result);
            },
          };
        },
      };
    },
  };
}

const ADMIN_SAVE = {
  name: "Nimko 200g (new name)",
  price: 1,
  is_available: false,
  is_hidden: true,
  description: "Crunchy",
  category_id: "general",
  image_url: "/products/nimko.webp",
};

describe("admin save on POS-linked rows", () => {
  test("drops price, available and hidden for a linked row and keeps the rest", () => {
    assert.deepEqual(posSafePayload(ADMIN_SAVE, true), {
      name: "Nimko 200g (new name)",
      description: "Crunchy",
      category_id: "general",
      image_url: "/products/nimko.webp",
    });
  });

  test("keeps every field for a row the POS does not own", () => {
    assert.deepEqual(posSafePayload(ADMIN_SAVE, false), ADMIN_SAVE);
  });

  test("finds which saved ids are linked", async () => {
    const client = fakeClient({
      data: [
        { id: "pos-prd-12", pos_linked: true },
        { id: "item-1", pos_linked: false },
      ],
      error: null,
    });
    const linked = await linkedMenuIds(client, ["pos-prd-12", "item-1", "pos-prd-12", ""]);
    assert.deepEqual([...linked.ids], ["pos-prd-12"]);
    assert.equal(linked.error, "");
    assert.deepEqual(client.calls[0].ids, ["pos-prd-12", "item-1"]);
  });

  test("before the SQL is applied (no pos_linked column) nothing is linked", async () => {
    const client = fakeClient({ data: null, error: { code: "42703", message: "column menu_items.pos_linked does not exist" } });
    assert.deepEqual(await linkedMenuIds(client, ["item-1"]), { ids: new Set(), error: "" });
  });

  test("any other read failure stops the save", async () => {
    const client = fakeClient({ data: null, error: { message: "fetch failed" } });
    assert.equal((await linkedMenuIds(client, ["item-1"])).error, "fetch failed");
  });
});
