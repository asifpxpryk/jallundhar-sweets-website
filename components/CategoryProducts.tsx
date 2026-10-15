import type { ReactNode } from "react";
import Image from "next/image";
import { hasCatalogPhoto, keepsComingSoonCards } from "@/lib/catalogPhoto";
import type { MenuItem } from "@/lib/types";
import BackLink from "./BackLink";
import HashScroll from "./HashScroll";
import CategoryProductGrid from "./CategoryProductGrid";
import { CategoryProductCount } from "./CategoryCatalogBar";

export default function CategoryProducts({
  name,
  items,
  image,
  extra,
  hasExtra,
  menuSlug,
  aisleSection,
  aisleSlug,
  productCount,
}: {
  name: string;
  items: MenuItem[];
  image?: string;
  extra?: ReactNode;
  hasExtra?: boolean;
  menuSlug?: string;
  aisleSection?: string;
  aisleSlug?: string;
  productCount?: number;
}) {
  const counted =
    productCount ??
    (aisleSection === "general" && !keepsComingSoonCards(aisleSlug)
      ? items.filter((item) => hasCatalogPhoto(item)).length
      : items.length);
  return (
    <section className="pb-10">
      <HashScroll />
      <p className="px-4 pt-2.5 text-center text-[11px] font-medium leading-4 text-maroon-700/60 sm:px-6 sm:text-xs">
        Images are for illustration purposes only.{" "}
        <span className="block sm:inline">Actual product may vary.</span>
      </p>
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {image && (
            <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#fff8f0] shadow-md ring-2 ring-gold-200">
              <Image
                src={image.split("?")[0]}
                alt={name}
                fill
                sizes="80px"
                unoptimized
                className="object-contain p-[3px]"
              />
            </span>
          )}
          <h1 className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 font-display text-2xl font-bold leading-tight text-maroon-800 sm:text-3xl">
            <span className="min-w-0">{name}</span>
            <CategoryProductCount count={counted} />
          </h1>
          <BackLink />
        </div>
        {extra}
        <CategoryProductGrid
          items={items}
          menuSlug={menuSlug}
          hasExtra={hasExtra ?? Boolean(extra)}
          aisleSection={aisleSection}
          aisleSlug={aisleSlug}
        />
      </div>
    </section>
  );
}
