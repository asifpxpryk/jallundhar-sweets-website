import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { menuChanged, menuFingerprint } from "@/lib/menuFingerprint";

const ROWS = [
  { id: "cham-cham", name: "Cham Cham", price: 1200, is_available: true },
  { id: "dry-cake-cup", name: "Cup Cake", price: 45, is_available: true },
];

describe("skipping a POS refresh that changed nothing", () => {
  test("the same rows give the same fingerprint", () => {
    assert.equal(menuFingerprint(ROWS), menuFingerprint(structuredClone(ROWS)));
  });

  test("a new rate, a hidden item or a new row changes it", () => {
    const base = menuFingerprint(ROWS);
    assert.notEqual(menuFingerprint([{ ...ROWS[0], price: 1300 }, ROWS[1]]), base);
    assert.notEqual(menuFingerprint([ROWS[0], { ...ROWS[1], is_available: false }]), base);
    assert.notEqual(menuFingerprint([...ROWS, { id: "new", name: "New", price: 10, is_available: true }]), base);
  });

  test("only a remembered, matching fingerprint counts as unchanged", () => {
    const now = menuFingerprint(ROWS);
    assert.equal(menuChanged(now, now), false);
    assert.equal(menuChanged(now, null), true);
    assert.equal(menuChanged(now, menuFingerprint([ROWS[0]])), true);
  });
});
