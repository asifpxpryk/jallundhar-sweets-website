"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SECTIONS } from "@/lib/sections";
import { GENERAL_AISLES } from "@/lib/generalAisles";
import { BEVERAGE_AISLES } from "@/lib/beverageAisles";
import { BAKERY_AISLES } from "@/lib/bakeryAisles";
import type { StoreVisibility } from "@/lib/storeVisibility";
import { setCategoryHidden } from "./actions";
import AdminNav from "./AdminNav";

export default function AdminCategoryVisibility({
  visibility,
}: {
  visibility: StoreVisibility;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const hiddenSections = new Set(visibility.hiddenSections);
  const hiddenAisles = new Set(visibility.hiddenAisles);

  async function toggle(kind: "section" | "aisle", slug: string, currentlyHidden: boolean) {
    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("slug", slug);
    formData.set("hidden", currentlyHidden ? "false" : "true");
    const result = await setCategoryHidden(formData);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage(currentlyHidden ? "Category is now visible." : "Category is now hidden.");
    router.refresh();
    setTimeout(() => setMessage(null), 3500);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <AdminNav active="categories" />
      <div className="mt-4">
        <h2 className="font-display text-xl font-bold text-maroon-800">Categories show / hide</h2>
        <p className="text-sm text-maroon-700/70">
          Hidden categories disappear from the storefront. Items are not deleted.
        </p>
      </div>
      {message ? <p className="mt-3 rounded-xl bg-maroon-700 px-3 py-2 text-sm text-white">{message}</p> : null}

      <section className="mt-6 rounded-2xl border border-gold-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-maroon-800">Main menu</h3>
        <ul className="mt-2 space-y-2">
          {SECTIONS.map((section) => {
            const hidden = hiddenSections.has(section.slug);
            return (
              <li key={section.slug} className="flex items-center justify-between gap-3 rounded-xl border border-gold-100 px-3 py-2">
                <span className="text-sm text-maroon-800">
                  {section.name}
                  {hidden ? <span className="ml-2 text-xs text-maroon-700/60">hidden</span> : null}
                </span>
                <button
                  type="button"
                  onClick={() => toggle("section", section.slug, hidden)}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    hidden ? "bg-maroon-700 text-white" : "border border-gold-200 bg-white text-maroon-800"
                  }`}
                >
                  {hidden ? "Show" : "Hide"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-4 rounded-2xl border border-gold-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-maroon-800">General aisles</h3>
        <ul className="mt-2 space-y-2">
          {GENERAL_AISLES.map((aisle) => {
            const hidden = hiddenAisles.has(aisle.slug);
            return (
              <li key={aisle.slug} className="flex items-center justify-between gap-3 rounded-xl border border-gold-100 px-3 py-2">
                <span className="text-sm text-maroon-800">
                  {aisle.name}
                  {hidden ? <span className="ml-2 text-xs text-maroon-700/60">hidden</span> : null}
                </span>
                <button
                  type="button"
                  onClick={() => toggle("aisle", aisle.slug, hidden)}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    hidden ? "bg-maroon-700 text-white" : "border border-gold-200 bg-white text-maroon-800"
                  }`}
                >
                  {hidden ? "Show" : "Hide"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-4 rounded-2xl border border-gold-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-maroon-800">Bakery aisles</h3>
        <ul className="mt-2 space-y-2">
          {BAKERY_AISLES.map((aisle) => {
            const hidden = hiddenAisles.has(aisle.slug);
            return (
              <li key={aisle.slug} className="flex items-center justify-between gap-3 rounded-xl border border-gold-100 px-3 py-2">
                <span className="text-sm text-maroon-800">
                  {aisle.name}
                  {hidden ? <span className="ml-2 text-xs text-maroon-700/60">hidden</span> : null}
                </span>
                <button
                  type="button"
                  onClick={() => toggle("aisle", aisle.slug, hidden)}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    hidden ? "bg-maroon-700 text-white" : "border border-gold-200 bg-white text-maroon-800"
                  }`}
                >
                  {hidden ? "Show" : "Hide"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-4 rounded-2xl border border-gold-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-maroon-800">Beverage aisles</h3>
        <ul className="mt-2 space-y-2">
          {BEVERAGE_AISLES.map((aisle) => {
            const hidden = hiddenAisles.has(aisle.slug);
            return (
              <li key={aisle.slug} className="flex items-center justify-between gap-3 rounded-xl border border-gold-100 px-3 py-2">
                <span className="text-sm text-maroon-800">
                  {aisle.name}
                  {hidden ? <span className="ml-2 text-xs text-maroon-700/60">hidden</span> : null}
                </span>
                <button
                  type="button"
                  onClick={() => toggle("aisle", aisle.slug, hidden)}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    hidden ? "bg-maroon-700 text-white" : "border border-gold-200 bg-white text-maroon-800"
                  }`}
                >
                  {hidden ? "Show" : "Hide"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
