import Link from "next/link";
import { SECTIONS } from "@/lib/sections";

export default function CategoryNav() {
  return (
    <div className="mx-auto max-w-6xl px-3 py-2 sm:px-6 sm:py-3" id="categories">
      <div className="grid grid-cols-3 gap-x-3 gap-y-2 sm:grid-cols-6 sm:flex sm:justify-center sm:gap-x-8 sm:gap-y-3">
        {SECTIONS.map((cat) => (
          <Link
            key={cat.slug}
            href={`/${cat.slug}`}
            className="flex flex-col items-center gap-1 text-center"
          >
            <span className="flex h-[4.35rem] w-[4.35rem] items-center justify-center overflow-hidden rounded-full bg-[#fff8f0] text-3xl shadow-sm ring-1 ring-gold-100 transition hover:ring-gold-300 sm:h-24 sm:w-24 sm:text-4xl">
              {"image" in cat && cat.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.image}
                  alt={cat.name}
                  className={
                    cat.slug === "sweets"
                      ? "h-full w-full object-cover"
                      : "h-[92%] w-[92%] object-contain"
                  }
                />
              ) : (
                cat.emoji
              )}
            </span>
            <span className="text-sm font-semibold leading-tight text-maroon-700 sm:text-base">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
