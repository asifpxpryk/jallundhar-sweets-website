import CategoryProducts from "@/components/CategoryProducts";
import GeneralAisleNav from "@/components/GeneralAisleNav";
import { getSection } from "@/lib/sections";
import { loadMenu } from "@/lib/loadMenu";

export const revalidate = 300;

export const metadata = {
  title: "General | Jallundhar Sweets & Bakers",
};

export default async function GeneralPage() {
  const meta = getSection("general");
  const categories = await loadMenu();
  const category = categories.find((c) => c.slug === "general");

  return (
    <CategoryProducts
      name={meta?.name ?? "General"}
      items={category?.items ?? []}
      image={meta?.image}
      extra={<GeneralAisleNav />}
    />
  );
}
