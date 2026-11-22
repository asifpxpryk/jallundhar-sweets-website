import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryProducts from "@/components/CategoryProducts";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { loosePackAisle, LOOSE_PACK_SECTION } from "@/lib/loosePacks";
import { OG_DEFAULTS } from "@/lib/seo";

type Props = { params: { aisle: string } };

export function generateStaticParams() {
  return [{ aisle: "dry-fruits" }, { aisle: "masala-jaat" }];
}

export function generateMetadata({ params }: Props): Metadata {
  const aisle = loosePackAisle(params.aisle);
  if (!aisle) return {};
  const title = `${aisle.name} 250g Packs in Rahim Yar Khan | Jallundhar Sweets & Bakers`;
  const description = `${aisle.name} in 250g packs in Rahim Yar Khan from Jallundhar Sweets & Bakers, Shahi Road. Order online or on WhatsApp.`;
  return {
    title,
    description,
    alternates: { canonical: aisle.href },
    openGraph: { ...OG_DEFAULTS, title, description, url: aisle.href },
  };
}

export default function LoosePackAislePage({ params }: Props) {
  const aisle = loosePackAisle(params.aisle);
  if (!aisle) notFound();
  return (
    <>
    <BreadcrumbJsonLd crumbs={[{ name: LOOSE_PACK_SECTION.name, path: LOOSE_PACK_SECTION.href }, { name: aisle.name, path: aisle.href }]} />
    <CategoryProducts
      name={aisle.name}
      items={[...aisle.items]}
      image={aisle.image || undefined}
      aisleSection={LOOSE_PACK_SECTION.slug}
      aisleSlug={aisle.slug}
    />
    </>
  );
}
