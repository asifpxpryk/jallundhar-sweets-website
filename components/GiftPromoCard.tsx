import HomePromoCard from "@/components/HomePromoCard";

export default function GiftPromoCard() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
      <HomePromoCard
        id="home-gift-packs"
        label="GIFT PACKS"
        title={
          <>
            Make Every
            <br />
            Occasion Sweeter
          </>
        }
        description="Thoughtful gift packs for your loved ones."
        href="/celebrations"
        cta="View Gift Packs"
        desktopSrc="/homepage-banners-v2/gift-desktop-v2.webp"
        mobileSrc="/homepage-banners-v2/gift-mobile-v2.webp"
      />
    </div>
  );
}
