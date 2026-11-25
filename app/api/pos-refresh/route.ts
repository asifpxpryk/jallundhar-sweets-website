import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { loadListingRows, loadMenuRowsByIdsUncached, loadMenuRowsUncached } from "@/lib/loadMenu";
import {
  changedShelves,
  dropOldMenuStates,
  menuChange,
  readMenuState,
  saveMenuState,
  type MenuChange,
  type MenuState,
} from "@/lib/menuFingerprint";
import {
  mergeListingRows,
  mergePartialState,
  parseRefreshBody,
  parseRefreshIds,
  partialBlocker,
  partialMenuChange,
} from "@/lib/posRefreshPartial";
import { menuStateFrom, rowSignatures } from "@/lib/posRefreshState";
import { relatedSignatures } from "@/lib/relatedProducts";
import { isVisibilityConfigId } from "@/lib/storeVisibility";
import type { MenuItem } from "@/lib/types";
import { rateHit } from "@/lib/rateLimit";
import { readCpuSaver } from "@/lib/cpuSaver";
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

/** The ids the POS bridge named in the body, or null for a full refresh (no body, or anything unexpected). */
async function namedIds(request: Request): Promise<string[] | null> {
  try {
    return parseRefreshIds(parseRefreshBody(await request.text()), isVisibilityConfigId);
  } catch {
    return null;
  }
}

type Outcome = { changed: false } | { changed: true; products: number | "all" };

/**
 * Only the named rows are read; the "related" strips are worked out from the listings' cached rows with
 * those rows swapped in (read before anything is refreshed below). Returns why it could not decide,
 * so the caller runs the full compare instead: nothing is refreshed or saved in that case.
 */
async function partialRefresh(ids: string[], remembered: MenuState): Promise<Outcome | { fallback: string }> {
  let listing: MenuItem[];
  let fresh: MenuItem[];
  try {
    listing = await loadListingRows();
    fresh = await loadMenuRowsByIdsUncached(ids);
  } catch {
    return { fallback: "named rows could not be read" };
  }
  if (!listing.length) return { fallback: "no listing rows" };
  const freshRows = rowSignatures(fresh);
  const change = partialMenuChange(ids, freshRows, remembered.rows);
  if (change.kind === "none") {
    console.info(`POS refresh: partial, ${ids.length} id(s), nothing changed; cached pages kept`);
    return { changed: false };
  }
  if (change.kind !== "products") return { fallback: change.reason };
  let related: Record<string, string>;
  try {
    related = await relatedSignatures(mergeListingRows(listing, ids, fresh), "cached");
  } catch {
    return { fallback: "related strips could not be worked out" };
  }
  const shelves = changedShelves(related, remembered.related);
  refreshProducts(change.ids, shelves);
  console.info(
    `POS refresh: partial, ${ids.length} id(s); ${change.ids.length} product(s) changed, their pages, ${shelves.length} shelf strip(s) and the listings refreshed`
  );
  await saveMenuState(mergePartialState(remembered, ids, freshRows, related));
  return { changed: true, products: change.ids.length };
}

/** The whole menu is read and compared with the saved copy (the only path before the bridge named its rows). */
async function fullRefresh(remembered: MenuState | null, why: string): Promise<Outcome> {
  const state = await currentState();
  const change: MenuChange = state
    ? menuChange(state.rows, remembered?.rows ?? null)
    : { kind: "all", reason: "menu rows could not be read" };

  if (change.kind === "none") {
    console.info(`POS refresh: full (${why}), menu unchanged, cached pages kept`);
    // Saved anyway: the time of this full compare lets the next named refreshes run partial.
    if (state) await saveMenuState(state);
    return { changed: false };
  }

  if (change.kind === "products" && state && remembered) {
    const shelves = changedShelves(state.related, remembered.related);
    refreshProducts(change.ids, shelves);
    console.info(
      `POS refresh: full (${why}); ${change.ids.length} product(s) changed, their pages, ${shelves.length} shelf strip(s) and the listings refreshed`
    );
  } else {
    await refreshStorefront();
    console.info(`POS refresh: full (${why}), whole storefront refreshed (${change.kind === "all" ? change.reason : "no earlier copy"})`);
  }
  if (state) {
    await saveMenuState(state);
    await dropOldMenuStates();
  }
  return { changed: true, products: change.kind === "products" ? change.ids.length : "all" };
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

  // CPU saver (lib/cpuSaver.ts, switched in /account): nothing is read or rebuilt. Answered as a
  // success so the bridge does not retry.
  const saver = await readCpuSaver();
  if (saver.on) {
    return NextResponse.json({ ok: true, changed: false, paused: true, refreshedAt: new Date().toISOString() });
  }

  const limit = await rateHit("pos-refresh", RATE);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many refreshes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  // A full refresh drops every cached page, so only what really moved since the last call is refreshed.
  // When the bridge names the rows it wrote, only those rows are read; otherwise the whole menu is.
  const ids = await namedIds(request);
  const remembered = await readMenuState();
  let why = ids ? partialBlocker(remembered, Date.now()) : "no ids named";
  // Changes the bridge sent while the saver was on were dropped, so the first refresh after it compares everything.
  if (!why && saver.changedAt && remembered?.checkedAt && Date.parse(saver.changedAt) > Date.parse(remembered.checkedAt)) {
    why = "CPU saver was on";
  }
  let outcome: Outcome | null = null;
  if (ids && remembered && !why) {
    const partial = await partialRefresh(ids, remembered);
    if ("fallback" in partial) why = partial.fallback;
    else outcome = partial;
  }
  if (!outcome) outcome = await fullRefresh(remembered, why ?? "unknown");

  const refreshedAt = new Date().toISOString();
  return NextResponse.json(outcome.changed ? { ok: true, changed: true, products: outcome.products, refreshedAt } : { ok: true, changed: false, refreshedAt });
}
