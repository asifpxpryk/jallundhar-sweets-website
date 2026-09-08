import type { ReactNode } from "react";
import Image from "next/image";

export default function PromoBanner({
  image,
  alt,
  objectPosition = "78% center",
  imageClassName,
  overlay,
  overlayClassName,
  children,
}: {
  image: string;
  alt: string;
  objectPosition?: string;
  imageClassName?: string;
  overlay: string;
  overlayClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl">
      <Image
        src={image}
        alt={alt}
        fill
        sizes="(min-width: 1152px) 1152px, 100vw"
        quality={72}
        className={`object-cover ${imageClassName ?? ""}`}
        style={imageClassName ? undefined : { objectPosition }}
      />
      <div className={`absolute inset-0 ${overlayClassName ?? ""}`} style={overlayClassName ? undefined : { background: overlay }} />
      <div className="relative z-10 flex min-h-[11rem] max-w-[58%] flex-col justify-center gap-1.5 px-5 py-5 sm:min-h-[13rem] sm:max-w-[54%] sm:px-8 sm:py-7 sm:gap-2">
        {children}
      </div>
    </section>
  );
}
