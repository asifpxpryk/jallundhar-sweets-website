import Image from "next/image";
import Link from "next/link";
import type { ShopExteriorText } from "@/lib/shopExteriorBanner";

export default function ShopExteriorBanner({ text }: { text: ShopExteriorText }) {
  return (
    <section className="my-7 w-full overflow-hidden bg-maroon-900 text-white" aria-label="Visit Jallundhar shop">
      <div className="relative aspect-[4/3] w-full bg-[#15100e] sm:aspect-[1672/941]">
        <Image
          src="/images/shop-exterior.webp"
          alt="Jallundhar Sweets & Bakers shop exterior on Shahi Road at night"
          fill
          sizes="100vw"
          unoptimized
          className="object-cover object-center"
        />
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-7 sm:px-8 sm:py-9 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="max-w-2xl">
          {text.eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gold-300 sm:text-sm">{text.eyebrow}</p> : null}
          <h2 className="font-display text-2xl font-bold leading-tight sm:text-4xl">{text.heading}</h2>
          {text.description ? <p className="mt-2 text-sm leading-relaxed text-white/85 sm:text-base">{text.description}</p> : null}
        </div>
        {text.buttonLabel ? <Link href="/visit" className="inline-flex min-h-11 w-fit shrink-0 items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-bold text-maroon-900 shadow-lg transition hover:bg-gold-300">{text.buttonLabel}<span aria-hidden>→</span></Link> : null}
      </div>
    </section>
  );
}
