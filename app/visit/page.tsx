import type { Metadata } from "next";
import Image from "next/image";
import { SHOP_MAP_EMBED_URL, SHOP_MAP_URL, SITE_CITY, SITE_NAME, SITE_PHONE, SITE_STREET } from "@/lib/site";

export const metadata: Metadata = {
  title: `Visit our shop | ${SITE_NAME}`,
  description: `Find ${SITE_NAME} on ${SITE_STREET}, ${SITE_CITY}.`,
  alternates: { canonical: "/visit" },
};

export default function VisitPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-maroon-900 shadow-lg sm:aspect-[16/10]">
          <Image src="/images/shop-exterior.webp" alt="Jallundhar shop exterior on Shahi Road" fill sizes="(min-width: 1024px) 60vw, 100vw" unoptimized className="object-cover" priority />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-700">Find us in Rahim Yar Khan</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-maroon-900 sm:text-4xl">Visit our shop</h1>
          <p className="mt-4 text-lg text-maroon-800">{SITE_NAME}<br />{SITE_STREET}, {SITE_CITY}</p>
          <p className="mt-4 text-sm leading-relaxed text-maroon-700/75">We look forward to welcoming you for sweets, bakery treats and café favorites.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {SHOP_MAP_URL ? <a href={SHOP_MAP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-maroon-800 px-5 py-3 text-sm font-semibold text-white hover:bg-maroon-900">Open in Google Maps ↗</a> : null}
            <a href={`tel:${SITE_PHONE}`} className="inline-flex min-h-11 items-center rounded-full border border-gold-300 px-5 py-3 text-sm font-semibold text-maroon-800 hover:bg-gold-50">Call us</a>
          </div>
        </div>
      </div>
      {SHOP_MAP_EMBED_URL ? <div className="mt-10 overflow-hidden rounded-3xl border border-gold-200 shadow-sm"><iframe src={SHOP_MAP_EMBED_URL} title="Jallundhar shop location" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-[360px] w-full border-0 sm:h-[460px]" /></div> : null}
    </main>
  );
}
