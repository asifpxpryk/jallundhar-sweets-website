"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { BannerOption, BannerPageOption } from "@/lib/bannerCatalog";
import { saveBannerPages } from "./actions";
import AdminNav from "./AdminNav";
import ShopExteriorBannerEditor from "./ShopExteriorBannerEditor";
import type { ShopExteriorText } from "@/lib/shopExteriorBanner";

function selectedPages(banner: BannerOption, bannerPages: Record<string, string[]>) {
  return Object.prototype.hasOwnProperty.call(bannerPages, banner.id)
    ? bannerPages[banner.id]
    : [banner.defaultPage];
}

function BannerRow({
  banner,
  pageOptions,
  initialPages,
}: {
  banner: BannerOption;
  pageOptions: BannerPageOption[];
  initialPages: string[];
}) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const pageByPath = new Map(pageOptions.map((page) => [page.path, page]));
  const dirty = pages.length !== initialPages.length || pages.some((page) => !initialPages.includes(page));

  async function save() {
    setBusy(true);
    setMessage("");
    const formData = new FormData();
    formData.set("id", banner.id);
    for (const page of pages) formData.append("pages", page);
    const result = await saveBannerPages(formData);
    setBusy(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  return (
    <li className="rounded-2xl border border-gold-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gold-50">
          <Image src={banner.image} alt="" fill sizes="64px" unoptimized className="object-contain" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-maroon-700/60">{banner.source}</p>
          <h3 className="font-display text-base font-bold text-maroon-900">{banner.title}</h3>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {pages.length ? pages.map((path) => (
          <span key={path} className="inline-flex items-center gap-1 rounded-full bg-gold-50 px-3 py-1 text-xs font-medium text-maroon-800 ring-1 ring-gold-200">
            {pageByPath.get(path)?.label ?? path}
            <button
              type="button"
              disabled={busy}
              onClick={() => { setPages((current) => current.filter((page) => page !== path)); setMessage(""); }}
              aria-label={`Remove ${banner.title} from ${pageByPath.get(path)?.label ?? path}`}
              className="ml-1 rounded-full px-1 hover:bg-gold-200"
            >
              ×
            </button>
          </span>
        )) : <p className="text-xs text-maroon-700/60">Not shown on any page.</p>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          aria-label={`Add ${banner.title} to a page`}
          value=""
          disabled={busy}
          onChange={(event) => {
            const path = event.target.value;
            if (path && !pages.includes(path)) setPages((current) => [...current, path]);
            setMessage("");
          }}
          className="min-h-10 min-w-0 flex-1 rounded-xl border border-gold-200 bg-white px-3 py-2 text-sm text-maroon-800 sm:flex-none"
        >
          <option value="">Add to page…</option>
          {pageOptions.filter((page) => !pages.includes(page.path)).map((page) => (
            <option key={page.path} value={page.path}>
              {page.label}{page.hidden ? " (hidden page)" : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="min-h-10 rounded-xl bg-maroon-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? "Saving…" : "Save pages"}
        </button>
      </div>
      {message ? <p role="status" className={`mt-2 text-xs ${message === "Saved." ? "text-emerald-700" : "text-red-700"}`}>{message}</p> : null}
    </li>
  );
}

export default function AdminBannerPlacement({
  banners,
  pageOptions,
  bannerPages,
  shopExteriorText,
}: {
  banners: BannerOption[];
  pageOptions: BannerPageOption[];
  bannerPages: Record<string, string[]>;
  shopExteriorText: ShopExteriorText;
}) {
  const [query, setQuery] = useState("");
  const filtered = banners.filter((banner) =>
    `${banner.title} ${banner.source}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl">
      <AdminNav active="banners" />
      <ShopExteriorBannerEditor initialText={shopExteriorText} />
      <div className="mt-6">
        <h1 className="font-display text-2xl font-bold text-maroon-800">Banner pages</h1>
        <p className="mt-1 text-sm text-maroon-700/70">
          Add a banner to several pages, or remove it from one page. Save each banner after changing its pages.
        </p>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a banner or category…"
          aria-label="Find a banner"
          className="mt-4 w-full rounded-xl border border-gold-200 bg-white px-4 py-2 text-sm text-maroon-800"
        />
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {filtered.map((banner) => (
          <BannerRow
            key={banner.id}
            banner={banner}
            pageOptions={pageOptions}
            initialPages={selectedPages(banner, bannerPages)}
          />
        ))}
      </ul>
      {!filtered.length ? <p className="mt-6 text-sm text-maroon-700/70">No banners found.</p> : null}
    </div>
  );
}
