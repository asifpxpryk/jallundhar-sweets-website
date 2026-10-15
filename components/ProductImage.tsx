"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const missing = !src || failed;

  return (
    <Image
      src={missing ? IMAGE_COMING_SOON : directImageSrc(src)}
      alt={missing ? "Image coming soon" : alt}
      fill
      sizes={sizes}
      unoptimized
      priority={priority}
      className={missing ? "object-cover" : className}
      draggable={false}
      onContextMenu={(event) => event.preventDefault()}
      onError={() => {
        if (!missing) setFailed(true);
      }}
    />
  );
}
