import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { clientIp, rateHit, waitMessage } from "@/lib/rateLimit";
import { createSupabaseAdmin, hasSupabaseSecret } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const MINUTE = 60_000;
/** Per address: 5 orders in 10 minutes, then a 30 minute pause. */
const PER_IP = { limit: 5, windowMs: 10 * MINUTE, lockMs: 30 * MINUTE };
/** Per phone number: 6 orders an hour. */
const PER_PHONE = { limit: 6, windowMs: 60 * MINUTE, lockMs: 60 * MINUTE };
/** Whole site: 120 orders in 10 minutes means a flood, pause order saving for 10 minutes. */
const GLOBAL = { limit: 120, windowMs: 10 * MINUTE, lockMs: 10 * MINUTE };

const ALLOWED_ORIGINS = new Set(["https://www.jallundharmain.com", "https://jallundharmain.com"]);
const BOT_UA = /bot|crawl|spider|slurp|headless|python|curl|wget|scrapy|httpclient|go-http|axios|node-fetch/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function reject(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function orderClient() {
  if (hasSupabaseSecret()) return createSupabaseAdmin();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
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

  const id = text(body.id, 40);
  const phone = text(body.phone, 30);
  const phoneDigits = phone.replace(/\D/g, "");
  const address = text(body.address, 400);
  const paymentMethod = body.payment_method === "advance" ? "advance" : "cod";
  if (!UUID.test(id)) return reject(400, "Bad request.");
  if (phoneDigits.length < 7 || phoneDigits.length > 15) return reject(400, "Please enter a valid phone number.");
  if (!address) return reject(400, "Address is required.");

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0 || rawItems.length > 150) return reject(400, "Bad request.");
  const items: { item_name: string; quantity: number; unit_price: number; line_total: number }[] = [];
  for (const raw of rawItems) {
    if (!raw || typeof raw !== "object") return reject(400, "Bad request.");
    const row = raw as Record<string, unknown>;
    const name = text(row.name, 200);
    const quantity = Number(row.quantity);
    const price = Number(row.unit_price);
    if (!name || !Number.isInteger(quantity) || quantity < 1 || quantity > 500) return reject(400, "Bad request.");
    if (!Number.isFinite(price) || price < 0 || price > 1_000_000) return reject(400, "Bad request.");
    items.push({ item_name: name, quantity, unit_price: price, line_total: price * quantity });
  }
  const total = items.reduce((sum, item) => sum + item.line_total, 0);

  const ip = clientIp(request.headers);
  const limits = await Promise.all([
    rateHit(`order:ip:${ip}`, PER_IP),
    rateHit(`order:phone:${phoneDigits}`, PER_PHONE),
    rateHit("order:all", GLOBAL),
  ]);
  const blocked = limits.find((result) => !result.allowed);
  if (blocked) {
    return NextResponse.json(
      {
        ok: false,
        limited: true,
        error: `Too many orders in a short time. Please try again in ${waitMessage(blocked.retryAfterSec)}, or call us.`,
      },
      { status: 429, headers: { "Retry-After": String(blocked.retryAfterSec) } }
    );
  }

  const supabase = orderClient();
  if (!supabase) return reject(503, "Order saving is not configured.");

  const notes = text(body.notes, 1000);
  const { error } = await supabase.from("orders").insert({
    id,
    customer_name: text(body.customer_name, 120) || null,
    phone,
    address,
    location: text(body.location, 300) || null,
    payment_method: paymentMethod,
    notes: notes || null,
    subtotal: total,
    total,
  });
  if (error) return reject(502, "Could not save the order.");
  await supabase.from("order_items").insert(items.map((item) => ({ order_id: id, ...item })));

  return NextResponse.json({ ok: true });
}
