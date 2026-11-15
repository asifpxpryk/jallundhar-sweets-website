/** Copy of every website order to the shop's inbox, sent through Resend (https://resend.com). */

const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_TO = "jallundhar.shahiroad@gmail.com";
/** Resend's shared sender works without a verified domain, but only to the Resend account's own email. */
const DEFAULT_FROM = "Jallundhar Orders <onboarding@resend.dev>";
/** The customer waits on this request before WhatsApp opens, so never hold it long. */
const SEND_TIMEOUT_MS = 5_000;

export type OrderEmail = {
  ref: string;
  customerName: string;
  phone: string;
  address: string;
  location: string;
  paymentMethod: "cod" | "advance";
  notes: string;
  items: { item_name: string; quantity: number; unit_price: number; line_total: number }[];
  total: number;
  saved: boolean;
  /** False when the catalogue could not be read and the browser's prices were taken. */
  pricesChecked: boolean;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rupees(value: number): string {
  return `Rs. ${value.toLocaleString("en-PK")}`;
}

function row(label: string, value: string): string {
  if (!value) return "";
  return `<tr><td style="padding:2px 12px 2px 0;color:#7a4a3a">${label}</td><td style="padding:2px 0">${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`;
}

export function orderEmailSubject(order: OrderEmail): string {
  return `New website order ${order.ref} · ${rupees(order.total)}`;
}

export function orderEmailHtml(order: OrderEmail): string {
  const lines = order.items
    .map(
      (item) =>
        `<tr><td style="padding:4px 8px 4px 0">${escapeHtml(item.item_name)}</td>` +
        `<td style="padding:4px 8px;text-align:center">${item.quantity}</td>` +
        `<td style="padding:4px 0;text-align:right">${rupees(item.line_total)}</td></tr>`
    )
    .join("");
  return [
    `<div style="font-family:Arial,sans-serif;font-size:14px;color:#3b1418">`,
    `<h2 style="margin:0 0 12px">New order ${escapeHtml(order.ref)}</h2>`,
    order.saved ? "" : `<p style="color:#b00020;font-weight:bold">Not saved in the website database.</p>`,
    order.pricesChecked ? "" : `<p style="color:#b00020;font-weight:bold">Prices not checked.</p>`,
    `<table style="border-collapse:collapse;margin-bottom:12px">`,
    row("Name", order.customerName),
    row("Phone", order.phone),
    row("Address", order.address),
    row("Location", order.location),
    row("Payment", order.paymentMethod === "advance" ? "Advance" : "Cash on delivery"),
    row("Notes", order.notes),
    `</table>`,
    `<table style="border-collapse:collapse;min-width:320px">`,
    `<tr><th style="text-align:left;padding:4px 8px 4px 0">Item</th><th style="padding:4px 8px">Qty</th><th style="text-align:right;padding:4px 0">Amount</th></tr>`,
    lines,
    `<tr><td colspan="2" style="padding:8px 8px 0 0;font-weight:bold">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:bold">${rupees(order.total)}</td></tr>`,
    `</table>`,
    `</div>`,
  ].join("");
}

/** Sends the copy; never throws, so a mail problem can't block the order. Returns whether it went. */
export async function sendOrderEmail(order: OrderEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ORDER_EMAIL_FROM?.trim() || DEFAULT_FROM,
        to: [process.env.ORDER_EMAIL_TO?.trim() || DEFAULT_TO],
        subject: orderEmailSubject(order),
        html: orderEmailHtml(order),
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error("Order email failed", response.status, await response.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.error("Order email failed", error);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
