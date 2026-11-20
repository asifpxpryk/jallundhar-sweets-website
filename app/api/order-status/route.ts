import { NextResponse } from "next/server";
import { lookupTrackedOrder, parseOrderNumber, phoneKey } from "@/lib/orderTracking";
import { clientIp, rateHit, waitMessage } from "@/lib/rateLimit";
import { createSupabaseAdmin, hasSupabaseSecret } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const MINUTE = 60_000;
/** Per address: 20 lookups in 10 minutes, then a 30 minute pause. */
const PER_IP = { limit: 20, windowMs: 10 * MINUTE, lockMs: 30 * MINUTE };
/** Per order number: 10 tries in 10 minutes, so its phone number can't be guessed. */
const PER_ORDER = { limit: 10, windowMs: 10 * MINUTE, lockMs: 60 * MINUTE };

const ALLOWED_ORIGINS = new Set(["https://www.jallundharmain.com", "https://jallundharmain.com"]);
const BOT_UA = /bot|crawl|spider|slurp|headless|python|curl|wget|scrapy|httpclient|go-http|axios|node-fetch/i;
const NOT_FOUND = "No order with this number and phone.";

function reject(status: number, error: string, headers?: Record<string, string>) {
  return NextResponse.json({ ok: false, error }, { status, headers });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin") || "";
  const local = origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
  if (!ALLOWED_ORIGINS.has(origin) && !local) return reject(403, "Not allowed.");
  if (BOT_UA.test(request.headers.get("user-agent") || "")) return reject(403, "Not allowed.");

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return reject(400, "Bad request.");
  }
  const orderNumber = parseOrderNumber(body.number);
  const phone = typeof body.phone === "string" ? body.phone.slice(0, 30) : "";
  if (!orderNumber) return reject(400, "Bad request.");
  if (!phoneKey(phone)) return reject(400, "Please enter a valid phone number.");

  const limits = await Promise.all([
    rateHit(`track:ip:${clientIp(request.headers)}`, PER_IP),
    rateHit(`track:order:${orderNumber}`, PER_ORDER),
  ]);
  const blocked = limits.find((result) => !result.allowed);
  if (blocked) {
    return reject(429, `Too many tries. Please try again in ${waitMessage(blocked.retryAfterSec)}.`, {
      "Retry-After": String(blocked.retryAfterSec),
    });
  }

  if (!hasSupabaseSecret()) return reject(503, "Order tracking is not available right now.");
  const result = await lookupTrackedOrder(createSupabaseAdmin(), orderNumber, phone);
  if (result.found) {
    return NextResponse.json({ ok: true, order: result.order }, { headers: { "Cache-Control": "no-store" } });
  }
  if (result.error) {
    console.error("Order tracking: read failed", result.error);
    return reject(502, "Could not load the order. Please try again.");
  }
  return reject(404, NOT_FOUND);
}
