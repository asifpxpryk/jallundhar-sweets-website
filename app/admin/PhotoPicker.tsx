"use client";

import { useRef, useState } from "react";

export default function PhotoPicker({ currentUrl }: { currentUrl?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const shown = cleared ? "" : preview || currentUrl || "";

  function pickFile() {
    setMenuOpen(false);
    inputRef.current?.click();
  }

  function removePhoto() {
    setPreview(null);
    setCleared(true);
    setMenuOpen(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="block text-sm text-maroon-800 sm:col-span-2">
      Photo
      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (shown ? setMenuOpen((open) => !open) : pickFile())}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gold-50"
          aria-label={shown ? "Change photo" : "Add photo"}
        >
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-maroon-700/50">
              No pic
            </span>
          )}
        </button>
        {menuOpen && shown ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={pickFile}
              className="rounded-lg bg-maroon-700 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={removePhoto}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Remove
            </button>
          </div>
        ) : (
          <p className="text-xs text-maroon-700/60">
            {shown ? "Click the picture to replace or remove it." : "Tap to add a photo."}
          </p>
        )}
        <input
          ref={inputRef}
          name="photo"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setCleared(false);
            setPreview(URL.createObjectURL(file));
          }}
        />
        {cleared ? <input type="hidden" name="clear_image" value="true" /> : null}
      </div>
    </div>
  );
}
