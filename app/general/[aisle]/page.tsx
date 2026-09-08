import { notFound } from "next/navigation";
import CategoryProducts from "@/components/CategoryProducts";
import { GENERAL_AISLES, getGeneralAisle, isGeneralAisle } from "@/lib/generalAisles";

export function generateStaticParams() {
  return GENERAL_AISLES.map((aisle) => ({ aisle: aisle.slug }));
}

export function generateMetadata({ params }: { params: { aisle: string } }) {
  const aisle = getGeneralAisle(params.aisle);
  return {
    title: aisle
      ? `${aisle.name} | Jallundhar Sweets & Bakers`
      : "Jallundhar Sweets & Bakers",
  };
}

export default function GeneralAislePage({ params }: { params: { aisle: string } }) {
  if (!isGeneralAisle(params.aisle)) notFound();
  const aisle = getGeneralAisle(params.aisle)!;

  return (
    <CategoryProducts
      name={aisle.name}
      items={[]}
      image={aisle.image}
    />
  );
}
