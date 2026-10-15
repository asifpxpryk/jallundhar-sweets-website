import type { Metadata } from "next";
import LoosePackBanner from "@/components/LoosePackBanner";
import { LOOSE_PACK_SECTION } from "@/lib/loosePacks";
import { OG_DEFAULTS } from "@/lib/seo";

const title = "Dry Fruits & Masala Jaat";
const description = "250g packs of dry fruits, nuts and spices from Jallundhar Sweets & Bakers.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: LOOSE_PACK_SECTION.href },
  openGraph: { ...OG_DEFAULTS, title, description, url: LOOSE_PACK_SECTION.href },
};

export default function DryFruitsMasalaPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-display text-3xl font-bold text-maroon-900">Dry Fruits & Masala Jaat</h1>
      <div className="mt-5 grid gap-5">
        <LoosePackBanner
          href="/dry-fruits-masala/dry-fruits"
          eyebrow="Dry fruits"
          title="Dry Fruits & Nuts"
          text="Figs, nuts, dates, seeds and more."
          cta="View dry fruit packs"
          desktopImage="/loose-packs/banners/dry-fruits-desktop-v2.webp"
          mobileImage="/loose-packs/banners/dry-fruits-mobile-v2.webp"
        />
        <LoosePackBanner
          href="/dry-fruits-masala/masala-jaat"
          eyebrow="Spices"
          title="Masala Jaat"
          urdu="مصالحہ جات"
          text="Whole spices and ground masala."
          cta="View masala packs"
          desktopImage="/loose-packs/banners/masala-desktop-v2.webp"
          mobileImage="/loose-packs/banners/masala-mobile-v2.webp"
        />
      </div>
    </main>
  );
}
