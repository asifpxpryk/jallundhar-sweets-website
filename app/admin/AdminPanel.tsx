"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem } from "@/lib/types";
import { SECTIONS, isSectionSlug, assignSection } from "@/lib/sections";
import { addMenuItem, logoutAdmin, saveMenuItem, toggleAvailable } from "./actions";

function itemSection(item: MenuItem) {
  if (isSectionSlug(item.category_id)) return item.category_id;
  return assignSection(item.name, item.category_id.split(",").filter(Boolean));
}

export default function AdminPanel({
  items,
  needsSecret,
}: {
  items: MenuItem[];
  needsSecret: boolean;
}) {
  const router = useRouter();
  const [section, setSection] = useState<(typeof SECTIONS)[number]["slug"] | "all">("sweets");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const grouped = useMemo(() => {
    const list = section === "all" ? items : items.filter((item) => itemSection(item) === section);
    return [...list].sort((a, b) => a.sort_order - b.sort_order);
  }, [items, section]);

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(null), 3500);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-maroon-800">Manage menu</h2>
          <p className="text-sm text-maroon-700/70">{items.length} items</p>
        </div>
        <form action={logoutAdmin}>
          <button className="rounded-xl border border-gold-200 bg-white px-3 py-2 text-sm font-medium text-maroon-800">
            Logout
          </button>
        </form>
      </div>

      {needsSecret ? (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-maroon-900">
          Price/availability save karne ke liye <code className="font-mono">.env.local</code> mein{" "}
          <code className="font-mono">SUPABASE_SECRET_KEY</code> add karo — Supabase → API Keys →
          Secret key (publishable nahi). Chat mein mat bhejna. Phir <code>npm run dev</code> restart.
        </div>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-xl bg-maroon-700 px-3 py-2 text-sm text-white">{message}</p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-gold-200 bg-white p-4">
        <h2 className="font-semibold text-maroon-800">Naya item</h2>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-2"
          action={async (formData) => {
            const result = await addMenuItem(formData);
            if (result.error) flash(result.error);
            else {
              flash("Item add ho gaya.");
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
          <select name="category_id" defaultValue="sweets" className="rounded-xl border border-gold-200 px-3 py-2">
            {SECTIONS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <input name="image_url" placeholder="Image URL (optional)" className="rounded-xl border border-gold-200 px-3 py-2" />
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

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
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
        {grouped.map((item) => (
          <li key={item.id} className="rounded-2xl border border-gold-200 bg-white p-4">
            <form
              className="grid gap-3 sm:grid-cols-[1fr_7rem_auto] sm:items-end"
              action={async (formData) => {
                formData.set("id", item.id);
                formData.set("is_available", formData.get("is_available") ? "true" : "false");
                const result = await saveMenuItem(formData);
                if (result.error) flash(result.error);
                else {
                  flash("Save ho gaya.");
                  router.refresh();
                }
              }}
            >
              <label className="text-sm">
                Name
                <input
                  name="name"
                  defaultValue={item.name}
                  className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Price
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={item.price}
                  className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Category
                <select
                  name="category_id"
                  defaultValue={itemSection(item)}
                  className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-2"
                >
                  {SECTIONS.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm sm:col-span-2">
                Description
                <input
                  name="description"
                  defaultValue={item.description ?? ""}
                  className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-2"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  name="is_available"
                  type="checkbox"
                  defaultChecked={item.is_available}
                  className="h-4 w-4"
                />
                Available
              </label>
              <button
                type="submit"
                className="rounded-xl bg-maroon-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Save
              </button>
            </form>
            <button
              type="button"
              disabled={pending || needsSecret}
              className="mt-2 text-sm text-maroon-700 underline disabled:opacity-40"
              onClick={() => {
                startTransition(async () => {
                  const result = await toggleAvailable(item.id, !item.is_available);
                  if (result.error) flash(result.error);
                  else router.refresh();
                });
              }}
            >
              {item.is_available ? "Hide from menu" : "Show on menu"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
