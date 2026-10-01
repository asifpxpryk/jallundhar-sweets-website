import Image from "next/image";
import Link from "next/link";
import type { MenuItem } from "@/lib/types";
import type { StoreVisibility } from "@/lib/storeVisibility";
import { effectivePlacementKey } from "@/lib/itemPlacement";
import { bannerId, bannerShowsOn } from "@/lib/bannerPlacement";

type Banner = {
  title: string;
  description: string;
  href: string;
  image: string;
  imageAlt: string;
  background: string;
  color: string;
  foreground: string;
  button: string;
};

export default function BakeryPromoBanners({
  items,
  visibility,
  page,
  compact = false,
}: {
  items: MenuItem[];
  visibility: StoreVisibility;
  page: string;
  compact?: boolean;
}) {
  const cakePhoto =
    items.find((item) => item.id === "item-1789182664670" && item.image_url)?.image_url ??
    items.find(
      (item) =>
        effectivePlacementKey(item, visibility) === "bakery:cream-cakes" &&
        /special cake|birthday cake/i.test(item.name) &&
        item.image_url
    )?.image_url ??
    "/bakery-aisles/cream-cakes.png";

  const banners: Banner[] = [
    {
      title: "Birthday & Special Cakes",
      description: "A beautiful cake for every celebration.",
      href: "/bakery/cream-cakes",
      image: cakePhoto,
      imageAlt: "Special celebration cake",
      background: "bg-[#541222]",
      color: "#541222",
      foreground: "text-white",
      button: "bg-white text-[#541222]",
    },
    {
      title: "Pastries",
      description: "A little sweetness for any moment.",
      href: "/bakery/pastries",
      image: "/bakery-aisles/pastries.png",
      imageAlt: "Assorted pastries",
      background: "bg-[#f5d7d4]",
      color: "#f5d7d4",
      foreground: "text-[#581725]",
      button: "bg-[#581725] text-white",
    },
    {
      title: "Dry Cakes",
      description: "The perfect slice with your tea.",
      href: "/bakery/dry-cakes",
      image: "/products/4686.webp",
      imageAlt: "Jallundhar dry cake",
      background: "bg-[#e9d3ad]",
      color: "#e9d3ad",
      foreground: "text-[#4c2818]",
      button: "bg-[#4c2818] text-white",
    },
    {
      title: "Biscuits",
      description: "Crisp, buttery bites to share.",
      href: "/bakery/biscuits",
      image: "/bakery-aisles/biscuits.webp",
      imageAlt: "Assorted Jallundhar biscuits",
      background: "bg-[#3a2931]",
      color: "#3a2931",
      foreground: "text-white",
      button: "bg-white text-[#3a2931]",
    },
    {
      title: "Breads",
      description: "Fresh favorites for every day.",
      href: "/bakery/breads",
      image: "/products/4740.webp",
      imageAlt: "Jallundhar plain bread",
      background: "bg-[#d8e1c4]",
      color: "#d8e1c4",
      foreground: "text-[#2f3c26]",
      button: "bg-[#2f3c26] text-white",
    },
  ];

  const visibleBanners = banners
    .map((banner) => ({ ...banner, id: bannerId("bakery", banner.title) }))
    .filter((banner) => bannerShowsOn(visibility, banner.id, "/bakery", page));
  if (visibleBanners.length === 0) return null;

  return (
    <section aria-label="Bakery highlights" className={compact ? "contents" : "mt-10 space-y-5"}>
      {visibleBanners.map((banner, index) => (
        <Link
          key={banner.id}
          href={banner.href}
          className={`group relative block overflow-hidden rounded-3xl ${banner.background} ${banner.foreground} shadow-sm transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-maroon-700`}
        >
          <div className={`absolute inset-y-0 right-0 w-[58%] sm:w-[55%] ${index === 0 ? "" : "opacity-95"}`}>
            <Image
              src={banner.image.split("?")[0]}
              alt={banner.imageAlt}
              fill
              sizes="(min-width: 1152px) 635px, 58vw"
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              priority={index === 0}
            />
          </div>
          <div
            className="absolute inset-y-0 right-0 w-[65%]"
            style={{ background: `linear-gradient(to right, ${banner.color}, transparent 78%)` }}
          />
          <div className={compact
            ? "relative z-10 flex min-h-[225px] w-[62%] flex-col items-start justify-center px-5 py-6 sm:w-[55%] sm:px-7"
            : `relative z-10 flex w-[55%] flex-col items-start justify-center px-5 py-7 sm:w-[46%] sm:px-10 ${index === 0 ? "min-h-[220px] sm:min-h-[280px]" : "min-h-[190px] sm:min-h-[225px]"}`}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-85 sm:text-xs">Jallundhar Bakery</p>
            <h2 className={`font-display font-bold leading-tight ${compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-4xl"}`}>{banner.title}</h2>
            <p className={`mt-2 max-w-xs text-xs leading-relaxed opacity-90 ${compact ? "sm:text-sm" : "sm:text-base"}`}>{banner.description}</p>
            <span className={`mt-4 inline-flex items-center rounded-full py-2 font-semibold shadow-sm transition-transform group-hover:translate-x-1 ${compact ? "px-3 text-[11px] sm:text-xs" : "px-4 text-xs sm:text-sm"} ${banner.button}`}>
              Explore {banner.title === "Birthday & Special Cakes" ? "Cakes" : banner.title}
              <span aria-hidden="true" className="ml-2">→</span>
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
