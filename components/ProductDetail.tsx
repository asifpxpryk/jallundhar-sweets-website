import Link from "next/link";
import { dealPrice } from "@/lib/dealPrice";
import { customerProductName } from "@/lib/productName";
import BestsellerScroller from "@/components/BestsellerScroller";
import ProductImage from "@/components/ProductImage";
import SweetProductActions from "@/components/SweetProductActions";
import type { MenuItem } from "@/lib/types";

type Crumb = { slug: string; name: string; href: string };

/** One product layout. Every product page renders this, so a change here shows on all of them. */
export default function ProductDetail({
  item,
  section,
  aisle,
  related,
}: {
  item: MenuItem;
  section: Crumb;
  aisle: { name: string; href: string } | null;
  related: MenuItem[];
}) {
  const browseHref = aisle?.href ?? section.href;
  const browseName = aisle?.name ?? section.name;
  const shownName = customerProductName(item.name, item.category_id || section.slug);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-maroon-700/70">
        <Link href={section.href} className="hover:text-maroon-900">{section.name}</Link>
        {aisle ? (
          <>
            <span aria-hidden="true">/</span>
            <Link href={aisle.href} className="hover:text-maroon-900">{aisle.name}</Link>
          </>
        ) : null}
        <span aria-hidden="true">/</span>
        <span className="text-maroon-900">{shownName}</span>
      </nav>

      <div className="grid gap-8 rounded-3xl bg-white p-4 shadow-md sm:p-8 md:grid-cols-2 md:gap-10">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gold-50">
          <ProductImage
            src={item.image_url || ""}
            alt={shownName}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col justify-center py-2">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gold-600">
            {aisle ? `${section.name} · ${aisle.name}` : section.name}
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight text-maroon-900 sm:text-4xl">{shownName}</h1>
          {item.is_deal && item.deal_label && dealPrice(item.deal_label) == null ? (
            <p className="mt-2 text-sm font-semibold text-gold-800">{item.deal_label}</p>
          ) : null}
          {item.description ? <p className="mt-4 whitespace-pre-line text-maroon-700/80">{item.description}</p> : null}
          <SweetProductActions
            item={item}
            showSizeNote={section.slug === "sweets" || section.slug === "bakery" || section.slug === "celebrations"}
          />
          <Link href={browseHref} className="mt-8 text-sm font-semibold text-maroon-700 underline underline-offset-4 hover:text-maroon-900">
            Browse more {browseName}
          </Link>
        </div>
      </div>
      {related.length > 0 ? (
        <div className="mt-10">
          <BestsellerScroller
            items={related}
            embedded
            aisleSection={section.slug}
            title={`More ${browseName}`}
          />
        </div>
      ) : null}
    </main>
  );
}
