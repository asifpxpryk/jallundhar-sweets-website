import HomePromoCard from "@/components/HomePromoCard";

export default function HomeGeneralTile() {
  return (
    <HomePromoCard
      id="home-general-store"
      className="sm:col-span-2"
      label="JALLUNDHAR GENERAL"
      title="General Store"
      description="Groceries, chocolates, noodles and everyday essentials."
      href="/general"
      cta="Shop General"
      desktopSrc="/homepage-banners-v2/general-desktop-v2.webp"
      mobileSrc="/homepage-banners-v2/general-mobile-v2.webp"
    />
  );
}
