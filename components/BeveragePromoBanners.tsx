import Image from "next/image";
import Link from "next/link";
import type { CatalogEntry } from "@/lib/categoryCatalog";
import type { StoreVisibility } from "@/lib/storeVisibility";
import { bannerId, bannerShowsOn } from "@/lib/bannerPlacement";

type Tone = "mango" | "mint" | "cocoa" | "gold" | "rose" | "lemon" | "ice" | "blue" | "cola" | "green" | "slate" | "orange";

type Banner = {
  title: string;
  description: string;
  image: string;
  alt: string;
  tone: Tone;
  fullImage?: boolean;
};

const themes: Record<Tone, { background: string; color: string; foreground: string; button: string }> = {
  mango: { background: "bg-[#edb963]", color: "#edb963", foreground: "text-[#503419]", button: "bg-[#503419] text-white" },
  mint: { background: "bg-[#d5e7d9]", color: "#d5e7d9", foreground: "text-[#244a3e]", button: "bg-[#244a3e] text-white" },
  cocoa: { background: "bg-[#614137]", color: "#614137", foreground: "text-white", button: "bg-white text-[#614137]" },
  gold: { background: "bg-[#f0db99]", color: "#f0db99", foreground: "text-[#50371d]", button: "bg-[#50371d] text-white" },
  rose: { background: "bg-[#e8c3cd]", color: "#e8c3cd", foreground: "text-[#5b293b]", button: "bg-[#5b293b] text-white" },
  lemon: { background: "bg-[#f0e9ac]", color: "#f0e9ac", foreground: "text-[#454223]", button: "bg-[#454223] text-white" },
  ice: { background: "bg-[#d7ebf8]", color: "#d7ebf8", foreground: "text-[#1b3a6b]", button: "bg-[#1b3a6b] text-white" },
  blue: { background: "bg-[#d3e7ed]", color: "#d3e7ed", foreground: "text-[#244659]", button: "bg-[#244659] text-white" },
  cola: { background: "bg-[#793c3b]", color: "#793c3b", foreground: "text-white", button: "bg-white text-[#793c3b]" },
  green: { background: "bg-[#cce5d4]", color: "#cce5d4", foreground: "text-[#28503a]", button: "bg-[#28503a] text-white" },
  slate: { background: "bg-[#343e43]", color: "#343e43", foreground: "text-white", button: "bg-white text-[#343e43]" },
  orange: { background: "bg-[#f1bd84]", color: "#f1bd84", foreground: "text-[#5b321e]", button: "bg-[#5b321e] text-white" },
};

export const beverageHighlights: Record<string, [Banner, Banner]> = {
  juices: [
    { title: "Mango Nectar", description: "A fruity favorite for every day.", image: "/products/juices/aylo-mango-nectar-1000ml-bottle.jpg", alt: "Aylo mango nectar bottle", tone: "mango" },
    { title: "Coconut Water", description: "A light and refreshing sip.", image: "/products/juices/aqua-coco-100-natural-coconut-water-330ml.jpg", alt: "Aqua Coco coconut water", tone: "mint" },
  ],
  "powdered-drinks": [
    { title: "Chocolate Malt", description: "Mix up a comforting cocoa drink.", image: "/products/powdered-drinks/nestle-milo-powder-pouch-500g.jpg", alt: "Nestle Milo chocolate malt powder", tone: "cocoa" },
    { title: "Fruit Drink Mixes", description: "Bright flavor ready to stir.", image: "/products/powdered-drinks/tang-orange-tub-750g.jpg", alt: "Tang orange powdered drink mix", tone: "gold" },
  ],
  "squash-syrup": [
    { title: "Classic Sharbat", description: "A cool glass for warm days.", image: "/products/squash-syrup/qarshi-jam-e-shirin-1500ml.jpg", alt: "Qarshi Jam-e-Shirin sharbat", tone: "rose" },
    { title: "Lemon Squash", description: "A citrus refreshment to share.", image: "/products/squash-syrup/mitchell-s-lemon-squash-800ml.jpg", alt: "Mitchell's lemon squash", tone: "lemon" },
  ],
  "drinking-water": [
    { title: "Jallundhar Water", description: "Pure drinking water for every day.", image: "/images/jallundhar-water-banner.jpg", alt: "Jallundhar pure drinking water bottles", tone: "ice", fullImage: true },
    { title: "Family Size Water", description: "Stay stocked up on hydration.", image: "/products/drinking-water/nestle-pure-life-drinking-water-5-litres.jpg", alt: "Nestle Pure Life five litre water bottle", tone: "blue" },
  ],
  "soft-drinks": [
    { title: "Classic Cola", description: "Chilled refreshment for any moment.", image: "/products/soft-drinks/coca-cola-bottle-500ml.jpg", alt: "Coca-Cola 500ml bottle", tone: "cola" },
    { title: "Cream Soda", description: "A sweet, fizzy local favorite.", image: "/products/soft-drinks/pakola-creme-soda-can-250ml.jpg", alt: "Pakola cream soda can", tone: "green" },
  ],
  "energy-drinks": [
    { title: "Red Bull", description: "Pick up an energy drink on the go.", image: "/products/energy-drinks/red-bull-energy-drink-250ml.jpg", alt: "Red Bull energy drink can", tone: "slate" },
    { title: "Monster Mango", description: "Tropical flavor with a bold kick.", image: "/products/energy-drinks/monster-mango-loco-blue-energy-juice-500ml.jpg", alt: "Monster Mango Loco energy drink", tone: "orange" },
  ],
};

export default function BeveragePromoBanners({
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
    .filter((aisle) => !aisle.hidden && beverageHighlights[aisle.slug])
    .map((aisle) => ({
      aisle,
      banners: beverageHighlights[aisle.slug]
        .map((banner) => ({ ...banner, id: bannerId("beverage", banner.title, aisle.slug) }))
        .filter((banner) => bannerShowsOn(visibility, banner.id, "/beverage", page)),
    }))
    .filter((group) => group.banners.length > 0);
  if (featuredAisles.length === 0) return null;

  return (
    <section aria-label="Beverage category highlights" className={compact ? "contents" : "mt-10 space-y-10"}>
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
                  className={`group relative flex min-h-[220px] overflow-hidden rounded-3xl sm:min-h-[225px] ${theme.background} ${theme.foreground} shadow-sm transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-maroon-700`}
                >
                  <div className={`absolute inset-y-0 right-0 ${banner.fullImage ? "left-0" : "w-[58%] bg-white"}`}>
                    <Image
                      src={banner.image}
                      alt={banner.alt}
                      fill
                      sizes={banner.fullImage ? "(min-width: 640px) 540px, 100vw" : "(min-width: 640px) 320px, 58vw"}
                      unoptimized
                      className={`${banner.fullImage ? "object-cover object-center" : "object-contain p-1"} transition-transform duration-500 group-hover:scale-[1.04]`}
                    />
                  </div>
                  <div
                    className={`absolute inset-y-0 right-0 ${banner.fullImage ? "left-0" : "w-[65%]"}`}
                    style={{ background: `linear-gradient(to right, ${theme.color}, transparent ${banner.fullImage ? "75%" : "78%"})` }}
                  />
                  <div className="relative z-10 flex w-[62%] flex-col items-start px-5 py-5 sm:w-[55%] sm:px-7 sm:py-6">
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] opacity-85">Jallundhar Beverage</p>
                      <h3 className="font-display text-xl font-bold leading-tight sm:text-2xl">{banner.title}</h3>
                      <p className="mt-2 max-w-xs text-xs leading-relaxed opacity-90 sm:text-sm">{banner.description}</p>
                    </div>
                    <span className={`mt-auto inline-flex items-center rounded-full px-3 py-2 text-[11px] font-semibold shadow-sm transition-transform group-hover:translate-x-1 sm:text-xs ${theme.button}`}>
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
