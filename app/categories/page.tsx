import CategoryNav from "@/components/CategoryNav";

export const metadata = {
  title: "Categories | Jallundhar Sweets & Bakers",
};

export default function CategoriesPage() {
  return (
    <div className="py-6">
      <h1 className="mx-auto max-w-6xl px-4 font-display text-2xl font-bold text-maroon-800 sm:px-6">
        Categories
      </h1>
      <CategoryNav />
    </div>
  );
}
