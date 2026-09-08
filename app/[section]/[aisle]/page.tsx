import { notFound } from "next/navigation";
import CategoryProducts from "@/components/CategoryProducts";
import { GENERAL_AISLES, getGeneralAisle, isGeneralAisle } from "@/lib/generalAisles";
import { loadAisleItems } from "@/lib/loadAisleItems";

export const dynamicParams = true;

export function generateStaticParams() {
  return GENERAL_AISLES.map((aisle) => ({ section: "general", aisle: aisle.slug }));
}

export function generateMetadata({ params }: { params: { section: string; aisle: string } }) {
  if (params.section !== "general") return { title: "Jallundhar Sweets & Bakers" };
  const aisle = getGeneralAisle(params.aisle);
  return {
    title: aisle
      ? `${aisle.name} | Jallundhar Sweets & Bakers`
      : "Jallundhar Sweets & Bakers",
  };
}

export default function NestedAislePage({
  params,
}: {
  params: { section: string; aisle: string };
}) {
  if (params.section !== "general" || !isGeneralAisle(params.aisle)) notFound();
  const aisle = getGeneralAisle(params.aisle)!;
  const items = loadAisleItems(aisle.slug);

  return (
    <CategoryProducts
      name={aisle.name}
      items={items}
      image={aisle.image}
    />
  );
}
