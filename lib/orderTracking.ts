/**
 * Customer order tracking: /order/<number> shows an order only to someone who gives the phone
 * number it was placed with. Unknown numbers and wrong phones get the same "not found" answer.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";

export const ORDER_STEPS = [
  { key: "received", label: "Received" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

export type OrderStatus = (typeof ORDER_STEPS)[number]["key"] | "cancelled";

const MAX_ORDER_NUMBER = 2_147_483_647;
/** Phones match on their last 10 digits (0300…, +92300… and 92300… are the same number). */
const PHONE_DIGITS = 10;
const MIN_PHONE_DIGITS = 7;

export type TrackedOrder = {
  number: number;
  status: OrderStatus;
  statusAt: string | null;
  createdAt: string | null;
  cancelled: boolean;
  steps: { key: string; label: string; done: boolean; current: boolean }[];
  lines: { name: string; quantity: number; lineTotal: number }[];
  total: number;
};

export function orderTrackingPath(orderNumber: number): string {
  return `/order/${orderNumber}`;
}

export function orderTrackingUrl(orderNumber: number): string {
  return `${SITE_URL}${orderTrackingPath(orderNumber)}`;
}

/** A positive whole order number, or null. */
export function parseOrderNumber(raw: unknown): number | null {
  const text = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw.trim() : "";
  if (!/^\d{1,10}$/.test(text)) return null;
  const value = Number(text);
  return value >= 1 && value <= MAX_ORDER_NUMBER ? value : null;
}

/** Last 10 digits of a phone number; "" when it has too few digits to compare. */
export function phoneKey(phone: unknown): string {
  const digits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
  if (digits.length < MIN_PHONE_DIGITS) return "";
  return digits.slice(-PHONE_DIGITS);
}

export function samePhone(a: unknown, b: unknown): boolean {
  const left = phoneKey(a);
  return left !== "" && left === phoneKey(b);
}

function knownStatus(value: unknown): OrderStatus {
  if (value === "cancelled") return "cancelled";
  return ORDER_STEPS.some((step) => step.key === value) ? (value as OrderStatus) : "received";
}

type OrderRow = {
  id: string;
  order_number: number;
  phone: string | null;
  status: string | null;
  status_at: string | null;
  created_at: string | null;
  total: number | string | null;
};

type ItemRow = { item_name: string | null; quantity: number | null; line_total: number | string | null };

export function trackedOrder(order: OrderRow, items: ItemRow[]): TrackedOrder {
  const status = knownStatus(order.status);
  const reached = ORDER_STEPS.findIndex((step) => step.key === status);
  return {
    number: Number(order.order_number),
    status,
    statusAt: order.status_at ?? null,
    createdAt: order.created_at ?? null,
    cancelled: status === "cancelled",
    steps: ORDER_STEPS.map((step, index) => ({
      key: step.key,
      label: step.label,
      done: reached >= 0 && index <= reached,
      current: index === reached,
    })),
    lines: items.map((item) => ({
      name: item.item_name ?? "",
      quantity: Number(item.quantity) || 0,
      lineTotal: Number(item.line_total) || 0,
    })),
    total: Number(order.total) || 0,
  };
}

/** The parts of a Supabase client the lookup uses (service key; RLS hides orders from the public key). */
export type TrackingClient = Pick<SupabaseClient, "from">;

const ORDER_COLUMNS = "id, order_number, phone, status, status_at, created_at, total";
/** order_number is a serial; a few rows is plenty even if it was ever reused. */
const MAX_SAME_NUMBER = 5;

export type TrackingLookup = { found: true; order: TrackedOrder } | { found: false; error?: string };

/** Finds the order with this number placed from this phone. Throws nothing; read errors come back as `error`. */
export async function lookupTrackedOrder(
  client: TrackingClient,
  orderNumber: number,
  phone: string
): Promise<TrackingLookup> {
  if (!phoneKey(phone)) return { found: false };
  const orders = await client.from("orders").select(ORDER_COLUMNS).eq("order_number", orderNumber).limit(MAX_SAME_NUMBER);
  if (orders.error) return { found: false, error: orders.error.message || "read failed" };
  const rows = Array.isArray(orders.data) ? (orders.data as OrderRow[]) : [];
  const order = rows.find((row) => samePhone(row.phone, phone));
  if (!order) return { found: false };
  const items = await client
    .from("order_items")
    .select("item_name, quantity, line_total")
    .eq("order_id", order.id)
    .order("item_name", { ascending: true });
  if (items.error) return { found: false, error: items.error.message || "read failed" };
  return { found: true, order: trackedOrder(order, Array.isArray(items.data) ? (items.data as ItemRow[]) : []) };
}

/** The number the database gave a just-saved order; null when it can't be read (e.g. public key). */
export async function savedOrderNumber(client: TrackingClient, orderId: string): Promise<number | null> {
  try {
    const { data, error } = await client.from("orders").select("order_number").eq("id", orderId).maybeSingle();
    if (error || !data) return null;
    return parseOrderNumber((data as { order_number?: unknown }).order_number);
  } catch {
    return null;
  }
}
