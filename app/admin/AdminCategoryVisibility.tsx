"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { listAisles, listSections, type CatalogEntry } from "@/lib/categoryCatalog";
import type { StoreVisibility } from "@/lib/storeVisibility";
import { addCategory, renameCategory, setCategoryHidden } from "./actions";
import { withCompressedPhoto } from "@/lib/compressImage";
import CategoryPhotoButton from "@/components/CategoryPhotoButton";
import AdminNav from "./AdminNav";

function CategoryRow({
  entry,
  parent,
  busy,
  onToggle,
}: {
  entry: CatalogEntry;
  parent: string;
  busy: boolean;
  onToggle: (entry: CatalogEntry) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <li className="rounded-xl border border-gold-100 px-3 py-2">
      {editing ? (
        <form
          className="flex flex-wrap items-center gap-2"
          action={async (formData) => {
            setError(null);
            const result = await renameCategory(formData);
            if (result.error) {
              setError(result.error);
              return;
            }
            setEditing(false);
            router.refresh();
          }}
        >
          <input type="hidden" name="kind" value={entry.kind} />
          <input type="hidden" name="slug" value={entry.slug} />
          <input type="hidden" name="parent" value={parent} />
          <input
            name="name"
            required
            defaultValue={entry.name}
            aria-label={`Rename ${entry.name}`}
            className="min-w-0 flex-1 rounded-lg border border-gold-200 px-2 py-1 text-sm text-maroon-800"
          />
          <button type="submit" className="rounded-full bg-maroon-800 px-3 py-1 text-sm font-medium text-white">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-sm text-maroon-700/70">
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-sm text-maroon-800">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#fff8f0] ring-1 ring-gold-200">
              {entry.image ? (
                <Image
                  src={entry.image.split("?")[0]}
                  alt=""
                  fill
                  sizes="40px"
                  unoptimized
                  className="object-contain"
                />
              ) : null}
            </span>
            <span className="min-w-0">
              {entry.name}
              {entry.hidden ? <span className="ml-2 text-xs text-maroon-700/60">hidden</span> : null}
            </span>
          </span>
          <span className="flex shrink-0 flex-wrap justify-end gap-2">
            <CategoryPhotoButton
              kind={entry.kind}
              slug={entry.slug}
              parent={parent}
              disabled={busy}
              onError={setError}
              className="rounded-full border border-gold-200 bg-white px-3 py-1 text-sm font-medium text-maroon-800"
            />
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full border border-gold-200 bg-white px-3 py-1 text-sm font-medium text-maroon-800"
            >
              Rename
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onToggle(entry)}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                entry.hidden ? "bg-maroon-700 text-white" : "border border-gold-200 bg-white text-maroon-800"
              }`}
            >
              {entry.hidden ? "Show" : "Hide"}
            </button>
          </span>
        </div>
      )}
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </li>
  );
}

export default function AdminCategoryVisibility({
  visibility,
}: {
  visibility: StoreVisibility;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sections = listSections(visibility);

  async function toggle(entry: CatalogEntry) {
    setBusy(true);
    setMessage(null);
    const formData = new FormData();
    formData.set("kind", entry.kind);
    formData.set("slug", entry.slug);
    formData.set("hidden", entry.hidden ? "false" : "true");
    const result = await setCategoryHidden(formData);
    setBusy(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage(entry.hidden ? "Category is now visible." : "Category is now hidden.");
    router.refresh();
    setTimeout(() => setMessage(null), 3500);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <AdminNav active="categories" />
      <div className="mt-4">
        <h2 className="font-display text-xl font-bold text-maroon-800">Categories</h2>
        <p className="text-sm text-maroon-700/70">
          Add a category, change its photo, rename it, or hide it. Hidden categories leave the shop. Their products stay saved.
        </p>
      </div>
      {message ? <p className="mt-3 rounded-xl bg-maroon-700 px-3 py-2 text-sm text-white">{message}</p> : null}

      <section className="mt-6 rounded-2xl border border-gold-200 bg-white p-4">
        <h3 className="font-semibold text-maroon-800">New category</h3>
        <form
          className="mt-3 grid gap-3"
          action={async (formData) => {
            await withCompressedPhoto(formData);
            const parent = String(formData.get("parent") || "");
            formData.set("kind", parent ? "aisle" : "section");
            setMessage(null);
            const result = await addCategory(formData);
            if (result.error) {
              setMessage(result.error);
              return;
            }
            setMessage("Category added.");
            router.refresh();
          }}
        >
          <input
            name="name"
            required
            placeholder="Category name"
            className="rounded-xl border border-gold-200 px-3 py-2"
          />
          <label className="text-sm text-maroon-800">
            Where it appears
            <select name="parent" className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-2" defaultValue="">
              <option value="">Main menu (home page)</option>
              {sections.map((section) => (
                <option key={section.slug} value={section.slug}>
                  Inside {section.name}
                </option>
              ))}
            </select>
          </label>
          <input name="photo" type="file" accept="image/*" aria-label="Category photo" className="text-sm" />
          <button type="submit" className="rounded-xl bg-maroon-700 px-4 py-2 font-semibold text-white">
            Add category
          </button>
        </form>
      </section>

      <CategoryGroup title="Main menu" entries={sections} parent="" busy={busy} onToggle={toggle} />
      {sections.map((section) => {
        const aisles = listAisles(visibility, section.slug);
        if (!aisles.length) return null;
        return (
          <CategoryGroup
            key={section.slug}
            title={section.name}
            entries={aisles}
            parent={section.slug}
            busy={busy}
            onToggle={toggle}
          />
        );
      })}
    </div>
  );
}

function CategoryGroup({
  title,
  entries,
  parent,
  busy,
  onToggle,
}: {
  title: string;
  entries: CatalogEntry[];
  parent: string;
  busy: boolean;
  onToggle: (entry: CatalogEntry) => void;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-gold-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-maroon-800">{title}</h3>
      <ul className="mt-2 space-y-2">
        {entries.map((entry) => (
          <CategoryRow
            key={`${entry.kind}:${entry.parent}:${entry.slug}`}
            entry={entry}
            parent={parent}
            busy={busy}
            onToggle={onToggle}
          />
        ))}
      </ul>
    </section>
  );
}
