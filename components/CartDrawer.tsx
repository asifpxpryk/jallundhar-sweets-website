"use client";

import { useState } from "react";
import { useCart } from "./CartContext";
import { supabase } from "@/lib/supabase";
import type { PaymentMethod } from "@/lib/types";

type Step = "cart" | "checkout" | "success";

export default function CartDrawer() {
  const { lines, setQuantity, remove, subtotal, isOpen, close, clear } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    payment_method: "cod" as PaymentMethod,
    notes: "",
  });

  function handleClose() {
    close();
    if (step === "success") {
      setStep("cart");
    }
  }

  const WHATSAPP_NUMBER = "923001538440";

  function buildWhatsappMessage(orderNo: number | null) {
    const itemsList = lines
      .map((l) => `• ${l.name} x${l.quantity} — Rs. ${(l.price * l.quantity).toLocaleString()}`)
      .join("\n");

    return [
      `🛍️ *Naya Order${orderNo ? " #" + orderNo : ""}*`,
      form.customer_name.trim() ? `👤 Naam: ${form.customer_name.trim()}` : null,
      `📞 Number: ${form.phone.trim()}`,
      `📍 Address: ${form.address.trim()}`,
      `💳 Payment: ${form.payment_method === "cod" ? "Cash on Delivery" : "Advance Payment"}`,
      "",
      "*Items:*",
      itemsList,
      "",
      `*Subtotal: Rs. ${subtotal.toLocaleString()}*`,
      form.notes.trim() ? `\n📝 Notes: ${form.notes.trim()}` : null,
    ]
      .filter((line) => line !== null)
      .join("\n");
  }

  async function placeOrder() {
    setError(null);
    if (!form.phone.trim() || !form.address.trim()) {
      setError("Phone number aur address zaroori hain.");
      return;
    }
    if (lines.length === 0) {
      setError("Cart khali hai.");
      return;
    }

    setSubmitting(true);
    // Open a blank tab synchronously (before any await) so browsers don't block it as a popup.
    const waWindow = window.open("", "_blank");

    let orderNo: number | null = null;
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: form.customer_name.trim() || null,
          phone: form.phone.trim(),
          address: form.address.trim(),
          payment_method: form.payment_method,
          notes: form.notes.trim() || null,
          subtotal,
          total: subtotal,
        })
        .select("id, order_number")
        .single();

      if (!orderError && order) {
        orderNo = order.order_number;
        const itemRows = lines.map((l) => ({
          order_id: order.id,
          item_name: l.name,
          quantity: l.quantity,
          unit_price: l.price,
          line_total: l.price * l.quantity,
        }));
        await supabase.from("order_items").insert(itemRows);
      }
    } catch (e) {
      // Order record save fail bhi ho jaye to bhi WhatsApp order aage bhejna hai,
      // taake customer ka order kahin loose na ho.
    }

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      buildWhatsappMessage(orderNo)
    )}`;

    if (waWindow) {
      waWindow.location.href = waUrl;
    } else {
      window.open(waUrl, "_blank");
    }

    setOrderNumber(orderNo);
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
      <aside
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md transform flex-col bg-cream shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "pointer-events-none invisible translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gold-200 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-maroon-800">
            {step === "cart" && "Your Cart"}
            {step === "checkout" && "Checkout"}
            {step === "success" && "Order Confirmed"}
          </h2>
          <button onClick={handleClose} className="text-maroon-700 hover:text-maroon-900" aria-label="Close">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "cart" && (
            <>
              {lines.length === 0 ? (
                <p className="mt-10 text-center text-maroon-700/60">Aap ka cart khali hai.</p>
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
                          onClick={() => setQuantity(l.id, l.quantity - 1)}
                          className="h-7 w-7 rounded-full border border-gold-300 text-maroon-700"
                        >
                          −
                        </button>
                        <span className="w-5 text-center">{l.quantity}</span>
                        <button
                          onClick={() => setQuantity(l.id, l.quantity + 1)}
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
              <div>
                <label className="text-sm font-medium text-maroon-800">Naam (optional)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gold-200 px-3 py-2 focus:border-maroon-600 focus:outline-none"
                  value={form.customer_name}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                  placeholder="Aap ka naam"
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
                  placeholder="Ghar/office ka pura pata, Rahim Yar Khan"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-maroon-800">Payment Method</label>
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, payment_method: "cod" }))}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                      form.payment_method === "cod"
                        ? "border-maroon-700 bg-maroon-700 text-white"
                        : "border-gold-200 text-maroon-700"
                    }`}
                  >
                    Cash on Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, payment_method: "advance" }))}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                      form.payment_method === "advance"
                        ? "border-maroon-700 bg-maroon-700 text-white"
                        : "border-gold-200 text-maroon-700"
                    }`}
                  >
                    Advance Payment
                  </button>
                </div>
                {form.payment_method === "advance" && (
                  <p className="mt-2 rounded-lg bg-gold-50 p-3 text-xs text-maroon-700">
                    Order confirm hone ke baad hamari team aap ko JazzCash/EasyPaisa/Bank
                    details WhatsApp/call par bhejegi taake aap advance payment kar sakein.
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-maroon-800">Notes (optional)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gold-200 px-3 py-2 focus:border-maroon-600 focus:outline-none"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Koi khaas hidayat"
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
              <p className="font-display text-lg font-bold text-maroon-800">
                Shukriya!{orderNumber ? ` Order #${orderNumber}` : " Aap ka order"} tayyar hai.
              </p>
              <p className="text-sm text-maroon-700/70">
                WhatsApp ek nayi tab mein khul gaya hai, order details wahan pehle se likhi hain
                — bas <span className="font-semibold">Send</span> daba kar order confirm kar
                dein. Agar tab nahi khula to hamein seedha call/WhatsApp karein: 0300 153 8440.
              </p>
            </div>
          )}
        </div>

        {step !== "success" && (
          <div className="border-t border-gold-200 px-5 py-4">
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
                  {submitting ? "Order tayyar ho raha hai..." : "Place Order on WhatsApp"}
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
