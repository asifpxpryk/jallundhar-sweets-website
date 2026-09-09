"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem } from "@/lib/types";
import { saveMenuItem } from "./actions";
import PhotoPicker from "./PhotoPicker";
import PlacementFields from "./PlacementFields";
import { withCompressedPhoto } from "@/lib/compressImage";
import { defaultPlacementKey, parsePlacement } from "@/lib/itemPlacement";

function recentlySaved(id: string) {
  if (typeof window === "undefined") return false;
  const at = Number(sessionStorage.getItem(`admin-saved-${id}`) || 0);
  return Date.now() - at < 8000;
}

export default function AdminItemForm({
  item,
  placementKey,
}: {
  item: MenuItem;
  placementKey?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(() =>
    recentlySaved(item.id) ? "saved" : "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const placement = parsePlacement(placementKey || defaultPlacementKey(item));

  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_7rem_auto] sm:items-end"
      onChange={() => {
        if (status !== "idle") {
          setStatus("idle");
          setError(null);
        }
      }}
      action={async (formData) => {
        formData.set("id", item.id);
        formData.set("is_hidden", formData.get("is_hidden") ? "true" : "false");
        formData.set("is_out_of_stock", formData.get("is_out_of_stock") ? "true" : "false");
        await withCompressedPhoto(formData);
        setStatus("saving");
        setError(null);
        const result = await saveMenuItem(formData);
        if (result.error) {
          setStatus("error");
          setError(result.error);
          return;
        }
        sessionStorage.setItem(`admin-saved-${item.id}`, String(Date.now()));
        setStatus("saved");
        router.refresh();
      }}
    >
      <label className="text-sm text-maroon-800">
        Name
        <input
          name="name"
          defaultValue={item.name}
          className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-2"
        />
      </label>
      <label className="text-sm text-maroon-800">
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
      <PlacementFields defaultSection={placement.section} defaultAisle={placement.aisle} />
      <label className="text-sm text-maroon-800 sm:col-span-2">
        Description
        <input
          name="description"
          defaultValue={item.description ?? ""}
          className="mt-1 w-full rounded-xl border border-gold-200 px-3 py-2"
        />
      </label>
      <PhotoPicker currentUrl={item.image_url} />
      <div className="flex flex-col gap-2 text-sm text-maroon-800 sm:col-span-2">
        <label className="flex items-center gap-2">
          <input
            name="is_hidden"
            type="checkbox"
            defaultChecked={Boolean(item.is_hidden)}
            className="h-4 w-4"
          />
          Hide
        </label>
        <label className="flex items-center gap-2">
          <input
            name="is_out_of_stock"
            type="checkbox"
            defaultChecked={!item.is_available}
            className="h-4 w-4"
          />
          Out of stock
        </label>
      </div>
      <button
        type="submit"
        disabled={status === "saving"}
        className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
          status === "saved"
            ? "bg-emerald-600"
            : status === "error"
              ? "bg-red-700"
              : "bg-maroon-700"
        }`}
      >
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Retry" : "Save"}
      </button>
      {error ? <p className="text-sm text-red-700 sm:col-span-3">{error}</p> : null}
    </form>
  );
}
