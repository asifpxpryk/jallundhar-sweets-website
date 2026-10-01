import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import SweetProductActions from "@/components/SweetProductActions";
import { loadProduct } from "@/lib/product";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 60;

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await loadProduct(params.id);
  if (!result) return { title: "Product unavailable" };
  const { item } = result;
  const title = `${item.name} | ${SITE_NAME}`;
  const description = item.description || `Order ${item.name} from ${SITE_NAME}.`;
  const url = `/product/${encodeURIComponent(item.id)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: item.image_url ? [{ url: item.image_url, alt: item.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const result = await loadProduct(params.id);
  if (!result) notFound();
  const { item, section, aisle } = result;
  const browseHref = aisle?.href ?? section.href;
  const browseName = aisle?.name ?? section.name;

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
        <span className="text-maroon-900">{item.name}</span>
      </nav>

      <div className="grid gap-8 rounded-3xl bg-white p-4 shadow-md sm:p-8 md:grid-cols-2 md:gap-10">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gold-50">
          {item.image_url ? (
            <ProductImage
              src={item.image_url}
              alt={item.name}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gold-600">Photo coming soon</div>
          )}
        </div>

        <div className="flex flex-col justify-center py-2">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gold-600">
            {aisle ? `${section.name} · ${aisle.name}` : section.name}
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight text-maroon-900 sm:text-4xl">{item.name}</h1>
          {item.description ? <p className="mt-4 whitespace-pre-line text-maroon-700/80">{item.description}</p> : null}
          <SweetProductActions item={item} />
          <Link href={browseHref} className="mt-8 text-sm font-semibold text-maroon-700 underline underline-offset-4 hover:text-maroon-900">
            Browse more {browseName}
          </Link>
        </div>
      </div>
    </main>
  );
}
