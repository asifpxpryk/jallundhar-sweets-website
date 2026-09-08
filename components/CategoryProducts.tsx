import type { ReactNode } from "react";
import Image from "next/image";
import type { MenuItem } from "@/lib/types";
import BackLink from "./BackLink";
import HashScroll from "./HashScroll";
import CategoryProductGrid from "./CategoryProductGrid";

export default function CategoryProducts({
  name,
  items,
  image,
  extra,
  menuSlug,
}: {
  name: string;
  items: MenuItem[];
  image?: string;
  extra?: ReactNode;
  menuSlug?: string;
}) {
  return (
    <section className="py-10">
      <HashScroll />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {image && (
            <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#fff8f0] shadow-md ring-2 ring-gold-200">
              <Image
                src={image.split("?")[0]}
                alt={name}
                fill
                sizes="80px"
                quality={70}
                className="object-contain p-[3px]"
              />
            </span>
          )}
          <h1 className="min-w-0 flex-1 font-display text-2xl font-bold text-maroon-800 sm:text-3xl">{name}</h1>
          <BackLink />
        </div>
        {extra}
        <CategoryProductGrid items={items} menuSlug={menuSlug} hasExtra={Boolean(extra)} />
      </div>
    </section>
  );
}
