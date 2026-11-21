"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { smallPhotoSrc } from "@/lib/smallPhoto";

export const IMAGE_COMING_SOON = "/products/image-coming-soon.jpg";

function directImageSrc(src: string) {
  if (!src.includes("/_next/image")) return src;
  try {
    const url = new URL(src, "https://jallundhar.local");
    const original = url.searchParams.get("url");
    return original ? decodeURIComponent(original) : src;
  } catch {
    return src;
  }
}

export default function ProductImage({
  src,
  alt,
  sizes,
  className,
  priority = false,
  small = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  /** A list shows the small copy of the photo; the product page shows the photo itself. */
  small?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  // The small copy could not be made or read: the photo itself is shown instead.
  const [smallFailed, setSmallFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    setSmallFailed(false);
  }, [src]);
  const missing = !src || failed;
  const full = directImageSrc(src);
  const shown = small && !smallFailed ? smallPhotoSrc(full) : full;
  const showsSmall = shown !== full;

  return (
    <Image
      src={missing ? IMAGE_COMING_SOON : shown}
      alt={missing ? "Image coming soon" : alt}
      fill
      sizes={sizes}
      unoptimized
      priority={priority}
      className={missing ? "object-cover" : className}
      draggable={false}
      onContextMenu={(event) => event.preventDefault()}
      onError={() => {
        if (missing) return;
        if (showsSmall) setSmallFailed(true);
        else setFailed(true);
      }}
    />
  );
}
