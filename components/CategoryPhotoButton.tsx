"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setCategoryPhoto } from "@/app/admin/actions";
import { withCompressedPhoto } from "@/lib/compressImage";

export default function CategoryPhotoButton({
  kind,
  slug,
  parent = "",
  disabled = false,
  onError,
  className,
}: {
  kind: "section" | "aisle";
  slug: string;
  parent?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
  className: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className={className}
      >
        {busy ? "Saving" : "Photo"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Category photo"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          const formData = new FormData();
          formData.set("kind", kind);
          formData.set("slug", slug);
          formData.set("parent", parent);
          formData.set("photo", file);
          await withCompressedPhoto(formData);
          setBusy(true);
          const result = await setCategoryPhoto(formData);
          setBusy(false);
          if (result.error) {
            onError?.(result.error);
            return;
          }
          router.refresh();
        }}
      />
    </>
  );
}
