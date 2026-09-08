"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import BackLink from "@/components/BackLink";
import { loginAccount } from "@/app/account/actions";
import {
  clearProfile,
  loadLocalOrders,
  loadProfile,
  saveProfile,
  type CustomerProfile,
} from "@/lib/customerStore";
import type { SavedOrder } from "@/lib/types";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-maroon-700 px-4 py-3 font-semibold text-white hover:bg-maroon-800 disabled:opacity-60"
    >
      {pending ? "Please wait..." : "Login"}
    </button>
  );
}

export default function AccountScreen() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [form, setForm] = useState<CustomerProfile>({
    name: "",
    phone: "",
    address: "",
    location: "",
  });
  const [pin, setPin] = useState("");
  const [state, action] = useFormState(loginAccount, { error: "", ok: false });

  useEffect(() => {
    const saved = loadProfile();
    if (saved) {
      setProfile(saved);
      setForm(saved);
      setOrders(loadLocalOrders(saved.phone));
    }
  }, []);

  useEffect(() => {
    if (state?.ok && form.phone.trim()) {
      const next = { ...form, phone: form.phone.trim() };
      saveProfile(next);
      setProfile(next);
      setOrders(loadLocalOrders(next.phone));
    }
  }, [state, form]);

  function logoutCustomer() {
    clearProfile();
    setProfile(null);
    setPin("");
  }

  function useGps() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const location = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
      setForm((f) => ({ ...f, location }));
    });
  }

  if (profile) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="flex-1 font-display text-2xl font-bold text-maroon-800">Account</h1>
          <BackLink />
        </div>
        <div className="mt-6 rounded-2xl border border-gold-200 bg-white p-5">
          <p className="font-display font-semibold text-maroon-800">{profile.name || "Customer"}</p>
          <p className="text-sm text-maroon-700">{profile.phone}</p>
          <p className="text-sm text-maroon-700">{profile.address}</p>
          {profile.location ? <p className="text-sm text-maroon-700">{profile.location}</p> : null}
          <button
            type="button"
            onClick={logoutCustomer}
            className="mt-4 rounded-xl border border-gold-200 px-3 py-2 text-sm font-medium text-maroon-800"
          >
            Logout
          </button>
        </div>

        <h2 className="mt-8 font-display text-lg font-bold text-maroon-800">Your orders</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-maroon-700/70">Is phone par abhi koi order save nahi.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((order) => (
              <li key={order.id} className="rounded-2xl border border-gold-200 bg-white p-4 text-sm">
                <p className="font-semibold text-maroon-800">
                  {new Date(order.created_at).toLocaleString()} · Rs. {order.total.toLocaleString()}
                </p>
                <ul className="mt-2 text-maroon-700">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <h1 className="flex-1 font-display text-2xl font-bold text-maroon-800">Account</h1>
        <BackLink />
      </div>
      <p className="mt-2 text-sm text-maroon-700/70">
        Phone se login karo. Shop owner PIN daalein to admin khulega.
      </p>
      <form action={action} className="mt-6 max-w-md space-y-3 rounded-2xl border border-gold-200 bg-white p-5">
        <input type="hidden" name="name" value={form.name} />
        <input type="hidden" name="address" value={form.address} />
        <input type="hidden" name="location" value={form.location} />
        <label className="block text-sm font-medium text-maroon-800">
          Naam
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-maroon-800">
          Phone
          <input
            name="phone"
            required={!pin}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-2"
            placeholder="03XX XXXXXXX"
          />
        </label>
        <label className="block text-sm font-medium text-maroon-800">
          Address
          <textarea
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            rows={2}
            className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-maroon-800">
          Location
          <div className="mt-1 flex gap-2">
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full rounded-xl border border-gold-200 px-3 py-2"
              placeholder="Area / GPS"
            />
            <button
              type="button"
              onClick={useGps}
              className="shrink-0 rounded-xl border border-gold-200 px-3 py-2 text-sm"
            >
              GPS
            </button>
          </div>
        </label>
        <label className="block text-sm font-medium text-maroon-800">
          PIN <span className="font-normal text-maroon-700/60">(admin only)</span>
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-2"
          />
        </label>
        {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
        <Submit />
      </form>
    </section>
  );
}
