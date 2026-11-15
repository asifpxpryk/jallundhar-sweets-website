import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { rateHit } from "@/lib/rateLimit";
import { refreshStorefront } from "@/lib/storefrontRefresh";

export const dynamic = "force-dynamic";

/** The POS bridge calls this after it writes rates, stock or show/hide into menu_items. */
const RATE = { limit: 60, windowMs: 10 * 60_000, lockMs: 10 * 60_000 };
const MIN_SECRET_LENGTH = 32;

function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
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

  await refreshStorefront();
  return NextResponse.json({ ok: true, refreshedAt: new Date().toISOString() });
}
