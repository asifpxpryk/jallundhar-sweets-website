"use client";

import { useState } from "react";
import Image from "next/image";

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
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={70}
      priority={priority}
      className={className}
      draggable={false}
      onContextMenu={(event) => event.preventDefault()}
      onError={() => setFailed(true)}
    />
  );
}
