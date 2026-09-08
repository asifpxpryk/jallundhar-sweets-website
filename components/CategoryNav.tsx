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
            <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#fff8f0] p-[3px] shadow-sm ring-1 ring-gold-100 transition hover:ring-gold-300 sm:h-24 sm:w-24 lg:h-28 lg:w-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={encodeURI(cat.image)}
                alt={cat.name}
                className="h-full w-full object-contain"
              />
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
