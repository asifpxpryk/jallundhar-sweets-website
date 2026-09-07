import { supabase } from "@/lib/supabase";
import type { MenuCategory } from "@/lib/types";
import StorefrontApp from "@/components/StorefrontApp";

export const revalidate = 60;

async function getCategories(): Promise<MenuCategory[]> {
  const { data: categories, error: catError } = await supabase
    .from("menu_categories")
    .select("id, slug, name, sort_order")
    .order("sort_order");

  const { data: items, error: itemError } = await supabase
    .from("menu_items")
    .select("id, category_id, name, description, price, image_url, is_available, sort_order")
    .eq("is_available", true)
    .order("sort_order");

  if (catError || itemError || !categories) {
    return [];
  }

  return categories.map((c) => ({
    ...c,
    items: (items || []).filter((i) => i.category_id === c.id),
  }));
}

export default async function Home() {
  const categories = await getCategories();

  return <StorefrontApp categories={categories} />;
}
