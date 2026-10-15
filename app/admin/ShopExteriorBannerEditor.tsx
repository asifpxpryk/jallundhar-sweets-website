"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { saveShopExteriorText } from "./actions";
import type { ShopExteriorText } from "@/lib/shopExteriorBanner";

export default function ShopExteriorBannerEditor({ initialText }: { initialText: ShopExteriorText }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const result = await saveShopExteriorText(new FormData(event.currentTarget));
    setSaving(false);
    setMessage(result.error || "Banner text saved.");
    if (!result.error) router.refresh();
  }

  const inputClass = "mt-1 w-full rounded-xl border border-gold-200 bg-white px-3 py-2 text-sm text-maroon-900";

  return (
    <section className="mt-6 rounded-2xl border border-gold-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="font-display text-xl font-bold text-maroon-900">Shop exterior banner</h2>
      <p className="mt-1 text-sm text-maroon-700/70">Full width on the home page, just after Our Bestsellers. The photo stays fixed; only the text below can be changed.</p>
      <div className="relative mt-4 aspect-[16/7] overflow-hidden rounded-xl bg-maroon-900">
        <Image src="/images/shop-exterior.webp" alt="Jallundhar shop exterior" fill sizes="(min-width: 896px) 896px, 100vw" unoptimized className="object-cover" />
      </div>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-maroon-800">Small line
          <input name="eyebrow" defaultValue={initialText.eyebrow} maxLength={80} className={inputClass} />
        </label>
        <label className="text-sm font-semibold text-maroon-800">Heading
          <input name="heading" defaultValue={initialText.heading} maxLength={120} required className={inputClass} />
        </label>
        <label className="text-sm font-semibold text-maroon-800 sm:col-span-2">Description
          <textarea name="description" defaultValue={initialText.description} maxLength={240} rows={2} className={inputClass} />
        </label>
        <label className="text-sm font-semibold text-maroon-800">Button text
          <input name="buttonLabel" defaultValue={initialText.buttonLabel} maxLength={50} className={inputClass} />
        </label>
        <div className="flex items-end">
          <button type="submit" disabled={saving} className="min-h-10 rounded-xl bg-maroon-800 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save banner text"}</button>
        </div>
        {message ? <p role="status" className={`text-sm sm:col-span-2 ${message === "Banner text saved." ? "text-emerald-700" : "text-red-700"}`}>{message}</p> : null}
      </form>
    </section>
  );
}
