import type { MenuItem } from "@/lib/types";
import ProductCard from "./ProductCard";
import BackLink from "./BackLink";
import HashScroll from "./HashScroll";

export default function CategoryProducts({
  name,
  items,
  image,
}: {
  name: string;
  items: MenuItem[];
  image?: string;
}) {
  return (
    <section className="py-10">
      <HashScroll />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={encodeURI(image)}
              alt={name}
              className="h-20 w-20 rounded-full bg-[#fff8f0] object-contain p-[3px] shadow-md ring-2 ring-gold-200"
            />
          )}
          <h1 className="min-w-0 flex-1 font-display text-2xl font-bold text-maroon-800 sm:text-3xl">{name}</h1>
          <BackLink />
        </div>
        {items.length === 0 ? (
          <p className="mt-8 text-maroon-700/70">Is section mein abhi items nahi hain.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
