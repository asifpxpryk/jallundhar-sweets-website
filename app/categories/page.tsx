import CategoryNav from "@/components/CategoryNav";
import BackLink from "@/components/BackLink";
import HomeDoors from "@/components/HomeDoors";

export const metadata = {
  title: "All Categories – Bakery, Sweets & More in Rahim Yar Khan | Jallundhar Sweets & Bakers",
  description:
    "Bakery, sweets, snacks, dairy, drinks and groceries from Jallundhar Sweets & Bakers, Shahi Road, Rahim Yar Khan. Order online or on WhatsApp.",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return (
    <div className="py-6">
      <div className="mx-auto flex max-w-6xl items-center px-4 sm:px-6">
        <h1 className="flex-1 font-display text-2xl font-bold text-maroon-800">
          All Categories <span className="text-base font-semibold text-maroon-700/70">in Rahim Yar Khan</span>
        </h1>
        <BackLink />
      </div>
      <CategoryNav />
      <HomeDoors />
    </div>
  );
}
