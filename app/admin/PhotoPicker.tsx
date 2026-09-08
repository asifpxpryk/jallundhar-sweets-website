"use client";

import { useState } from "react";

export default function PhotoPicker({ currentUrl }: { currentUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(null);
  const shown = preview || currentUrl || "";

  return (
    <label className="block text-sm text-maroon-800 sm:col-span-2">
      Photo
      <div className="mt-1 flex items-center gap-3">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-xs text-maroon-700/50">
            No pic
          </span>
        )}
        <input
          name="photo"
          type="file"
          accept="image/*"
          className="min-w-0 flex-1 text-sm text-maroon-800 file:mr-3 file:rounded-lg file:border-0 file:bg-maroon-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) {
              setPreview(null);
              return;
            }
            setPreview(URL.createObjectURL(file));
          }}
        />
      </div>
      <p className="mt-1 text-xs text-maroon-700/60">
        Use the camera or gallery on mobile. No need to paste a URL.
      </p>
    </label>
  );
}
