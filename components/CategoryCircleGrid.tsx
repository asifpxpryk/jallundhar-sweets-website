"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addCategory, renameCategory, setCategoryHidden } from "@/app/admin/actions";
import { withCompressedPhoto } from "@/lib/compressImage";
import CategoryPhotoButton from "./CategoryPhotoButton";
import { useIsAdmin } from "./AdminSessionContext";

export type CategoryCircle = {
  href: string;
  name: string;
  image?: string;
  slug: string;
  hidden?: boolean;
};

function CircleFace({ name, image }: { name: string; image?: string }) {
  return (
    <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#fff8f0] p-[3px] shadow-sm ring-1 ring-gold-300 sm:h-24 sm:w-24 lg:h-28 lg:w-28">
      <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#fff8f0] ring-1 ring-gold-200">
        {image ? (
          <Image src={image.split("?")[0]} alt={name} fill sizes="112px" unoptimized className="object-cover" />
        ) : (
          <span className="h-full w-full rounded-full bg-cream" />
        )}
      </span>
    </span>
  );
}

export default function CategoryCircleGrid({
  items,
  columns = 3,
  flush = false,
  kind,
  parent = "",
}: {
  items: CategoryCircle[];
  columns?: 3 | 4 | 6;
  flush?: boolean;
  kind: "section" | "aisle";
  parent?: string;
}) {
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const shown = isAdmin ? items : items.filter((item) => !item.hidden);

  if (!shown.length && !isAdmin) return null;

  const colClass =
    columns === 6
      ? "grid-cols-3 sm:flex sm:flex-wrap sm:justify-center"
      : columns === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : "grid-cols-3";

  async function hide(item: CategoryCircle) {
    setBusy(true);
    setMessage(null);
    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("slug", item.slug);
    formData.set("hidden", item.hidden ? "false" : "true");
    const result = await setCategoryHidden(formData);
    setBusy(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className={flush ? "mt-6" : "mx-auto max-w-6xl px-3 py-2 sm:px-6 sm:py-3"}>
      {message ? <p className="mb-3 rounded-xl bg-maroon-700 px-3 py-2 text-sm text-white">{message}</p> : null}
      <div className={`grid gap-x-3 gap-y-4 sm:gap-x-8 sm:gap-y-5 ${colClass}`}>
        {shown.map((item) => {
          const open = editing === item.slug;
          return (
            <div key={item.slug} className="flex flex-col items-center gap-1 text-center">
              <Link href={item.href} className={`relative z-10 ${item.hidden ? "opacity-60" : ""}`}>
                <CircleFace name={item.name} image={item.image} />
                {item.hidden ? (
                  <span className="absolute left-1 top-1 rounded-full bg-maroon-800 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Hidden
                  </span>
                ) : null}
              </Link>
              {open ? (
                <form
                  className="mt-1 flex w-full max-w-[9rem] flex-col gap-1"
                  action={async (formData) => {
                    setBusy(true);
                    setMessage(null);
                    const result = await renameCategory(formData);
                    setBusy(false);
                    if (result.error) {
                      setMessage(result.error);
                      return;
                    }
                    setEditing(null);
                    router.refresh();
                  }}
                >
                  <input type="hidden" name="kind" value={kind} />
                  <input type="hidden" name="slug" value={item.slug} />
                  <input type="hidden" name="parent" value={parent} />
                  <input
                    name="name"
                    required
                    defaultValue={item.name}
                    aria-label={`Rename ${item.name}`}
                    className="w-full rounded-lg border border-gold-200 px-2 py-1 text-center text-sm font-semibold text-maroon-800"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-full bg-maroon-800 px-2 py-1 text-[11px] font-semibold text-white"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="text-[11px] font-medium text-maroon-700/70"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <span className="text-sm font-semibold leading-tight text-maroon-800 sm:text-base">{item.name}</span>
              )}
              {isAdmin && !open ? (
                <span className="flex flex-wrap justify-center gap-1">
                  <CategoryPhotoButton
                    kind={kind}
                    slug={item.slug}
                    parent={parent}
                    disabled={busy}
                    onError={setMessage}
                    className="rounded-full border border-gold-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-maroon-800"
                  />
                  <button
                    type="button"
                    onClick={() => setEditing(item.slug)}
                    className="rounded-full border border-gold-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-maroon-800"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => hide(item)}
                    className="rounded-full border border-gold-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-maroon-800"
                  >
                    {item.hidden ? "Show" : "Hide"}
                  </button>
                </span>
              ) : null}
            </div>
          );
        })}
        {isAdmin ? (
          adding ? (
            <form
              className="flex flex-col items-center gap-2 text-center"
              action={async (formData) => {
                await withCompressedPhoto(formData);
                setBusy(true);
                setMessage(null);
                const result = await addCategory(formData);
                setBusy(false);
                if (result.error) {
                  setMessage(result.error);
                  return;
                }
                setAdding(false);
                router.refresh();
              }}
            >
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="parent" value={parent} />
              <span className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-gold-300 bg-white text-3xl text-maroon-800 lg:h-28 lg:w-28">
                +
              </span>
              <input
                name="name"
                required
                placeholder="Category name"
                aria-label="Category name"
                className="w-full max-w-[9rem] rounded-lg border border-gold-200 px-2 py-1 text-center text-sm text-maroon-800"
              />
              <input name="photo" type="file" accept="image/*" aria-label="Category photo" className="w-full max-w-[9rem] text-[11px]" />
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-maroon-800 px-3 py-1 text-[11px] font-semibold text-white"
              >
                Add category
              </button>
              <button type="button" onClick={() => setAdding(false)} className="text-[11px] font-medium text-maroon-700/70">
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex flex-col items-center gap-1 text-center"
              aria-label="Add category"
            >
              <span className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-gold-300 bg-white text-4xl font-light text-maroon-800 transition hover:border-maroon-400 hover:bg-gold-50 lg:h-28 lg:w-28">
                +
              </span>
              <span className="text-sm font-semibold text-maroon-800">Add category</span>
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
