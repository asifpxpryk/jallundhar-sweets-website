"use client";

import { useEffect, useState } from "react";
import { loadProfile } from "@/lib/customerStore";
import type { TrackedOrder } from "@/lib/orderTracking";

const WHEN = new Intl.DateTimeFormat("en-PK", {
  timeZone: "Asia/Karachi",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

function when(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : WHEN.format(date);
}

export default function OrderTracker({ orderNumber }: { orderNumber: number }) {
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = loadProfile()?.phone;
    if (saved) setPhone((current) => current || saved);
  }, []);

  async function track(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: orderNumber, phone: phone.trim() }),
      });
      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; order?: TrackedOrder; error?: string }
        | null;
      if (response.ok && result?.order) setOrder(result.order);
      else setError(result?.error || "Could not load the order.");
    } catch {
      setError("Could not load the order.");
    } finally {
      setLoading(false);
    }
  }

  if (order) {
    return (
      <section className="mt-6 rounded-2xl bg-white p-5 shadow-md ring-1 ring-gold-200">
        {order.cancelled ? (
          <p className="text-lg font-bold text-red-700">
            Cancelled <span className="text-sm font-normal text-maroon-700/70">{when(order.statusAt)}</span>
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {order.steps.map((step) => (
              <li key={step.key} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.done ? "bg-maroon-700 text-white" : "bg-gold-50 text-maroon-700/40 ring-1 ring-gold-200"
                  }`}
                >
                  {step.done ? "✓" : ""}
                </span>
                <span className={step.current ? "font-bold text-maroon-900" : step.done ? "text-maroon-800" : "text-maroon-700/50"}>
                  {step.label}
                </span>
                {step.current ? <span className="ml-auto text-xs text-maroon-700/70">{when(order.statusAt)}</span> : null}
              </li>
            ))}
          </ol>
        )}
        <ul className="mt-5 flex flex-col gap-1 border-t border-gold-100 pt-4 text-sm text-maroon-800">
          {order.lines.map((line, index) => (
            <li key={`${line.name}-${index}`} className="flex justify-between gap-3">
              <span>
                {line.name}
                {line.quantity > 1 ? ` x${line.quantity}` : ""}
              </span>
              <span className="shrink-0">Rs. {line.lineTotal.toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between font-display text-base font-bold text-maroon-900">
          <span>Total</span>
          <span>Rs. {order.total.toLocaleString()}</span>
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={track} className="mt-6 flex flex-col gap-3">
      <label className="text-sm font-medium text-maroon-800">
        Phone number
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-maroon-700 py-3 text-sm font-semibold text-white transition hover:bg-maroon-800 disabled:opacity-50"
      >
        {loading ? "Checking…" : "Track order"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
