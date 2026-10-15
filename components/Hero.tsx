import Image from "next/image";
import Link from "next/link";
import { DELIVERY_NOTE } from "@/lib/site";

export default function Hero() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6">
      <section id="top" className="relative min-h-[13.5rem] overflow-hidden rounded-3xl bg-[#1e080a] text-cream sm:min-h-[16rem]">
        <div className="absolute inset-y-0 right-0 w-[40%] overflow-hidden sm:w-[52%]">
          <div className="hero-photo absolute -inset-[4%]">
            <Image
              src="/hero.webp"
              alt="Jallundhar mithai tray"
              fill
              priority
              unoptimized
              sizes="(min-width: 1152px) 600px, 52vw"
              className="object-cover object-[64%_center]"
            />
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(30,8,10,0.97) 0%, rgba(30,8,10,0.94) 42%, rgba(30,8,10,0.4) 66%, rgba(30,8,10,0.08) 100%)",
          }}
        />
        <div className="relative flex min-h-[13.5rem] flex-col justify-center gap-2 px-5 py-5 sm:min-h-[16rem] sm:px-8 sm:py-7">
          <div>
            <span className="w-fit rounded-full bg-gold-500/20 px-3 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-gold-300 sm:text-xs">
              Tradition in Every Bite · Since 1959
            </span>
            <span className="hero-since-line mt-1.5 block h-px w-16 bg-gold-300" aria-hidden />
          </div>
          <p className="max-w-[58%] font-display text-xl font-bold leading-tight sm:max-w-md sm:text-3xl">
            Bringing Sweetness to Your Moments
          </p>
          <p className="max-w-[58%] text-xs leading-relaxed text-cream/80 sm:max-w-sm sm:text-sm">
            Premium mithai, fresh bakery, custom cakes, pizza, burgers &amp; more — Order Now.
          </p>
          <p className="max-w-[58%] text-xs leading-relaxed text-cream/70 sm:max-w-sm">{DELIVERY_NOTE}</p>
          <div className="flex w-fit max-w-[11.5rem] flex-col items-stretch gap-2 pt-1 sm:max-w-md sm:flex-row sm:flex-wrap">
            <Link
              href="/sweets"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 px-4 py-2 text-sm font-semibold text-maroon-900 shadow-lg shadow-gold-900/20 transition hover:bg-gold-400 sm:px-5"
            >
              Shop Now
              <span aria-hidden>→</span>
            </Link>
            <a
              href="tel:03001538440"
              className="rounded-full border border-cream/30 px-3 py-2 text-center text-xs font-semibold text-cream transition hover:bg-cream/10 sm:px-5 sm:text-sm"
            >
              Call: 0300 153 8440
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
