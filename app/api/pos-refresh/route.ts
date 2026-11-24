import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { loadMenuRowsUncached } from "@/lib/loadMenu";
import {
  changedShelves,
  dropOldMenuStates,
  menuChange,
  readMenuState,
  saveMenuState,
  type MenuChange,
  type MenuState,
} from "@/lib/menuFingerprint";
import { menuStateFrom } from "@/lib/posRefreshState";
import { rateHit } from "@/lib/rateLimit";
import { refreshProducts, refreshStorefront } from "@/lib/storefrontRefresh";

export const dynamic = "force-dynamic";

/** The POS bridge calls this after it writes rates, stock or show/hide into menu_items. */
const RATE = { limit: 60, windowMs: 10 * 60_000, lockMs: 10 * 60_000 };
const MIN_SECRET_LENGTH = 32;

function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Null when the rows can't be read or come back empty: the refresh then runs in full. */
async function currentState(): Promise<MenuState | null> {
  try {
    const rows = await loadMenuRowsUncached();
    return rows.length ? await menuStateFrom(rows) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const expected = process.env.POS_REFRESH_SECRET?.trim() || "";
  if (expected.length < MIN_SECRET_LENGTH) {
    return NextResponse.json({ ok: false, error: "Not configured." }, { status: 503 });
  }
  const given = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!sameSecret(given, expected)) {
    return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 401 });
  }

  const limit = await rateHit("pos-refresh", RATE);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many refreshes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  // A full refresh drops every cached page, so only what really moved since the last call is refreshed.
  const state = await currentState();
  const remembered = state ? await readMenuState() : null;
  const change: MenuChange = state
    ? menuChange(state.rows, remembered?.rows ?? null)
    : { kind: "all", reason: "menu rows could not be read" };
  const refreshedAt = new Date().toISOString();

  if (change.kind === "none") {
    console.info("POS refresh: menu unchanged, cached pages kept");
    return NextResponse.json({ ok: true, changed: false, refreshedAt });
  }

  if (change.kind === "products" && state && remembered) {
    const shelves = changedShelves(state.related, remembered.related);
    refreshProducts(change.ids, shelves);
    console.info(
      `POS refresh: ${change.ids.length} product(s) changed; their pages, ${shelves.length} shelf strip(s) and the listings refreshed`
    );
  } else {
    await refreshStorefront();
    console.info(`POS refresh: whole storefront refreshed (${change.kind === "all" ? change.reason : "no earlier copy"})`);
  }
  if (state) {
    await saveMenuState(state);
    await dropOldMenuStates();
  }
  return NextResponse.json({
    ok: true,
    changed: true,
    products: change.kind === "products" ? change.ids.length : "all",
    refreshedAt,
  });
}
