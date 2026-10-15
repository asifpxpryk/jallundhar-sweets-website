import LoosePackBanner from "@/components/LoosePackBanner";

export default function LoosePacksHomeBanner() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-2 pt-5 sm:px-6">
      <LoosePackBanner
        href="/dry-fruits-masala"
        eyebrow="250g packs"
        title="Dry Fruits & Masala Jaat"
        text="Dry fruits, nuts and spices. Each card is one 250g pack."
        cta="Shop packs"
        desktopImage="/loose-packs/banners/dry-fruits-desktop-v2.webp"
        mobileImage="/loose-packs/banners/dry-fruits-mobile-v2.webp"
      />
    </section>
  );
}
