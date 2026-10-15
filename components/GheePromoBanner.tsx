import HomePromoCard from "@/components/HomePromoCard";

export default function GheePromoBanner() {
  return (
    <HomePromoCard
      id="home-desi-ghee"
      label="TRADITIONAL TASTE"
      title={
        <>
          Start your day with a
          <br />
          desi ghee paratha
        </>
      }
      description="Rich aroma. Traditional taste."
      href="/product/4728"
      cta="Explore Desi Ghee"
      desktopSrc="/homepage-banners-v2/ghee-desktop-v2.webp"
      mobileSrc="/homepage-banners-v2/ghee-mobile-v2.webp"
    />
  );
}
