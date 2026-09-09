"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminOrder, MenuItem } from "@/lib/types";
import { SECTIONS, isSectionSlug, assignSection, normalizeName } from "@/lib/sections";
import { addMenuItem } from "./actions";
import AdminItemForm from "./AdminItemForm";
import AdminNav from "./AdminNav";
import PhotoPicker from "./PhotoPicker";
import { defaultPlacementKey } from "@/lib/itemPlacement";
import PlacementFields from "./PlacementFields";
import { withCompressedPhoto } from "@/lib/compressImage";

function itemSection(item: MenuItem) {
  if (isSectionSlug(item.category_id)) return item.category_id;
  return assignSection(item.name, item.category_id.split(",").filter(Boolean));
}

export default function AdminPanel({
  items,
  orders,
  needsSecret,
  itemAisleKeys = {},
}: {
  items: MenuItem[];
  orders: AdminOrder[];
  needsSecret: boolean;
  itemAisleKeys?: Record<string, string>;
}) {
  const router = useRouter();
  const [section, setSection] = useState<(typeof SECTIONS)[number]["slug"] | "all">("sweets");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const q = normalizeName(query);
    const tokens = q.split(/\s+/).filter(Boolean);
    let list = items;
    if (!tokens.length && section !== "all") {
      list = items.filter((item) => itemSection(item) === section);
    }
    if (tokens.length) {
      list = items.filter((item) => {
        const hay = normalizeName(`${item.name} ${item.description ?? ""}`);
        return tokens.every((token) => hay.includes(token));
      });
    }
    return [...list].sort((a, b) => a.sort_order - b.sort_order);
  }, [items, section, query]);

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(null), 3500);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <AdminNav active="menu" />
      <div className="mt-4">
        <h2 className="font-display text-xl font-bold text-maroon-800">Manage menu</h2>
        <p className="text-sm text-maroon-700/70">{items.length} items</p>
      </div>

      {needsSecret ? (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-maroon-900">
          Add <code className="font-mono">SUPABASE_SECRET_KEY</code> in{" "}
          <code className="font-mono">.env.local</code> to save price and availability — Supabase → API
          Keys → Secret key (not the publishable key). Do not send it in chat. Then restart{" "}
          <code className="font-mono">npm run dev</code>.
        </div>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-xl bg-maroon-700 px-3 py-2 text-sm text-white">{message}</p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-gold-200 bg-white p-4">
        <h2 className="font-semibold text-maroon-800">New item</h2>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-2"
          action={async (formData) => {
            await withCompressedPhoto(formData);
            const result = await addMenuItem(formData);
            if (result.error) flash(result.error);
            else {
              flash("Item added.");
              router.refresh();
            }
          }}
        >
          <input name="name" required placeholder="Name" className="rounded-xl border border-gold-200 px-3 py-2" />
          <input
            name="price"
            type="number"
            min="0"
            step="1"
            required
            placeholder="Price (Rs)"
            className="rounded-xl border border-gold-200 px-3 py-2"
          />
          <PlacementFields defaultSection="sweets" defaultAisle="" />
          <PhotoPicker />
          <input
            name="description"
            placeholder="Description (optional)"
            className="rounded-xl border border-gold-200 px-3 py-2 sm:col-span-2"
          />
          <button
            type="submit"
            className="rounded-xl bg-maroon-700 px-4 py-2 font-semibold text-white sm:col-span-2"
          >
            Add item
          </button>
        </form>
      </section>

      <label className="mt-6 block text-sm text-maroon-800">
        Search menu
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Egg, barfi, pizza..."
          autoComplete="off"
          className="mt-1 w-full rounded-xl border border-gold-200 bg-white px-3 py-2.5 text-maroon-800 outline-none placeholder:text-maroon-700/40 focus:border-maroon-500"
        />
      </label>
      <p className="mt-2 text-sm text-maroon-700/70">
        {query.trim()
          ? `${grouped.length} matching item${grouped.length === 1 ? "" : "s"}`
          : `${grouped.length} items`}
      </p>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSection("all")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
            section === "all" ? "bg-maroon-700 text-white" : "bg-white text-maroon-800"
          }`}
        >
          All
        </button>
        {SECTIONS.map((s) => (
          <button
            key={s.slug}
            onClick={() => setSection(s.slug)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
              section === s.slug ? "bg-maroon-700 text-white" : "bg-white text-maroon-800"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {grouped.length === 0 ? (
          <li className="rounded-2xl border border-gold-200 bg-white p-4 text-sm text-maroon-700/70">
            No items found.
          </li>
        ) : (
          grouped.map((item) => (
            <li key={item.id} className="rounded-2xl border border-gold-200 bg-white p-4">
              <AdminItemForm
                item={item}
                placementKey={itemAisleKeys[item.id] || defaultPlacementKey(item)}
              />
            </li>
          ))
        )}
      </ul>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-maroon-800">All orders</h2>
        <p className="text-sm text-maroon-700/70">{orders.length} records</p>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-maroon-700/70">
            No orders yet, or the orders table / secret key is missing. SQL: data/orders.sql
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((order) => (
              <li key={order.id} className="rounded-2xl border border-gold-200 bg-white p-4 text-sm">
                <p className="font-semibold text-maroon-800">
                  {order.order_number ? `#${order.order_number} · ` : ""}
                  {order.customer_name || "Customer"} · {order.phone}
                </p>
                <p className="text-maroon-700/70">{order.address}</p>
                {order.location ? <p className="text-maroon-700/70">{order.location}</p> : null}
                <p className="mt-1 text-maroon-700">Rs. {order.total.toLocaleString()}</p>
                <ul className="mt-2 text-maroon-700/80">
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
    </div>
  );
}
