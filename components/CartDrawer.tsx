"use client";

import { trackInitiateCheckout, trackPurchase } from "@/lib/metaPixel";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartContext";
import { DELIVERY_NOTE } from "@/lib/site";
import type { PaymentMethod } from "@/lib/types";
import { loadProfile, saveLocalOrder, saveProfile } from "@/lib/customerStore";

type Step = "cart" | "checkout" | "success";

export default function CartDrawer() {
  const { lines, adjust, remove, subtotal, isOpen, entry, close, clear } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState<string | null>(null);

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    location: "",
    payment_method: "cod" as PaymentMethod,
    notes: "",
  });

  // GPS pin for the rider: only offered where the phone can actually give one.
  const [canLocate, setCanLocate] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  useEffect(() => {
    setCanLocate(typeof navigator !== "undefined" && "geolocation" in navigator && window.isSecureContext);
  }, []);

  function shareLocation() {
    setLocateError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm((f) => ({
          ...f,
          location: `https://maps.google.com/?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`,
        }));
        setLocating(false);
      },
      (problem) => {
        setLocating(false);
        setLocateError(
          problem.code === problem.PERMISSION_DENIED
            ? "Location is blocked for this site. You can still order with your address."
            : "Could not get your location. You can still order with your address."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  const opened = useRef({ isOpen, entry });
  if (opened.current.isOpen !== isOpen || opened.current.entry !== entry) {
    opened.current = { isOpen, entry };
    if (isOpen) {
      const next: Step = entry === "checkout" && lines.length > 0 ? "checkout" : "cart";
      if (step !== next) setStep(next);
    }
  }
  if (isOpen && step === "checkout" && lines.length === 0) {
    setStep("cart");
  }

  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (!isOpen || step !== "checkout") {
      checkoutTracked.current = false;
      return;
    }
    if (checkoutTracked.current || lines.length === 0) return;
    checkoutTracked.current = true;
    trackInitiateCheckout({
      value: subtotal,
      content_ids: lines.map((l) => String(l.id)),
      contents: lines.map((l) => ({
        id: String(l.id),
        quantity: l.quantity,
        item_price: l.price,
      })),
      num_items: lines.reduce((n, l) => n + l.quantity, 0),
    });
  }, [isOpen, step, lines, subtotal]);

  useEffect(() => {
    if (!isOpen) return;
    const profile = loadProfile();
    if (!profile) return;
    setForm((f) => ({
      ...f,
      customer_name: f.customer_name || profile.name,
      phone: f.phone || profile.phone,
      address: f.address || profile.address,
    }));
  }, [isOpen]);

  function handleClose() {
    close();
    if (step === "success") {
      setStep("cart");
    }
  }

  const WHATSAPP_NUMBER = "923001538440";

  function buildWhatsappMessage(orderRef: string) {
    const itemsList = lines
      .map((l) => `• ${l.name} x${l.quantity} — Rs. ${(l.price * l.quantity).toLocaleString()}`)
      .join("\n");

    return [
      `🛍️ *New Order ${orderRef}*`,
      form.customer_name.trim() ? `👤 Name: ${form.customer_name.trim()}` : null,
      `📞 Number: ${form.phone.trim()}`,
      `📍 Address: ${form.address.trim()}`,
      form.location.trim() ? `📌 Location: ${form.location.trim()}` : null,
      "",
      "*Items:*",
      itemsList,
      "",
      `*Subtotal: Rs. ${subtotal.toLocaleString()}*`,
      "Delivery: Rahim Yar Khan. Charge confirmed on this chat.",
      form.notes.trim() ? `\n📝 Notes: ${form.notes.trim()}` : null,
    ]
      .filter((line) => line !== null)
      .join("\n");
  }

  async function placeOrder() {
    setError(null);
    if (!form.phone.trim() || !form.address.trim()) {
      setError("Phone number and address are required.");
      return;
    }
    if (lines.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    // Open a blank tab synchronously (before any await) so browsers don't block it as a popup.
    const waWindow = window.open("", "_blank");

    const orderId = crypto.randomUUID();
    const orderCode = orderId.slice(0, 8).toUpperCase();
    saveLocalOrder({
      id: orderId,
      created_at: new Date().toISOString(),
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      location: form.location.trim(),
      payment_method: form.payment_method,
      notes: form.notes.trim(),
      total: subtotal,
      items: lines.map((l) => ({
        id: l.id,
        name: l.name,
        quantity: l.quantity,
        unit_price: l.price,
      })),
    });
    saveProfile({
      name: form.customer_name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      location: form.location.trim(),
    });

    // The order record goes through our own rate-limited route, never straight to the database.
    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          customer_name: form.customer_name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          location: form.location.trim(),
          payment_method: form.payment_method,
          notes: [form.notes.trim(), `Ref ${orderCode}`].filter(Boolean).join("\n"),
          items: lines.map((l) => ({ name: l.name, quantity: l.quantity, unit_price: l.price })),
        }),
      });
      if (response.status === 429) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        waWindow?.close();
        setError(result?.error || "Too many orders in a short time. Please try again shortly.");
        setSubmitting(false);
        return;
      }
    } catch (e) {
      // Order record save fail bhi ho jaye to bhi WhatsApp order aage bhejna hai,
      // Still send the WhatsApp order even if saving the record fails.
    }

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      buildWhatsappMessage(orderCode)
    )}`;

    if (waWindow) {
      waWindow.location.href = waUrl;
    } else {
      window.open(waUrl, "_blank");
    }

    const purchaseLines = lines.map((l) => ({
      id: String(l.id),
      quantity: l.quantity,
      item_price: l.price,
    }));
    const purchaseValue = subtotal;
    trackPurchase(
      {
        value: purchaseValue,
        currency: "PKR",
        contents: purchaseLines,
        content_ids: purchaseLines.map((l) => l.id),
        num_items: purchaseLines.reduce((n, l) => n + l.quantity, 0),
      },
      { eventID: orderId }
    );
    setOrderRef(orderCode);
    setStep("success");
    clear();
    setSubmitting(false);
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-maroon-950/40 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}
      {/* The clipping frame keeps the parked drawer from making the page wider than the screen. */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <aside
        aria-hidden={!isOpen}
        className={`absolute right-0 top-0 flex h-full w-full max-w-md transform flex-col bg-cream shadow-2xl transition-transform duration-300 ${
          isOpen ? "pointer-events-auto translate-x-0" : "invisible translate-x-full"
        }`}
      >
        <div className="royal-header flex items-center justify-between border-b border-gold-500/40 px-5 py-4">
          <h2 className="font-royal text-xl font-bold text-gold-200">
            {step === "cart" && "Your Cart"}
            {step === "checkout" && "Checkout"}
            {step === "success" && "Order Confirmed"}
          </h2>
          <button onClick={handleClose} className="text-cream/80 hover:text-white" aria-label="Close">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "cart" && (
            <>
              {lines.length === 0 ? (
                <p className="mt-10 text-center text-maroon-700/60">Your cart is empty.</p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {lines.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-maroon-800">{l.name}</p>
                        <p className="text-sm text-maroon-700/60">Rs. {l.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjust(l.id, -1)}
                          className="h-7 w-7 rounded-full border border-gold-300 text-maroon-700"
                        >
                          −
                        </button>
                        <span className="w-5 text-center">{l.quantity}</span>
                        <button
                          onClick={() => adjust(l.id, 1)}
                          className="h-7 w-7 rounded-full border border-gold-300 text-maroon-700"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => remove(l.id)}
                        className="text-xs text-maroon-700/50 underline hover:text-maroon-800"
                      >
                        remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {step === "checkout" && (
            <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
              <ul className="flex flex-col gap-3 rounded-lg bg-white px-3 py-2 text-sm text-maroon-800">
                {lines.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 leading-snug">{l.name}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjust(l.id, -1)}
                        aria-label={`Decrease ${l.name}`}
                        className="h-7 w-7 rounded-full border border-gold-300 text-maroon-700"
                      >
                        −
                      </button>
                      <span className="w-5 text-center">{l.quantity}</span>
                      <button
                        type="button"
                        onClick={() => adjust(l.id, 1)}
                        aria-label={`Increase ${l.name}`}
                        className="h-7 w-7 rounded-full border border-gold-300 text-maroon-700"
                      >
                        +
                      </button>
                    </div>
                    <span className="w-16 shrink-0 text-right">Rs. {(l.price * l.quantity).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              <div>
                <label className="text-sm font-medium text-maroon-800">Name (optional)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gold-200 px-3 py-2 focus:border-maroon-600 focus:outline-none"
                  value={form.customer_name}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-maroon-800">Phone Number</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gold-200 px-3 py-2 focus:border-maroon-600 focus:outline-none"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="03XX XXXXXXX"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-maroon-800">Delivery Address</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-gold-200 px-3 py-2 focus:border-maroon-600 focus:outline-none"
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Full home/office address, Rahim Yar Khan"
                />
              </div>
              {canLocate ? (
                <div>
                  {form.location ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
                      <span className="font-medium">✓ Your location will be sent with the order</span>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, location: "" }))}
                        className="shrink-0 text-xs font-semibold underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={shareLocation}
                      disabled={locating}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-gold-300 bg-white px-3 py-2.5 text-sm font-semibold text-maroon-800 transition hover:bg-gold-50 disabled:opacity-60"
                    >
                      <span aria-hidden>📍</span>
                      {locating ? "Finding your location…" : "Send my current location (optional)"}
                    </button>
                  )}
                  {locateError ? <p className="mt-1 text-xs text-maroon-700/70">{locateError}</p> : null}
                </div>
              ) : null}
              <div>
                <label className="text-sm font-medium text-maroon-800">Notes (optional)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gold-200 px-3 py-2 focus:border-maroon-600 focus:outline-none"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any special instructions"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
          )}

          {step === "success" && (
            <div className="mt-8 flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-100 text-3xl">
                ✅
              </div>
              <p className="text-xl font-bold leading-relaxed text-maroon-800">
                Thank you for your order
              </p>
              {orderRef ? (
                <p className="text-sm font-semibold text-maroon-800">Order {orderRef}</p>
              ) : null}
              <p className="text-base leading-relaxed text-maroon-700/80">
                Contact us on WhatsApp for more details and delivery charges.
              </p>
              <a
                href="https://wa.me/923001538440"
                target="_blank"
                rel="noreferrer"
                dir="ltr"
                className="font-display text-lg font-bold text-maroon-800"
              >
                0300 153 8440
              </a>
            </div>
          )}
        </div>

        {step !== "success" && (
          <div className="border-t border-gold-200 px-5 py-4">
            <p className="mb-3 text-xs leading-relaxed text-maroon-700/70">{DELIVERY_NOTE}</p>
            <div className="mb-3 flex items-center justify-between font-display text-base font-bold text-maroon-800">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            {step === "cart" ? (
              <button
                disabled={lines.length === 0}
                onClick={() => setStep("checkout")}
                className="w-full rounded-full bg-maroon-700 py-3 text-sm font-semibold text-white transition hover:bg-maroon-800 disabled:opacity-40"
              >
                Checkout
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setStep("cart")}
                  className="rounded-full border border-gold-300 px-4 py-3 text-sm font-semibold text-maroon-700"
                >
                  Back
                </button>
                <button
                  onClick={placeOrder}
                  disabled={submitting}
                  className="flex-1 rounded-full bg-gold-500 py-3 text-sm font-semibold text-maroon-900 transition hover:bg-gold-400 disabled:opacity-50"
                >
                  {submitting ? "Preparing your order..." : "Place Order on WhatsApp"}
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
      </div>
    </>
  );
}
