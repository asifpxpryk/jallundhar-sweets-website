import HomePromoCard from "@/components/HomePromoCard";

export default function WaterPromoBanner() {
  return (
    <HomePromoCard
      id="home-drinking-water"
      label="JALLUNDHAR DRINKING WATER"
      title={
        <>
          Water is the
          <br />
          foundation of life.
        </>
      }
      description="Jallundhar Pure Drinking Water, every day."
      href="/product/drinking-water-jallundhar-pure-water-600ml"
      cta="Shop Jallundhar Water"
      desktopSrc="/homepage-banners-v2/water-desktop-v2.webp"
      mobileSrc="/homepage-banners-v2/water-mobile-v2.webp"
    />
  );
}
