"use client";

import { useState } from "react";
import Image from "next/image";

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
  if (!src || failed) return null;

  return (
    <Image
      src={directImageSrc(src)}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized
      priority={priority}
      className={className}
      draggable={false}
      onContextMenu={(event) => event.preventDefault()}
      onError={() => setFailed(true)}
    />
  );
}
