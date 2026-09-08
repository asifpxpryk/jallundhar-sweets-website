import { notFound } from "next/navigation";
import CategoryProducts from "@/components/CategoryProducts";
import GeneralAisleNav from "@/components/GeneralAisleNav";
import { getSection } from "@/lib/sections";
import { loadMenu } from "@/lib/loadMenu";
import { isSectionHidden, loadStoreVisibility } from "@/lib/storeVisibility";

export const revalidate = 60;

export const metadata = {
  title: "General | Jallundhar Sweets & Bakers",
  alternates: { canonical: "/general" },
};

export default async function GeneralPage() {
  const visibility = await loadStoreVisibility();
  if (isSectionHidden(visibility, "general")) notFound();
  const meta = getSection("general");
  const categories = await loadMenu();
  const category = categories.find((c) => c.slug === "general");

  return (
    <CategoryProducts
      name={meta?.name ?? "General"}
      items={category?.items ?? []}
      image={meta?.image}
      extra={<GeneralAisleNav />}
      menuSlug="general"
    />
  );
}
