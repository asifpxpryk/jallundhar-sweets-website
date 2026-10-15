import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryProducts from "@/components/CategoryProducts";
import { loosePackAisle, LOOSE_PACK_SECTION } from "@/lib/loosePacks";
import { OG_DEFAULTS } from "@/lib/seo";

type Props = { params: { aisle: string } };

export function generateStaticParams() {
  return [{ aisle: "dry-fruits" }, { aisle: "masala-jaat" }];
}

export function generateMetadata({ params }: Props): Metadata {
  const aisle = loosePackAisle(params.aisle);
  if (!aisle) return {};
  const title = `${aisle.name} — 250g packs`;
  const description = `${aisle.name} in 250g packs from Jallundhar Sweets & Bakers.`;
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
    <CategoryProducts
      name={aisle.name}
      items={[...aisle.items]}
      image={aisle.image || undefined}
      aisleSection={LOOSE_PACK_SECTION.slug}
      aisleSlug={aisle.slug}
    />
  );
}
