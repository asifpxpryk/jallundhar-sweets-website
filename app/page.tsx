import Hero from "@/components/Hero";
import CategoryNav from "@/components/CategoryNav";
import BestsellerScroller from "@/components/BestsellerScroller";
import GiftPromoCard from "@/components/GiftPromoCard";
import { loadMenu } from "@/lib/loadMenu";
import type { MenuCategory, MenuItem } from "@/lib/types";

export const revalidate = 60;

export const metadata = {
  alternates: { canonical: "/" },
};

function pickBestsellers(categories: MenuCategory[]): MenuItem[] {
  const all = categories.flatMap((c) => c.items);
  const preferred = ["gulab", "barfi", "jaman", "cham cham", "halwa", "pairay", "laddu", "ladu"];
  const withImage = all.filter((i) => i.image_url);
  const rest = all.filter((i) => !i.image_url);
  const ranked = [...withImage].sort((a, b) => {
    const score = (name: string) => (preferred.some((p) => name.toLowerCase().includes(p)) ? 0 : 1);
    return score(a.name) - score(b.name);
  });

  const picked: MenuItem[] = [];
  const seen = new Set<string>();
  for (const item of [...ranked, ...rest]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    picked.push(item);
    if (picked.length >= 12) break;
  }
  return picked;
}

export default async function Home() {
  const categories = await loadMenu();
  const bestsellers = pickBestsellers(categories);

  return (
    <>
      <Hero />
      <CategoryNav />
      <BestsellerScroller items={bestsellers} />
      <GiftPromoCard />
    </>
  );
}
