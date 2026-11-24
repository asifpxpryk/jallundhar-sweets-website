"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { smallPhotoRouteSrc, smallPhotoSrc } from "@/lib/smallPhoto";
import { preferWebp } from "@/lib/webpSrc";

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
  // The small copy is tried as a built file, then from the route that makes it (a photo added since
  // the last build), and if neither answers the photo itself is shown instead.
  const [smallTries, setSmallTries] = useState(0);
  useEffect(() => {
    setFailed(false);
    setSmallTries(0);
  }, [src]);
  const missing = !src || failed;
  const full = directImageSrc(src);
  const shown = !small || smallTries > 1 ? full : smallTries === 0 ? smallPhotoSrc(full) : smallPhotoRouteSrc(full);
  const showsSmall = shown !== full;
  // Local photos that have a lighter WebP copy (lib/webpVersions.json) use it.
  const finalSrc = showsSmall ? shown : preferWebp(full);

  return (
    <Image
      src={missing ? IMAGE_COMING_SOON : finalSrc}
      alt={missing ? "Image coming soon" : alt || "Image coming soon"}
      fill
      sizes={sizes}
      unoptimized
      priority={priority}
      className={missing ? "object-cover" : className}
      draggable={false}
      onContextMenu={(event) => event.preventDefault()}
      onError={() => {
        if (missing) return;
        if (showsSmall) setSmallTries((tries) => tries + 1);
        else setFailed(true);
      }}
    />
  );
}
