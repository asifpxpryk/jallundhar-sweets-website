import Image from "next/image";
import Link from "next/link";
import type { CatalogEntry } from "@/lib/categoryCatalog";
import type { StoreVisibility } from "@/lib/storeVisibility";
import { bannerId, bannerShowsOn } from "@/lib/bannerPlacement";

type Tone = "cocoa" | "gold" | "saffron" | "tomato" | "orange" | "blue" | "cream" | "slate" | "rose" | "ice" | "lavender" | "butter";

type Banner = {
  title: string;
  description: string;
  image: string;
  alt: string;
  tone: Tone;
};

const themes: Record<Tone, { background: string; color: string; foreground: string; button: string }> = {
  cocoa: { background: "bg-[#4a2530]", color: "#4a2530", foreground: "text-white", button: "bg-white text-[#4a2530]" },
  gold: { background: "bg-[#e9d5ad]", color: "#e9d5ad", foreground: "text-[#4b2818]", button: "bg-[#4b2818] text-white" },
  saffron: { background: "bg-[#edb766]", color: "#edb766", foreground: "text-[#4c2b18]", button: "bg-[#4c2b18] text-white" },
  tomato: { background: "bg-[#9e302b]", color: "#9e302b", foreground: "text-white", button: "bg-white text-[#9e302b]" },
  orange: { background: "bg-[#de6e32]", color: "#de6e32", foreground: "text-white", button: "bg-white text-[#9c3e1a]" },
  blue: { background: "bg-[#dce9f0]", color: "#dce9f0", foreground: "text-[#273c56]", button: "bg-[#273c56] text-white" },
  cream: { background: "bg-[#f0e1bb]", color: "#f0e1bb", foreground: "text-[#3f342c]", button: "bg-[#3f342c] text-white" },
  slate: { background: "bg-[#35423e]", color: "#35423e", foreground: "text-white", button: "bg-white text-[#35423e]" },
  rose: { background: "bg-[#efd4dc]", color: "#efd4dc", foreground: "text-[#58283c]", button: "bg-[#58283c] text-white" },
  ice: { background: "bg-[#d6e8ed]", color: "#d6e8ed", foreground: "text-[#274657]", button: "bg-[#274657] text-white" },
  lavender: { background: "bg-[#e3ddf4]", color: "#e3ddf4", foreground: "text-[#3d3b65]", button: "bg-[#3d3b65] text-white" },
  butter: { background: "bg-[#f2dea9]", color: "#f2dea9", foreground: "text-[#574021]", button: "bg-[#574021] text-white" },
};

export const generalHighlights: Record<string, Banner[]> = {
  chocolates: [
    { title: "Chocolate Bars", description: "A favorite treat for any day.", image: "/products/chocolates/twix-xtra-chocolate-72gm.jpg", alt: "Twix Xtra chocolate bar", tone: "cocoa" },
    { title: "Chocolate Gifts", description: "A sweet surprise to share.", image: "/products/chocolates/ferry-rose-chocolate-100gm-t-8.jpg", alt: "Ferry Rose chocolate box", tone: "gold" },
    { title: "Dubai Kunafa", description: "Pistachio filled chocolate to savor.", image: "/products/chocolates/besto-dubai-kunafa-chocolate-pistachio-100gm.jpg", alt: "Besto Dubai Kunafa pistachio chocolate", tone: "slate" },
    { title: "Dark Chocolate", description: "Rich cocoa for a deeper treat.", image: "/products/chocolates/lals-chocolate-56-cocoa-pure-dark-gluten-free-85g.jpg", alt: "Lals 56 percent cocoa dark chocolate", tone: "gold" },
  ],
  cooking: [
    { title: "Biryani Masala", description: "Bring bold flavor to the table.", image: "/products/cooking/national-masala-biryani.webp", alt: "National Biryani Masala", tone: "saffron" },
    { title: "Kitchen Favorites", description: "Everyday essentials for every meal.", image: "/products/cooking/national-foods-tomato-ketchup-800gm.webp", alt: "National tomato ketchup", tone: "tomato" },
    { title: "BBQ Sauces", description: "Add a smoky finish to every bite.", image: "/products/cooking/national-drizzl-american-bbq-sauce-315g.jpg", alt: "National Drizzl American BBQ sauce", tone: "tomato" },
    { title: "Spice Essentials", description: "The finishing touch for home cooking.", image: "/products/cooking/national-garam-masala-powder.webp", alt: "National garam masala powder", tone: "saffron" },
  ],
  noodles: [
    { title: "Spicy Ramen", description: "A quick meal with a kick.", image: "/products/noodles/samyang-ramen-extra-spicy-soup-type-instant-noodles-korean-noodles-halal-120g.webp", alt: "Samyang spicy ramen", tone: "orange" },
    { title: "Cup Noodles", description: "Ready whenever hunger strikes.", image: "/products/noodles/mr-noodles-chicken-flavour-cup-60gm.png", alt: "Mr. Noodles chicken cup", tone: "blue" },
    { title: "Family Packs", description: "Enough noodles for everyone.", image: "/products/noodles/knorr-noodles-chicken-party-pack-6-packs-inside.jpg", alt: "Knorr chicken noodles party pack", tone: "blue" },
    { title: "Classic Noodles", description: "A quick and tasty pantry favorite.", image: "/products/noodles/indomie-chicken-flavour-instant-noodles-70g.webp", alt: "Indomie chicken instant noodles", tone: "orange" },
  ],
  snacks: [
    { title: "Classic Chips", description: "A satisfying salty crunch.", image: "/products/snacks/shahi-chips-salted-100-rs.webp", alt: "Shahi salted chips", tone: "cream" },
    { title: "Pepper Chips", description: "A little more flavor in every bite.", image: "/products/snacks/shahi-chips-black-pepper-100-rs.webp", alt: "Shahi black pepper chips", tone: "slate" },
    { title: "Toffee Popcorn", description: "A sweet crunch for snack time.", image: "/products/snacks/korneez-toffee-popcorn-120-rs-1.webp", alt: "Korneez toffee popcorn", tone: "saffron" },
    { title: "Nachos", description: "Crunchy bites with bold flavor.", image: "/products/snacks/noms-nachos-cream-herb-80g.webp", alt: "Noms cream and herb nachos", tone: "blue" },
  ],
  "personal-care": [
    { title: "Rosy Glow", description: "An everyday bath time favorite.", image: "/products/personal-care/lux-soap-rosy-glow-105gm.webp", alt: "Lux Rosy Glow soap", tone: "rose" },
    { title: "Daily Hair Care", description: "Find your daily care essentials.", image: "/products/personal-care/dove-shampoo-daily-care-2-in-1-200-ml.webp", alt: "Dove Daily Care shampoo", tone: "ice" },
    { title: "Face Care", description: "Refresh your daily routine.", image: "/products/personal-care/ponds-face-wash-bright-beauty-50-gm.webp", alt: "Pond's Bright Beauty face wash", tone: "rose" },
    { title: "Body Lotion", description: "Care for your skin every day.", image: "/products/personal-care/nivea-body-lotion-extra-bright-repair-protect-vc-380-ml.webp", alt: "Nivea Extra Bright body lotion", tone: "ice" },
  ],
  "baby-care": [
    { title: "Baby Powder", description: "Gentle care for little ones.", image: "/products/baby-care/nexton-baby-powder-100gm.png", alt: "Nexton baby powder", tone: "lavender" },
    { title: "Baby Shampoo", description: "Bath time made simple.", image: "/products/baby-care/johnsons-baby-shampoo-mild-100ml.png", alt: "Johnson's baby shampoo", tone: "butter" },
    { title: "Baby Lotion", description: "Soft skin care for little ones.", image: "/products/baby-care/johnsons-baby-lotion-300ml.png", alt: "Johnson's baby lotion", tone: "rose" },
    { title: "Baby Bath", description: "A gentle start to bath time.", image: "/products/baby-care/johnson-s-top-to-toe-hair-body-baby-bath-200ml.png", alt: "Johnson's top-to-toe baby bath", tone: "butter" },
  ],
};

export default function GeneralPromoBanners({
  aisles,
  visibility,
  page,
  compact = false,
}: {
  aisles: CatalogEntry[];
  visibility: StoreVisibility;
  page: string;
  compact?: boolean;
}) {
  const featuredAisles = aisles
    .filter((aisle) => !aisle.hidden && generalHighlights[aisle.slug])
    .map((aisle) => ({
      aisle,
      banners: generalHighlights[aisle.slug]
        .map((banner) => ({ ...banner, id: bannerId("general", banner.title, aisle.slug) }))
        .filter((banner) => bannerShowsOn(visibility, banner.id, "/general", page)),
    }))
    .filter((group) => group.banners.length > 0);
  if (featuredAisles.length === 0) return null;

  return (
    <section aria-label="General category highlights" className={compact ? "contents" : "mt-10 space-y-10"}>
      {featuredAisles.map(({ aisle, banners }) => (
        <div key={aisle.slug} className={compact ? "contents" : undefined}>
          {!compact && <h2 className="mb-4 font-display text-xl font-bold text-maroon-800 sm:text-2xl">{aisle.name}</h2>}
          <div className={compact ? "contents" : "grid gap-4 sm:grid-cols-2"}>
            {banners.map((banner) => {
              const theme = themes[banner.tone];
              return (
                <Link
                  key={banner.id}
                  href={aisle.href}
                  className={`group relative block overflow-hidden rounded-3xl ${theme.background} ${theme.foreground} shadow-sm transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-maroon-700`}
                >
                  <div className="absolute inset-y-0 right-0 w-[58%] bg-white">
                    <Image
                      src={banner.image}
                      alt={banner.alt}
                      fill
                      sizes="(min-width: 640px) 320px, 58vw"
                      unoptimized
                      className="object-contain p-1 transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div
                    className="absolute inset-y-0 right-0 w-[65%]"
                    style={{ background: `linear-gradient(to right, ${theme.color}, transparent 78%)` }}
                  />
                  <div className="relative z-10 flex min-h-[190px] w-[58%] flex-col items-start justify-center px-5 py-6 sm:min-h-[225px] sm:w-[54%] sm:px-7">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] opacity-85">Jallundhar General</p>
                    <h3 className="font-display text-xl font-bold leading-tight sm:text-2xl">{banner.title}</h3>
                    <p className="mt-2 max-w-xs text-xs leading-relaxed opacity-90 sm:text-sm">{banner.description}</p>
                    <span className={`mt-4 inline-flex items-center rounded-full px-3 py-2 text-[11px] font-semibold shadow-sm transition-transform group-hover:translate-x-1 sm:text-xs ${theme.button}`}>
                      Shop {aisle.name}<span aria-hidden="true" className="ml-1.5">→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
