import Image from "next/image";
import Link from "next/link";
import type { MenuItem } from "@/lib/types";
import type { StoreVisibility } from "@/lib/storeVisibility";
import { bannerId, bannerShowsOn } from "@/lib/bannerPlacement";

type Banner = {
  title: string;
  description: string;
  cta: string;
  href: string;
  image: string;
  imageAlt: string;
  background: string;
  color: string;
  foreground: string;
  button: string;
};

export default function SweetsPromoBanners({
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
  const productPhoto = (id: string, fallback: string) =>
    items.find((item) => item.id === id && item.image_url)?.image_url ?? fallback;
  const productPhotoBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-photos/`;

  const banners: Banner[] = [
    {
      title: "Special Sweets",
      description: "Signature mithai for your sweetest moments.",
      cta: "Explore Special",
      href: "/sweets/special",
      image: productPhoto("4629", "/products/4629.webp"),
      imageAlt: "Badaam barfi from the Special sweets category",
      background: "bg-[#601c2d]",
      color: "#601c2d",
      foreground: "text-white",
      button: "bg-white text-[#601c2d]",
    },
    {
      title: "Traditional Mithai",
      description: "The classics everyone comes back for.",
      cta: "Explore Traditional",
      href: "/sweets/traditional",
      image: productPhoto("4620", "/products/4620.webp"),
      imageAlt: "Laddu from the Traditional sweets category",
      background: "bg-[#edcf98]",
      color: "#edcf98",
      foreground: "text-[#4b2818]",
      button: "bg-[#4b2818] text-white",
    },
    {
      title: "Seasonal Sweets",
      description: "Something special for this season.",
      cta: "Explore Seasonal",
      href: "/sweets/seasonal",
      image: productPhoto(
        "item-1788984470035",
        `${productPhotoBase}1788984469063-2f6b6f10-a53c-4666-9dee-5ee2d46f6599.jpg`
      ),
      imageAlt: "Desi Ghee Panjeri from the Seasonal sweets category",
      background: "bg-[#714437]",
      color: "#714437",
      foreground: "text-white",
      button: "bg-white text-[#714437]",
    },
    {
      title: "Sugarfree Sweets",
      description: "Explore our sugarfree favorites.",
      cta: "Explore Sugarfree",
      href: "/sweets/sugarfree",
      image: productPhoto(
        "item-1788974716263",
        `${productPhotoBase}1788974880744-44f2dd6e-f5da-4612-8cef-88c6ebb92e11.jpg`
      ),
      imageAlt: "Burfi from the Sugarfree sweets category",
      background: "bg-[#dce8d7]",
      color: "#dce8d7",
      foreground: "text-[#2d4c38]",
      button: "bg-[#2d4c38] text-white",
    },
    {
      title: "Akhroti Sohan Halwa",
      description: "A Jallundhar favorite to enjoy and share.",
      cta: "View Sohan Halwa",
      href: "/product/4661",
      image: productPhoto("4661", "/products/4661.webp"),
      imageAlt: "Akhroti Sohan Halwa from the Special sweets category",
      background: "bg-[#30232c]",
      color: "#30232c",
      foreground: "text-white",
      button: "bg-white text-[#30232c]",
    },
  ];

  const visibleBanners = banners
    .map((banner) => ({ ...banner, id: bannerId("sweets", banner.title) }))
    .filter((banner) => bannerShowsOn(visibility, banner.id, "/sweets", page));
  if (visibleBanners.length === 0) return null;

  return (
    <section aria-label="Sweets highlights" className={compact ? "contents" : "mt-10 space-y-5"}>
      {visibleBanners.map((banner, index) => (
        <Link
          key={banner.id}
          href={banner.href}
          className={`group relative block overflow-hidden rounded-3xl ${banner.background} ${banner.foreground} shadow-sm transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-maroon-700`}
        >
          <div className="absolute inset-y-0 right-0 w-[58%] sm:w-[55%]">
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
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-85 sm:text-xs">Jallundhar Sweets</p>
            <h2 className={`font-display font-bold leading-tight ${compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-4xl"}`}>{banner.title}</h2>
            <p className={`mt-2 max-w-xs text-xs leading-relaxed opacity-90 ${compact ? "sm:text-sm" : "sm:text-base"}`}>{banner.description}</p>
            <span className={`mt-4 inline-flex items-center rounded-full py-2 font-semibold shadow-sm transition-transform group-hover:translate-x-1 ${compact ? "px-3 text-[11px] sm:text-xs" : "px-4 text-xs sm:text-sm"} ${banner.button}`}>
              {banner.cta}
              <span aria-hidden="true" className="ml-2">→</span>
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
